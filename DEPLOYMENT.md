# CLUTCH — Production Deployment, Security Architecture & Operations Guide

## 1. System Architecture Overview

```
                                [ Public Internet ]
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │   Nginx Reverse Proxy & Client (80/443)│
                     │   - SSL/TLS Termination               │
                     │   - SPA Static Bundles                │
                     │   - Security Headers (nosniff, DENY)  │
                     └──────┬─────────────────────────┬──────┘
                            │                         │
            REST API (/api) │                         │ WebSocket (/socket.io)
                            ▼                         ▼
                     ┌───────────────────────────────────────┐
                     │          CLUTCH API Server            │
                     │   - Express REST Endpoints            │
                     │   - Socket.IO Real-Time Engine        │
                     │   - Server-Authoritative Scoring      │
                     │   - Cryptographic Auth & Tokens       │
                     └──────┬─────────────────────────┬──────┘
                            │                         │
                            ▼                         ▼
       ┌───────────────────────────────┐   ┌───────────────────────────────┐
       │     PostgreSQL Database       │   │   Isolated Sandbox Runner     │
       │  - ACID Transactions          │   │  - Unprivileged User (UID 1000│
       │  - Accounts, Profiles, Matches│   │  - Network: NONE              │
       │  - Idempotency & Rewards      │   │  - Read-Only Rootfs           │
       └───────────────────────────────┘   │  - 128MB RAM, 1.0 CPU, 32 PIDs│
                                           └───────────────────────────────┘
```

---

## 2. Production Docker Deployment

### Prerequisites
- Docker Engine >= 24.0.0
- Docker Compose >= 2.20.0

### Step-by-Step Launch
1. Clone the repository on your target host:
   ```bash
   git clone <repo-url> clutch-arena
   cd clutch-arena
   ```
2. Copy and customize production environment variables:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your production secrets
   ```
3. Build and launch all container services in detached mode:
   ```bash
   docker compose up -d --build
   ```
4. Verify service status and health checks:
   ```bash
   docker compose ps
   ```
   Expected healthy containers:
   - `clutch-postgres` (healthy on port 5432)
   - `clutch-runner` (isolated container worker)
   - `clutch-api` (healthy on port 4000)
   - `clutch-client` (healthy on port 80)

---

## 3. Database Migration, Backup & Disaster Recovery

### Automatic Initialization
When launching with `docker-compose.yml`, PostgreSQL automatically initializes the schema from `server/src/storage/schema.sql` on first boot.

### JSON to PostgreSQL Migration
To migrate existing player profiles and match records from legacy prototype storage (`clutch_store.json`) into PostgreSQL:
```bash
# Run migration script inside server environment
npm --prefix server run build
node server/dist/storage/migrateJsonToPostgres.js
```
The migration script automatically generates a timestamped rollback backup in `server/data/backups/clutch_store_backup_<timestamp>.json`.

### Database Backup
```bash
# Create compressed SQL dump
docker exec -t clutch-postgres pg_dump -U clutch_admin -d clutch_db -F c -b -v -f /tmp/backup.dump
docker cp clutch-postgres:/tmp/backup.dump ./backups/clutch_db_$(date +%Y%m%d_%H%M%S).dump
```

### Database Restore
```bash
docker cp ./backups/clutch_db_<timestamp>.dump clutch-postgres:/tmp/restore.dump
docker exec -t clutch-postgres pg_restore -U clutch_admin -d clutch_db --clean --if-exists /tmp/restore.dump
```

---

## 4. Execution Sandbox Threat Model & Security Controls

| Threat Vector | Attack Mechanism | Implemented Mitigation & Control |
| :--- | :--- | :--- |
| **Network Evasion** | Untrusted code calls `socket`, `fetch`, `urllib` to exfiltrate secrets or join botnets | Container `network_mode: none` completely disables TCP/UDP network stack; static scanner rejects socket modules |
| **Host Privilege Escalation** | Untrusted code attempts root exploit | Container runs as non-root `sandbox:sandbox` (UID 1000); all Linux capabilities dropped (`--cap-drop ALL`) |
| **Filesystem Tampering** | Untrusted code reads `.env`, `/etc/shadow`, or writes persistent malware | Root filesystem is mounted read-only (`--read-only`); temporary writes restricted to ephemeral in-memory tmpfs (`/tmp:size=64m`) |
| **Fork Bombs** | Subprocess explosion crashes server | Strict kernel process cap (`--pids-limit 32`); descendant process-tree termination on exit |
| **RAM Exhaustion** | Code allocates multi-gigabyte array | Hard cgroup memory ceiling (`--memory 128m`); V8 heap capped (`--max-old-space-size=64`) |
| **Infinite CPU Loops** | Code executes `while(true) {}` | Hard wall-clock 3,000ms timer with SIGKILL process group tree termination |
| **Stdout Flood** | Code prints infinite loop of strings | Output buffer strictly truncated at 50,000 bytes (50KB) |

---

## 5. HTTPS & SSL/TLS Configuration (Production Domain)

To bind an SSL certificate with Let's Encrypt / Certbot:

```nginx
server {
    listen 80;
    server_name clutch.arena www.clutch.arena;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name clutch.arena www.clutch.arena;

    ssl_certificate /etc/letsencrypt/live/clutch.arena/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clutch.arena/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Include client/nginx.conf proxy directives
}
```

---

## 6. Monitoring & Health Endpoints

- **Liveness & Capabilities**: `GET /api/health`
  ```json
  {
    "status": "healthy",
    "timestamp": 1793014200000,
    "uptimeSeconds": 3600,
    "activeRooms": 4,
    "challengesCount": 12,
    "storageEngine": "postgresql",
    "sandboxIsolation": {
      "mode": "docker_container",
      "dockerAvailable": true,
      "enforced": true
    }
  }
  ```
- **Readiness Probe**: `GET /api/ready` -> returns HTTP 200 `{ "ready": true }`
- **Language Availability**: `GET /api/languages` -> reports available compilers and execution modes.

---

## 7. Production Hardening: Docker Daemon Socket Threat Model & Isolation Architecture

### 7.1 Threat Model Analysis: Direct `/var/run/docker.sock` Exposure
In Linux environments, anyone with write access to the Docker daemon socket (`/var/run/docker.sock`) possesses effective root-equivalent control over the host operating system. If an attacker breaches a web-facing API server that mounts the raw Docker socket, they could instruct the Docker daemon to mount host root directories (`-v /:/host`), spawn privileged containers, or escape container boundaries.

> [!CAUTION]
> **Production Requirement:** Never mount the raw host `/var/run/docker.sock` directly into an internet-facing API container in production, and never run `chmod 666 /var/run/docker.sock` on a shared or permanent production host. (The `chmod 666` directive in `.github/workflows/production-gate.yml` is strictly an ephemeral CI testing convenience on single-tenant, disposable GitHub Actions runner VMs destroyed immediately upon job completion.)

### 7.2 Hardened Production Architectures

#### Architecture A: Dedicated Runner Microservice (Default Production Standard)
Defined in `docker-compose.microservice.yml`. Decouples untrusted code execution completely from the API server:
1. The `clutch-api` container does NOT mount `/var/run/docker.sock` anywhere.
2. A separate `clutch-runner-service` container is deployed on an internal, private network (`clutch-internal`).
3. No external host ports are published for the runner service; ingress is only reachable from within the private Docker bridge.
4. The API server dispatches execution payloads to the runner service via `RUNNER_SERVICE_URL=http://clutch-runner-service:5050/execute`.
5. Authentication is strictly enforced with `Authorization: Bearer <RUNNER_SERVICE_SECRET>` and `X-Runner-Secret`.
6. Enforces hard 64KB payload bounds, 8,000ms HTTP timeout with `AbortController`, and `SERVICE_UNAVAILABLE` fail-safe fallback.
7. Even in the theoretical event of an API web compromise, the attacker has zero access to the host Docker daemon.

To deploy Architecture A:
```bash
docker compose -f docker-compose.microservice.yml up -d --build
```

#### Architecture B: Tightly Restricted Docker Socket Proxy & Endpoint Permissions
If running single-host deployments utilizing Docker-in-Docker orchestration, `tecnativa/docker-socket-proxy` must be configured with strict deny-by-default permissions.

> [!WARNING]
> **Critical Endpoint Permission Notice:**
> In `tecnativa/docker-socket-proxy`, setting `POST=1` without explicitly disabling other modules enables POST methods across all permitted endpoints. Merely relying on comments or assuming default safety is insufficient. The proxy MUST explicitly zero out every dangerous API category:

| Endpoint Module | Value | Security Rationale |
| :--- | :--- | :--- |
| `CONTAINERS` | `1` | Allows querying container status and creating ephemeral sandboxes |
| `POST` | `1` | Required to issue container create and start requests |
| `EXEC` | `0` | **CRITICAL:** Denies `POST /containers/{id}/exec` to prevent injecting commands into running system containers |
| `VOLUMES` | `0` | **CRITICAL:** Denies volume management to prevent attackers from mounting host filesystems (`/etc`, `/root`) |
| `NETWORKS` | `0` | Prevents modifying container network topologies or connecting sandboxes to internal networks |
| `BUILD` | `0` | Denies arbitrary image builds that could download external malware |
| `COMMIT` | `0` | Prevents saving mutated containers to local disk |
| `SECRETS` | `0` | Denies access to Docker swarm secrets |
| `SWARM` | `0` | Denies cluster swarm reconfigurations |
| `SYSTEM` | `0` | Denies host system event and disk inspection |
| `INFO` | `0` | Prevents leaking kernel version, operating system details, and daemon configuration |
| `DISTRIBUTION` | `0` | Prevents pushing/pulling images from arbitrary registries |

Example hardened compose definition:
```yaml
  docker-socket-proxy:
    image: tecnativa/docker-socket-proxy:latest
    container_name: clutch-socket-proxy
    restart: unless-stopped
    networks:
      - clutch-internal
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - CONTAINERS=1
      - POST=1
      - EXEC=0
      - VOLUMES=0
      - NETWORKS=0
      - BUILD=0
      - COMMIT=0
      - SECRETS=0
      - SWARM=0
      - SYSTEM=0
      - INFO=0
      - DISTRIBUTION=0
```

---

## 8. Production Environment Variables Audit Matrix

| Variable | Required | Default / Example | Purpose & Boundary |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `production` | Enables production caching, logging, and strict error sanitization |
| `PORT` | Yes | `4000` | HTTP and WebSocket listening port for API server |
| `DATABASE_URL` | Yes | `postgres://user:pass@host:5432/clutch_db` | Connection URI for live PostgreSQL persistence |
| `ALLOWED_ORIGINS` | Yes | `https://clutch.arena` | CORS origin whitelist; wildcards prohibited in production |
| `RUNNER_SERVICE_URL` | Architecture A | `http://clutch-runner-service:5050` | Private internal URL for isolated code execution dispatch |
| `RUNNER_SERVICE_SECRET` | Architecture A | `(32+ character high-entropy token)` | Shared Bearer secret for service-to-service auth |
| `RUNNER_HTTP_TIMEOUT_MS`| Optional | `8000` | Wall-clock abort timeout for microservice requests |
| `JWT_SECRET` | Yes | `(64+ character random string)` | Session signature key; fails closed if default in production |
| `ENFORCE_CONTAINER_SANDBOX` | Yes | `true` | Refuses to execute code without verified container boundary |

---

## 9. PostgreSQL Automated Backup & Recovery Procedures

### 9.1 Automated Daily Backups
On the production host, configure a root cron job (`/etc/cron.d/clutch-db-backup`):

```bash
# Every night at 02:00 AM UTC
0 2 * * * root docker exec -t clutch-postgres pg_dump -U clutch_admin -d clutch_db -F c -b -v -f /var/lib/postgresql/data/backup_$(date +\%Y\%m\%d).dump && find /var/lib/docker/volumes/clutch_postgres_data/_data/backup_*.dump -mtime +14 -delete
```

### 9.2 Manual Snapshot Export
To produce an immediate compressed database dump:
```bash
docker exec -t clutch-postgres pg_dump -U clutch_admin -d clutch_db -F c -f /tmp/clutch_db_manual.dump
docker cp clutch-postgres:/tmp/clutch_db_manual.dump ./clutch_db_manual_$(date +%Y%m%d_%H%M%S).dump
```

### 9.3 Point-in-Time Recovery
To restore a snapshot into an empty or recovered database:
```bash
# 1. Stop web traffic
docker compose stop clutch-api

# 2. Restore database from archive
docker cp ./clutch_db_manual_20261026.dump clutch-postgres:/tmp/clutch_restore.dump
docker exec -t clutch-postgres pg_restore -U clutch_admin -d clutch_db -c -v /tmp/clutch_restore.dump

# 3. Verify table counts and user integrity
docker exec -it clutch-postgres psql -U clutch_admin -d clutch_db -c "SELECT count(*) FROM users; SELECT count(*) FROM match_records;"

# 4. Restart web service
docker compose start clutch-api
```

---

## 10. Public Production Release Status & Release Gate RG-10
**Release Gate RG-10 (Public Production Release) remains strictly ON HOLD.**
Although Release Gates RG-1 through RG-9 have passed and CI pipeline run `40335515714` succeeded, public launch remains on hold until:
1. Target production VPS or bare-metal host is provisioned with verified network boundaries.
2. Architecture A (`docker-compose.microservice.yml`) is deployed with generated production secrets (`RUNNER_SERVICE_SECRET`, `JWT_SECRET`, `DATABASE_PASSWORD`).
3. Domain DNS and Let's Encrypt TLS certificates are bound.
4. Off-site automated database backup sync (e.g. AWS S3 / Cloudflare R2) is scheduled.



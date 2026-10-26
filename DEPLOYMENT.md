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

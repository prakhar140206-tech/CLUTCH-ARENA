# ============================================================================
# CLUTCH BACKEND API SERVER — PRODUCTION DOCKERFILE
# Multi-stage build with unprivileged runtime user
# ============================================================================

# Stage 1: Build
FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Copy root shared types and server files
COPY shared ./shared
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install runtime utilities (including docker CLI for container sandbox orchestration)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl python3 docker.io \
    && rm -rf /var/lib/apt/lists/* \
    && usermod -aG docker node

COPY shared ./shared
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production

# Copy compiled output from builder
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/src/storage/schema.sql ./dist/storage/schema.sql
COPY --chown=node:node server/data ./data

# Run as unprivileged node user
USER node

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]

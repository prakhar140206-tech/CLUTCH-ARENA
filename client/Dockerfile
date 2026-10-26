# ============================================================================
# CLUTCH WEB CLIENT — PRODUCTION DOCKERFILE
# Multi-stage build: Vite compilation into Nginx Alpine runtime
# ============================================================================

# Stage 1: Build Frontend Bundle
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY shared ./shared
COPY client/package*.json ./client/
WORKDIR /app/client
RUN npm ci

COPY client/tsconfig*.json ./
COPY client/vite.config.ts ./
COPY client/tailwind.config.js ./
COPY client/postcss.config.js ./
COPY client/index.html ./
COPY client/src ./src
COPY client/public ./public

RUN npm run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

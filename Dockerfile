# Open Knowledge — production image.
# All instance state (SQLite, uploads, encryption key) lives in /data:
# mount a persistent volume there or your library disappears on redeploy.

FROM node:22-slim AS builder
WORKDIR /app
# Toolchain for native addons (better-sqlite3 compiles via node-gyp).
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Native addons (better-sqlite3, sharp) compile during install.
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    OK_DATA_DIR=/data \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Standalone output carries its own pruned node_modules (native addons
# included — same base image as the builder, so the binaries match).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME /data
EXPOSE 3000
CMD ["node", "server.js"]

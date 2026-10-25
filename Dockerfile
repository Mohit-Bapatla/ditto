# A single long-running Node service; /data MUST be a persistent volume.
FROM node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Only this public URL is needed by prerendered social metadata, never API keys.
ARG PUBLIC_ORIGIN
# No provider secrets are needed during build. This database is disposable.
RUN DATABASE_PATH=/tmp/ditto-build.sqlite npm run build

FROM node:24-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends gosu \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000 \
    DATABASE_PATH=/data/ditto.sqlite COOKIE_SECURE=true REQUIRE_PERSISTENT_VOLUME=true
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --chown=node:node database ./database
COPY --chown=node:node deployment ./deployment
RUN mkdir -p /data && chown node:node /data && chmod 700 /data \
    && chmod +x deployment/entrypoint.sh
EXPOSE 3000
# Root only initializes permissions on Railway's root-owned volume; Node runs as node.
ENTRYPOINT ["/app/deployment/entrypoint.sh"]
CMD ["node", "server.js"]

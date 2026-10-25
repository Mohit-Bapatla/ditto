#!/bin/sh
set -eu
# Do not print environment values: they may contain credentials.
node /app/deployment/preflight.mjs
if [ "$(id -u)" = '0' ]; then
  mkdir -p /data
  chown node:node /data
  # Only application database files; never recursively alter an unrelated mount.
  for file in /data/ditto.sqlite /data/ditto.sqlite-wal /data/ditto.sqlite-shm; do
    if [ -f "$file" ]; then chown node:node "$file"; chmod 600 "$file"; fi
  done
  chmod 700 /data
  exec gosu node /app/deployment/entrypoint.sh "$@"
fi
node /app/deployment/check-storage.mjs
exec "$@"

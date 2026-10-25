# Public HackTX deployment

## Decision: one Railway Node service with one persistent volume

Keep SQLite, the existing authorization/session model, and five-second polling. This avoids changing the schema, synchronization semantics or judging flow before the deadline. Railway provides HTTPS and a persistent volume. Do **not** deploy this app on ephemeral/serverless storage, add replicas, or share the volume between independent app instances. A brief restart/redeploy interruption is expected; data must survive it.

The repository contains a two-stage Dockerfile using Node 24, Railway configuration, storage preflight/integrity checks, `/api/health`, backup tooling and restart-verification tests. No Supabase migration is needed.

Provider references: [Railway volumes](https://docs.railway.com/volumes/reference), [configuration as code](https://docs.railway.com/config-as-code/reference), [CLI](https://docs.railway.com/cli). Volume-backed services cannot use replicas and have brief redeploy downtime. The provider bills for compute/storage; use the existing account plan and spending limits.

## Live deployment and verification

Public URL: **https://ditto-production.up.railway.app**

Railway project `ditto` (`bb53170f-6766-4dc5-92ef-6e9e3a290e47`), production service `ditto`, persistent volume `ditto-volume` mounted at `/data`. Latest verified deployment: `3d70b5f2-0a7e-406f-96f8-3bb97c7de5e4` (2026-10-25 UTC). One instance, sleeping disabled.

Verified: production build, lint, typecheck, 12 unit tests, production-container integration tests, container replacement with the same volume, online SQLite backup integrity, public HTTPS integration tests with independent cookie sessions, and saved sessions/membership/votes/matches after public redeployment and restart. Public Discover and Circles were also opened in a browser. Public automated collaboration checks use independent HTTP cookie clients; a two-device visual polling walkthrough remains a recommended judging rehearsal.

Both provider secrets are configured privately on Railway. Live SerpApi search returned six venues. Meta model access succeeds, but completion requests return HTTP 402 `billing_not_configured`. Resolve billing in the [Meta developer portal](https://dev.meta.ai/billing/) to enable live AI; credentials alone do not resolve it. The explicitly labeled demo itinerary flow passes end to end.

For future CLI access, authenticate with `railway login`; never paste tokens into chat. CLI 5.62.1 has a volume creation bug; the provisioning command below uses the verified 5.71.0 version. Railway currently accepts `railway.json` until 2026-12-01; migrate to its newer infrastructure configuration after HackTX, before that deadline.

## Create or reuse a deployment

First inspect `railway list`. If a Ditto project already exists, use `railway link` to select it and its production environment; inspect its service and volume before changing them. Do not create duplicate projects or replace existing resources.

For a new project:

```bash
railway init --name ditto
railway add --service ditto
railway service link ditto
npx --yes @railway/cli@5.71.0 volume --service ditto add --mount-path /data
railway domain --service ditto --port 3000
```

Select the intended workspace if prompted. In the Railway dashboard, confirm there is **one service instance and one volume at `/data`**, and disable Serverless/sleeping for the judging window. No separate database service is needed. Keep the volume on subsequent deploys. The image refuses to boot if `/data` is merely an ephemeral directory.

Set the returned HTTPS origin (no path) and non-secret production values:

```bash
# Replace this value with the domain just returned by Railway:
railway variable set --service ditto --skip-deploys \
  NODE_ENV=production PORT=3000 \
  DATABASE_PATH=/data/ditto.sqlite COOKIE_SECURE=true \
  REQUIRE_PERSISTENT_VOLUME=true \
  PUBLIC_ORIGIN=https://YOUR-DOMAIN.up.railway.app \
  META_MODEL=muse-spark-1.3 MODEL_BASE_URL=https://api.meta.ai/v1
```

`RAILWAY_PUBLIC_DOMAIN` is also supported as the origin fallback. An explicit `PUBLIC_ORIGIN` takes precedence; update it if switching to a custom domain. The reverse proxy's internal Host header does not override this allowlist. Client writes must carry the exact configured Origin.

Optional providers: set `MODEL_API_KEY` and `SERPAPI_API_KEY` through Railway's private Variables UI, or transfer only the locally configured provider keys without displaying them:

```bash
node scripts/set-railway-secrets.mjs ditto
```

The helper reads `.env.local`, uses stdin for secret values, and suppresses the provider's raw output. Missing keys are left unchanged. Never run `railway variables --json` or `--kv` in shared logs: those commands print secret values. Never use a `NEXT_PUBLIC_` prefix for keys. With no Meta key, the labeled demo itinerary flow still works. Live AI needs both provider keys.

Deploy the checked-out source; `.gitignore` and `.dockerignore` exclude environment files, SQLite files, backups and test cookies:

```bash
railway up --service ditto --detach
railway service status --service ditto
# If a deployment fails, inspect logs locally without pasting secret-bearing output.
railway logs --service ditto --lines 80
```

`railway.json` specifies the Docker builder, `/api/health`, a 120-second health timeout, one replica, zero deployment overlap, and failure restarts. The Docker entrypoint briefly adjusts root-owned volume permissions, then runs Node as the unprivileged `node` user. It performs a real SQLite write/rollback and integrity check before serving. Schema initialization happens against the mounted disk at runtime, not in a pre-deploy job.

## Public acceptance checks

After Railway says the deployment is healthy:

```bash
export TEST_BASE_URL=https://YOUR-DOMAIN.up.railway.app
export TEST_SESSION_SNAPSHOT=test-results/public-sessions.json
npm run test:integration
```

This creates two **test-only** independent cookie sessions and exercises Discover interest/attendance, demo member voting, private vote visibility, matching, itinerary drafts, all approvals, RSVP, calendar authorization, personal profiles, invite joining and true two-session collaboration. It checks Secure/HttpOnly/SameSite cookies, no-store responses, health, cross-origin rejection and blocked sensitive-file URLs. No keys or session cookies are printed. The private snapshot is ignored by Git and should not be shared.

Then deliberately restart **only the Ditto test deployment before judges use it**:

```bash
railway service restart --service ditto --yes
# Wait until /api/health responds 200 again:
curl --fail "$TEST_BASE_URL/api/health"
npm run test:persistence
```

Both original sessions, Circle membership, votes and match must survive. For a stronger redeploy check, repeat with `railway redeploy --service ditto --yes`, wait for health, and rerun `npm run test:persistence`.

Finally open the public URL in a regular browser and a separate private window. Create personal profiles, invite the second browser into a new Circle, start a round, vote independently, and verify both views update within five seconds. Test the judge flow on a phone and desktop. Verify SerpApi with one real venue search if configured; only claim live Meta planning after a successful provider response.

## Backup and recovery

Create a consistent online backup (including committed WAL state) instead of copying a live `.sqlite` file alone:

```bash
railway ssh --service ditto -- gosu node node /app/deployment/backup.mjs
```

The backup path is printed, but no database contents are displayed. Use Railway's volume download tooling to save that specific backup into an ignored local `backups/` directory, or configure Railway volume backups. A backup on the same volume is not disaster recovery; keep an off-volume copy before the demo. Backups include session credentials and private Circle data: never commit, upload publicly, or paste them into chat.

For recovery, stop the service first, preserve the existing DB/WAL/SHM as a rollback set, and restore a verified backup as `/data/ditto.sqlite` without mixing old WAL/SHM files into it. Restart and rerun integrity/acceptance checks. Do not delete the persistent volume to restart the app. Roll back the app deployment before considering any database restore; this change introduces no destructive schema migration.

## Local verification without hosting access

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build

docker build -t ditto:hacktx .
docker volume create ditto-qa-data
docker run -d --name ditto-qa -p 127.0.0.1:3100:3000 \
  -v ditto-qa-data:/data \
  -e PUBLIC_ORIGIN=https://ditto-qa.example ditto:hacktx

TEST_BASE_URL=http://127.0.0.1:3100 \
TEST_ORIGIN=https://ditto-qa.example EXPECT_SECURE_COOKIE=true \
TEST_SESSION_SNAPSHOT=test-results/container-sessions.json npm run test:integration

docker restart ditto-qa
# Wait for health, then:
TEST_SESSION_SNAPSHOT=test-results/container-sessions.json npm run test:persistence
```

This checks the exact production image and persistent volume using isolated HTTP test clients that explicitly send cookies and the configured Origin. It **does not** prove public HTTPS/browser behavior; perform the public checks above after deployment. Secure cookies intentionally do not support ordinary browser login over non-local HTTP. The local app remains available through `npm run dev` for development.

## MVP boundaries

Device-bound anonymous sessions are preserved, not upgraded to full account authentication. Do not use the hackathon demo for sensitive real-world data. Clearing cookies loses access. Rate limits are per-process/per-session; a public high-traffic launch needs distributed abuse protection and lifecycle cleanup. No outbound messages or scheduled reminders are sent. Existing private local data is **not** copied into the public service: it starts with a fresh database and creates an isolated demo sandbox for each visitor.

import { createHash } from "node:crypto";
import { resolve } from "node:path";
export const showcaseVersion = 1;
export const showcaseNames = ["Mohit", "Edwin", "Paxton"] as const;
export function showcaseId(key: string) {
  const h = createHash("sha256").update(`ditto-showcase-v1:${key}`).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
export const showcaseOwner = showcaseId("owner");
export function assertShowcaseEnvironment(env: Record<string, string | undefined>, root: string) {
  const path = resolve(root, "data/showcase/ditto-presentation-showcase.sqlite");
  if (env.NODE_ENV === "production" || env.CI || Object.keys(env).some(k => /^(RAILWAY_|VERCEL)/.test(k) && env[k]) ||
      env.ALLOW_LIVE_PROVIDERS === "true" || (env.DATABASE_PATH && resolve(env.DATABASE_PATH) !== path) ||
      (env.PUBLIC_ORIGIN && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(env.PUBLIC_ORIGIN)))
    throw new Error("Showcase requires local development, its dedicated database, and paused live providers. Production/reset refused.");
  return path;
}
export function showcaseActive() {
  if (process.env.DITTO_SHOWCASE !== "1") return false;
  const expected = assertShowcaseEnvironment(process.env, process.cwd());
  if (!process.env.DATABASE_PATH || resolve(process.env.DATABASE_PATH) !== expected ||
      process.env.DITTO_PRESENTATION_FIXTURES !== "1" || process.env.DITTO_PRESENTATION_OWNER !== showcaseOwner)
    throw new Error("Showcase configuration is incomplete. Use npm run showcase.");
  return true;
}

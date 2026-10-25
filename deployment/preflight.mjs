import { readFileSync } from "node:fs";
if (process.env.COOKIE_SECURE !== "true")
  throw new Error("Production requires COOKIE_SECURE=true.");
if (process.env.DATABASE_PATH !== "/data/ditto.sqlite")
  throw new Error("Production DATABASE_PATH must be /data/ditto.sqlite.");
const origin =
  process.env.PUBLIC_ORIGIN ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "");
try {
  const url = new URL(origin);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error();
} catch {
  throw new Error(
    "Set PUBLIC_ORIGIN to the public HTTPS origin, or generate a Railway public domain.",
  );
}
if (process.env.REQUIRE_PERSISTENT_VOLUME !== "true")
  throw new Error("Production requires REQUIRE_PERSISTENT_VOLUME=true.");
const mounts = readFileSync("/proc/self/mountinfo", "utf8");
if (!mounts.split("\n").some((line) => line.split(" ")[4] === "/data"))
  throw new Error(
    "Refusing to start: mount a persistent volume at /data first.",
  );

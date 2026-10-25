import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
const configPath = resolve("data/presentation-recovery.json");
const recovery = existsSync(configPath) ? JSON.parse(readFileSync(configPath, "utf8")) : {};
const port = process.env.PRESENTATION_PORT || "3118";
console.log(`Local presentation: http://restored.localhost:${port} — data/ditto-presentation.sqlite`);
// Deliberately separate from the normal dev/prod DB, and local only.
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    port,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_PATH: resolve("data/ditto-presentation.sqlite"),
      DITTO_PRESENTATION_FIXTURES: "1",
      DITTO_PRESENTATION_OWNER: recovery.owner || "",
      PUBLIC_ORIGIN: "",
      COOKIE_SECURE: "false",
      ALLOW_LIVE_PROVIDERS: "false",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));

import { spawn } from "node:child_process";
import { resolve } from "node:path";
// Deliberately separate from the normal dev/prod DB, and local only.
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3108",
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_PATH: resolve("data/ditto-presentation.sqlite"),
      DITTO_PRESENTATION_FIXTURES: "1",
      PUBLIC_ORIGIN: "",
      COOKIE_SECURE: "false",
      ALLOW_LIVE_PROVIDERS: "false",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));

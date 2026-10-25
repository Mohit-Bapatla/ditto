// Run only after linking the intended Railway project and service.
// Values travel on stdin, never in command arguments or printed output.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const service = process.argv[2];
if (!service)
  throw new Error(
    "Usage: node scripts/set-railway-secrets.mjs <service-name-or-id>",
  );
for (const key of ["MODEL_API_KEY", "SERPAPI_API_KEY"]) {
  if (!process.env[key]) {
    console.log(`${key}: absent locally; left unchanged on Railway.`);
    continue;
  }
  const result = spawnSync(
    "railway",
    ["variable", "set", key, "--stdin", "--skip-deploys", "--service", service],
    {
      input: process.env[key],
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  if (result.status !== 0)
    throw new Error(
      `Could not set ${key}. Check railway whoami and the linked project/service. Provider output withheld to protect secrets.`,
    );
  console.log(`${key}: configured securely.`);
}

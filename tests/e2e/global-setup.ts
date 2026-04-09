import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("npm run db:seed", {
    stdio: "inherit",
    env: process.env,
  });

  execSync("node tests/e2e/seed-playwright-user.mjs", {
    stdio: "inherit",
    env: process.env,
  });
}

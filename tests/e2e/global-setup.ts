import { execSync } from "node:child_process";

export default function globalSetup() {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
    return;
  }

  execSync("npm run db:seed", {
    stdio: "inherit",
    env: process.env,
  });
}

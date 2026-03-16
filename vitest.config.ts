import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  process.env.SKIP_ENV_VALIDATION ??= "true";
  Object.assign(process.env, {
    NODE_ENV: process.env.NODE_ENV ?? "test",
  });

  return {
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      include: ["tests/**/*.test.{ts,tsx}"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/app/**/loading.tsx",
          "src/app/layout.tsx",
          "src/trpc/**",
          "src/components/ui/**",
        ],
      },
    },
  };
});

// vitest.config.ts
// Currently only tests things in the scripts folder
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["./scripts/**/*.spec.ts"],
    env: loadEnv("test", process.cwd(), ""),
  },
});

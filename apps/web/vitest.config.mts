import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  test: {
    globalSetup: "./test/setup.ts",
    fileParallelism: false, // tests share one database
    env: { DATABASE_URL: "postgres://postgres:postgres@localhost:5432/industryquest_test" },
  },
});

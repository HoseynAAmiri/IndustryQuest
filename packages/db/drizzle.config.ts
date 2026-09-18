import { defineConfig } from "drizzle-kit";

try { process.loadEnvFile("../../apps/web/.env"); } catch {}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});

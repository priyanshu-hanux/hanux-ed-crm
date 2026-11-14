import { existsSync } from "node:fs"
import { defineConfig, env } from "prisma/config"

// The Prisma CLI does not read .env on its own.
if (existsSync(".env")) process.loadEnvFile(".env")

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations need a direct connection; Neon's pooled (PgBouncer) URL can
    // break them. Falls back to DATABASE_URL for local Postgres.
    url: process.env.DATABASE_URL_UNPOOLED || env("DATABASE_URL"),
  },
})

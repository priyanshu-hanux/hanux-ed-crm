import { existsSync } from "node:fs"

// Use a dedicated database (e.g. a Neon branch) when .env.test exists.
process.loadEnvFile(existsSync(".env.test") ? ".env.test" : ".env")
process.env.NODE_ENV = "test"
process.env.LOG_LEVEL = "silent"

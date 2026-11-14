import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import helmet from "helmet"
import { pinoHttp } from "pino-http"
import { env } from "@/config/env.js"
import { logger } from "@/lib/logger.js"
import { errorHandler } from "@/middleware/error-handler.js"
import { notFound } from "@/middleware/not-found.js"
import { requireJson } from "@/middleware/require-json.js"
import { healthRouter } from "@/modules/health/health.routes.js"
import { apiRouter } from "@/routes/index.js"

export function createApp() {
  const app = express()

  app.set("trust proxy", env.TRUST_PROXY)
  app.use(helmet())
  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      credentials: true,
      exposedHeaders: ["X-Authz-Version"],
    })
  )
  app.use(requireJson)
  app.use(express.json({ limit: "1mb" }))
  app.use(cookieParser())
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/health" },
    })
  )

  app.use("/health", healthRouter)
  app.use("/v1", apiRouter)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

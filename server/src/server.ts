import { createApp } from "@/app.js"
import { env } from "@/config/env.js"
import { logger } from "@/lib/logger.js"
import { prisma } from "@/lib/prisma.js"

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(
    `Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`
  )
})

let shuttingDown = false

function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info(`${signal} received, shutting down`)

  const forceExit = setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit")
    process.exit(1)
  }, 10_000)
  forceExit.unref()

  server.close(async (err) => {
    await prisma.$disconnect()
    if (err) logger.error({ err }, "Error while closing server")
    process.exit(err ? 1 : 0)
  })
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection")
})
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception")
  process.exit(1)
})

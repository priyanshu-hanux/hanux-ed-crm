import type { ErrorRequestHandler } from "express"
import { ZodError, z } from "zod"
import { isProduction } from "@/config/env.js"
import { Prisma } from "@/generated/prisma/client.js"
import { HttpError } from "@/utils/http-error.js"

function toHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err

  if (err instanceof ZodError) {
    return new HttpError(
      400,
      "VALIDATION_ERROR",
      "Validation failed",
      z.flattenError(err)
    )
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return HttpError.conflict(
          "A record with this value already exists",
          "CONFLICT",
          { target: err.meta?.target }
        )
      case "P2025":
        return HttpError.notFound("Record not found")
    }
  }

  // Malformed JSON body, thrown by express.json()
  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    return HttpError.badRequest("Malformed JSON body")
  }

  return new HttpError(500, "INTERNAL_ERROR", "Internal server error")
}

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  const httpError = toHttpError(err)

  if (httpError.status >= 500) {
    req.log.error({ err }, "Unhandled error")
  }

  res.status(httpError.status).json({
    success: false,
    code: httpError.code,
    message: httpError.message,
    ...(httpError.details !== undefined && { error: httpError.details }),
    ...(!isProduction &&
      httpError.status >= 500 &&
      err instanceof Error && { stack: err.stack }),
  })
}

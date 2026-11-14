import type { Request, RequestHandler } from "express"
import { ipKeyGenerator, rateLimit } from "express-rate-limit"
import { env } from "@/config/env.js"
import { HttpError } from "@/utils/http-error.js"

const MINUTE = 60 * 1000

interface LimitOptions {
  windowMs: number
  limit: number
  /** "ip" (default) or the `email` in the request body (falls back to the IP). */
  by?: "ip" | "email"
  /** Tests run many requests from one IP, so limits are off there unless forced. */
  enabledInTests?: boolean
}

const ipKey = (req: Request) => ipKeyGenerator(req.ip ?? "unknown")

/**
 * Brute-force protection for one endpoint. Counts live in memory, which is
 * right for a single server; move the store to Redis when running several.
 */
export function rateLimiter(options: LimitOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test" && !options.enabledInTests,
    keyGenerator:
      options.by === "email"
        ? (req) => {
            const email: unknown = req.body?.email
            return typeof email === "string" && email.trim()
              ? `email:${email.trim().toLowerCase()}`
              : ipKey(req)
          }
        : ipKey,
    handler: (_req, _res, next) => {
      next(
        new HttpError(
          429,
          "RATE_LIMITED",
          "Too many attempts. Please wait a few minutes and try again."
        )
      )
    },
  })
}

/** The limits each sensitive endpoint uses. */
export const limits = {
  loginByIp: rateLimiter({ windowMs: 15 * MINUTE, limit: 50 }),
  loginByEmail: rateLimiter({ windowMs: 15 * MINUTE, limit: 15, by: "email" }),
  signup: rateLimiter({ windowMs: 60 * MINUTE, limit: 10 }),
  forgotByIp: rateLimiter({ windowMs: 60 * MINUTE, limit: 10 }),
  forgotByEmail: rateLimiter({ windowMs: 60 * MINUTE, limit: 3, by: "email" }),
  resetPassword: rateLimiter({ windowMs: 60 * MINUTE, limit: 20 }),
  emailCode: rateLimiter({ windowMs: 60 * MINUTE, limit: 10 }),
  emailVerify: rateLimiter({ windowMs: 60 * MINUTE, limit: 30 }),
  invite: rateLimiter({ windowMs: 60 * MINUTE, limit: 30 }),
}

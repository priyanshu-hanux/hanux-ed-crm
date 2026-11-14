import type { CookieOptions, Request, Response } from "express"
import { env, isProduction } from "@/config/env.js"
import { SESSION_COOKIE } from "@/modules/identity/sessions/session.config.js"

const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
}

export function setSessionCookie(
  res: Response,
  token: string,
  expiresAt: Date
) {
  res.cookie(SESSION_COOKIE, token, { ...baseOptions, expires: expiresAt })
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, baseOptions)
}

export function readSessionCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[SESSION_COOKIE]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

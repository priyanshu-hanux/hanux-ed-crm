import type { Request, RequestHandler } from "express"
import {
  type AuthContext,
  loadAuthContext,
} from "@/modules/identity/sessions/auth-context.js"
import {
  clearSessionCookie,
  readSessionCookie,
} from "@/modules/identity/sessions/session.cookie.js"
import { HttpError } from "@/utils/http-error.js"

/** Requires a valid session; sets req.auth and the X-Authz-Version header. */
export const authenticate: RequestHandler = async (req, res, next) => {
  const token = readSessionCookie(req)
  if (!token) throw HttpError.unauthorized()

  try {
    req.auth = await loadAuthContext(token)
  } catch (err) {
    // The cookie is useless now; remove it from the browser.
    if (err instanceof HttpError && err.status === 401) clearSessionCookie(res)
    throw err
  }

  res.setHeader("X-Authz-Version", String(req.auth.authzVersion))
  next()
}

/** req.auth for routes behind `authenticate`. */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw HttpError.unauthorized()
  return req.auth
}

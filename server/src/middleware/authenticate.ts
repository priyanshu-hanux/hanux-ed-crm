import type { Request, RequestHandler, Response } from "express"
import {
  type AuthContext,
  type LoadedSession,
  loadSession,
  type PlatformContext,
} from "@/modules/identity/sessions/auth-context.js"
import {
  clearSessionCookie,
  readSessionCookie,
} from "@/modules/identity/sessions/session.cookie.js"
import { HttpError } from "@/utils/http-error.js"

/** Loads the session behind the cookie and sets req.auth or req.platformAuth. */
async function load(req: Request, res: Response): Promise<LoadedSession> {
  const token = readSessionCookie(req)
  if (!token) throw HttpError.unauthorized()

  let loaded: LoadedSession
  try {
    loaded = await loadSession(token)
  } catch (err) {
    // The cookie is useless now; remove it from the browser.
    if (err instanceof HttpError && err.status === 401) clearSessionCookie(res)
    throw err
  }

  if (loaded.mode === "org") {
    req.auth = loaded.auth
    res.setHeader("X-Authz-Version", String(loaded.auth.authzVersion))
  } else {
    req.platformAuth = loaded.auth
  }
  return loaded
}

/** Org routes: requires a session working in an org role. */
export const authenticate: RequestHandler = async (req, res, next) => {
  const loaded = await load(req, res)
  if (loaded.mode === "platform") {
    throw HttpError.forbidden(
      "You're working as Platform Admin. Switch to an organization role to use this.",
      "PLATFORM_MODE"
    )
  }
  next()
}

/** Platform routes: requires a session working as Platform Admin. */
export const authenticatePlatform: RequestHandler = async (req, res, next) => {
  const loaded = await load(req, res)
  if (loaded.mode !== "platform") throw HttpError.forbidden()
  next()
}

/** Routes for any signed-in session (e.g. the session info, switching roles). */
export const authenticateAny: RequestHandler = async (req, res, next) => {
  await load(req, res)
  next()
}

/** req.auth for routes behind `authenticate`. */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw HttpError.unauthorized()
  return req.auth
}

/** req.platformAuth for routes behind `authenticatePlatform`. */
export function getPlatformAuth(req: Request): PlatformContext {
  if (!req.platformAuth) throw HttpError.unauthorized()
  return req.platformAuth
}

/** The session, whichever mode it's in (routes behind `authenticateAny`). */
export function getAnySession(req: Request): LoadedSession {
  if (req.auth) return { mode: "org", auth: req.auth }
  if (req.platformAuth) return { mode: "platform", auth: req.platformAuth }
  throw HttpError.unauthorized()
}

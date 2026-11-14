import type { RequestHandler } from "express"
import { HttpError } from "@/utils/http-error.js"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

/**
 * CSRF guard. A plain HTML form on another site (including a sibling
 * subdomain) can only send form or text bodies, never JSON, so state-changing
 * requests with any other body type are refused. Requests with no body
 * (e.g. logout) carry no Content-Type and pass.
 */
export const requireJson: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method) || !req.headers["content-type"]) {
    return next()
  }
  if (!req.is("application/json")) {
    return next(
      new HttpError(
        415,
        "BAD_REQUEST",
        "Requests must be sent as application/json"
      )
    )
  }
  next()
}

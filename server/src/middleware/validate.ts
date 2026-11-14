import type { RequestHandler } from "express"
import type { z } from "zod"

interface Schemas {
  body?: z.ZodType
  query?: z.ZodType
  params?: z.ZodType
}

/**
 * Validates req.body / req.query / req.params and replaces them with the
 * parsed values. A ZodError goes to the error handler, which returns 400.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    if (schemas.body) req.body = schemas.body.parse(req.body)
    // In Express 5, req.query is a getter, so it has to be redefined.
    if (schemas.query) {
      Object.defineProperty(req, "query", {
        value: schemas.query.parse(req.query),
        writable: true,
        enumerable: true,
        configurable: true,
      })
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as typeof req.params
    }
    next()
  }

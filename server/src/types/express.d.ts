import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware. */
      auth?: AuthContext
    }
  }
}

export {}

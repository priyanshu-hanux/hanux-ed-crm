import type {
  AuthContext,
  PlatformContext,
} from "@/modules/identity/sessions/auth-context.js"

declare global {
  namespace Express {
    interface Request {
      /** Set by `authenticate` (and `authenticateAny`) in org mode. */
      auth?: AuthContext
      /** Set by `authenticatePlatform` (and `authenticateAny`) in platform mode. */
      platformAuth?: PlatformContext
    }
  }
}

export {}

import { Router } from "express"
import { authRouter } from "@/modules/identity/auth/auth.routes.js"
import { meRouter } from "@/modules/identity/me/me.routes.js"

/** Versioned API routes, mounted at /v1. Register each feature module here. */
export const apiRouter = Router()

apiRouter.use("/auth", authRouter)
apiRouter.use("/me", meRouter)

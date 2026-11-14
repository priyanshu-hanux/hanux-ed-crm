import { Router } from "express"
import { auditRouter } from "@/modules/identity/audit/audit.routes.js"
import { authRouter } from "@/modules/identity/auth/auth.routes.js"
import { branchesRouter } from "@/modules/identity/branches/branches.routes.js"
import { invitesRouter } from "@/modules/identity/invites/invites.routes.js"
import { meRouter } from "@/modules/identity/me/me.routes.js"
import { membersRouter } from "@/modules/identity/members/members.routes.js"
import { organizationRouter } from "@/modules/identity/organizations/organization.routes.js"
import { teamsRouter } from "@/modules/identity/teams/teams.routes.js"
import { platformRouter } from "@/modules/platform/platform.routes.js"

/** Versioned API routes, mounted at /v1. Register each feature module here. */
export const apiRouter = Router()

apiRouter.use("/auth", authRouter)
apiRouter.use("/me", meRouter)
apiRouter.use("/organization", organizationRouter)
apiRouter.use("/branches", branchesRouter)
apiRouter.use("/members", membersRouter)
apiRouter.use("/teams", teamsRouter)
apiRouter.use("/invites", invitesRouter)
apiRouter.use("/audit-log", auditRouter)
apiRouter.use("/platform", platformRouter)

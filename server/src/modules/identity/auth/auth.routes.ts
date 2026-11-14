import { type Request, Router } from "express"
import { z } from "zod"
import {
  acceptInvite,
  acceptInviteSchema,
  viewInvite,
} from "@/modules/identity/invites/invites.service.js"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import {
  loginSchema,
  signupSchema,
  switchRoleSchema,
  type LoginInput,
  type SignupInput,
  type SwitchRoleInput,
} from "@/modules/identity/auth/auth.schemas.js"
import { loadAuthContext } from "@/modules/identity/sessions/auth-context.js"
import {
  getSessionInfo,
  login,
  signup,
} from "@/modules/identity/auth/auth.service.js"
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/modules/identity/sessions/session.cookie.js"
import {
  revokeSessionByToken,
  switchActiveAssignment,
  type RequestMeta,
} from "@/modules/identity/sessions/session.service.js"
import { sendSuccess } from "@/utils/api-response.js"

const requestMeta = (req: Request): RequestMeta => ({
  userAgent: req.get("user-agent"),
  ip: req.ip,
})

const inviteTokenParam = z.object({ token: z.string().min(20).max(100) })

export const authRouter = Router()

authRouter.post(
  "/signup",
  validate({ body: signupSchema }),
  async (req, res) => {
    const session = await signup(req.body as SignupInput, requestMeta(req))
    setSessionCookie(res, session.token, session.expiresAt)
    sendSuccess(res, null, { status: 201, message: "Account created" })
  }
)

authRouter.post("/login", validate({ body: loginSchema }), async (req, res) => {
  // Replace any session this browser already had.
  const previous = readSessionCookie(req)
  if (previous) await revokeSessionByToken(previous, "SIGNED_OUT")

  const session = await login(req.body as LoginInput, requestMeta(req))
  setSessionCookie(res, session.token, session.expiresAt)
  sendSuccess(res, null, { message: "Signed in" })
})

authRouter.post("/logout", async (req, res) => {
  const token = readSessionCookie(req)
  if (token) await revokeSessionByToken(token, "SIGNED_OUT")
  clearSessionCookie(res)
  sendSuccess(res, null, { message: "Signed out" })
})

authRouter.get("/session", authenticate, async (req, res) => {
  sendSuccess(res, await getSessionInfo(getAuth(req)))
})

/** Public: what an invitation link is for, so the accept page can show it. */
authRouter.get(
  "/invites/:token",
  validate({ params: inviteTokenParam }),
  async (req, res) => {
    sendSuccess(res, await viewInvite(req.params.token as string))
  }
)

/** Public: creates the account from an invitation and signs the user in. */
authRouter.post(
  "/invites/:token/accept",
  validate({ params: inviteTokenParam, body: acceptInviteSchema }),
  async (req, res) => {
    const session = await acceptInvite(
      req.params.token as string,
      req.body as z.infer<typeof acceptInviteSchema>,
      requestMeta(req)
    )
    setSessionCookie(res, session.token, session.expiresAt)
    sendSuccess(res, null, { status: 201, message: "Welcome aboard" })
  }
)

/** Makes another of the member's roles active; returns the new session. */
authRouter.post(
  "/switch-role",
  authenticate,
  validate({ body: switchRoleSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const { assignmentId } = req.body as SwitchRoleInput
    const { token, expiresAt } = await switchActiveAssignment({
      sessionId: auth.sessionId,
      membershipId: auth.membershipId,
      assignmentId,
    })
    setSessionCookie(res, token, expiresAt)
    sendSuccess(res, await getSessionInfo(await loadAuthContext(token)))
  }
)

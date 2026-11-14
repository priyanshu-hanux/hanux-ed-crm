import { type Request, Router } from "express"
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

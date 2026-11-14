import { type Request, Router } from "express"
import { z } from "zod"
import { logger } from "@/lib/logger.js"
import { limits } from "@/lib/rate-limit.js"
import { authenticateAny, getAnySession } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import {
  newPassword,
  requestPasswordReset,
  resetPassword,
  sendVerificationCode,
  verifyEmailCode,
} from "@/modules/identity/account/account.service.js"
import { audit } from "@/modules/identity/audit/audit.service.js"
import {
  loginSchema,
  signupSchema,
  switchRoleSchema,
  type LoginInput,
  type SignupInput,
  type SwitchRoleInput,
} from "@/modules/identity/auth/auth.schemas.js"
import {
  getSessionInfo,
  login,
  signup,
} from "@/modules/identity/auth/auth.service.js"
import {
  acceptInvite,
  acceptInviteSchema,
  viewInvite,
} from "@/modules/identity/invites/invites.service.js"
import { loadSession } from "@/modules/identity/sessions/auth-context.js"
import {
  clearSessionCookie,
  readSessionCookie,
  setSessionCookie,
} from "@/modules/identity/sessions/session.cookie.js"
import {
  revokeSessionByToken,
  switchSessionRole,
  type RequestMeta,
} from "@/modules/identity/sessions/session.service.js"
import { prisma } from "@/lib/prisma.js"
import { sha256 } from "@/lib/crypto.js"
import { sendSuccess } from "@/utils/api-response.js"

const requestMeta = (req: Request): RequestMeta => ({
  userAgent: req.get("user-agent"),
  ip: req.ip,
})

const inviteTokenParam = z.object({ token: z.string().min(20).max(100) })
const emailBody = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
})
const verifyCodeBody = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})
const resetBody = z.object({
  token: z.string().min(20).max(100),
  password: newPassword,
})

export const authRouter = Router()

authRouter.post(
  "/signup",
  limits.signup,
  validate({ body: signupSchema }),
  async (req, res) => {
    const result = await signup(req.body as SignupInput, requestMeta(req))
    setSessionCookie(res, result.token, result.expiresAt)
    await audit(req, {
      action: "auth.signup",
      orgId: result.orgId,
      branchId: result.branchId,
      actorId: result.userId,
      targetType: "user",
      targetId: result.userId,
    })
    // The owner verifies their email before inviting anyone.
    sendVerificationCode(result.userId).catch((err: unknown) =>
      logger.error({ err }, "Sending the verification code failed")
    )
    sendSuccess(res, null, { status: 201, message: "Account created" })
  }
)

authRouter.post(
  "/login",
  limits.loginByIp,
  limits.loginByEmail,
  validate({ body: loginSchema }),
  async (req, res) => {
    // Replace any session this browser already had.
    const previous = readSessionCookie(req)
    if (previous) await revokeSessionByToken(previous, "SIGNED_OUT")

    const session = await login(req.body as LoginInput, requestMeta(req), (e) =>
      audit(req, e)
    )
    setSessionCookie(res, session.token, session.expiresAt)
    sendSuccess(res, null, { message: "Signed in" })
  }
)

authRouter.post("/logout", async (req, res) => {
  const token = readSessionCookie(req)
  if (token) {
    const session = await prisma.session.findUnique({
      where: { tokenHash: sha256(token) },
      select: { id: true, userId: true, orgId: true, revokedAt: true },
    })
    await revokeSessionByToken(token, "SIGNED_OUT")
    if (session && !session.revokedAt) {
      await audit(req, {
        action: "auth.logout",
        orgId: session.orgId,
        actorId: session.userId,
        targetType: "session",
        targetId: session.id,
      })
    }
  }
  clearSessionCookie(res)
  sendSuccess(res, null, { message: "Signed out" })
})

authRouter.get("/session", authenticateAny, async (req, res) => {
  sendSuccess(res, await getSessionInfo(getAnySession(req)))
})

/**
 * Switches to another of the member's org roles (`{ assignmentId }`), or to
 * Platform Admin (`{ platform: true }`, Hanux staff only). Returns the new session.
 */
authRouter.post(
  "/switch-role",
  authenticateAny,
  validate({ body: switchRoleSchema }),
  async (req, res) => {
    const { auth } = getAnySession(req)
    const target = req.body as SwitchRoleInput
    const { token, expiresAt } = await switchSessionRole({
      sessionId: auth.sessionId,
      userId: auth.userId,
      membershipId: auth.membershipId,
      target,
    })
    setSessionCookie(res, token, expiresAt)
    if ("platform" in target) {
      await audit(req, {
        action: "platform.mode_entered",
        orgId: null,
        actorId: auth.userId,
        targetType: "user",
        targetId: auth.userId,
      })
    }
    sendSuccess(res, await getSessionInfo(await loadSession(token)))
  }
)

// ─── Email verification (signed in) ──────────────────────────────────────────

authRouter.post(
  "/email/send-code",
  authenticateAny,
  limits.emailCode,
  async (req, res) => {
    await sendVerificationCode(getAnySession(req).auth.userId)
    sendSuccess(res, null, { message: "Code sent" })
  }
)

authRouter.post(
  "/email/verify",
  authenticateAny,
  limits.emailVerify,
  validate({ body: verifyCodeBody }),
  async (req, res) => {
    const { auth } = getAnySession(req)
    await verifyEmailCode(auth.userId, (req.body as { code: string }).code)
    await audit(req, {
      action: "auth.email_verified",
      targetType: "user",
      targetId: auth.userId,
    })
    sendSuccess(res, null, { message: "Email verified" })
  }
)

// ─── Password reset (public) ─────────────────────────────────────────────────

/** Always answers the same, so it doesn't reveal which emails have accounts. */
authRouter.post(
  "/password/forgot",
  limits.forgotByIp,
  limits.forgotByEmail,
  validate({ body: emailBody }),
  async (req, res) => {
    const userId = await requestPasswordReset(
      (req.body as z.infer<typeof emailBody>).email
    )
    if (userId) {
      await audit(req, {
        action: "auth.password_reset_requested",
        actorId: userId,
        targetType: "user",
        targetId: userId,
      })
    }
    sendSuccess(res, null, {
      message: "If an account exists for that email, we sent a reset link.",
    })
  }
)

authRouter.post(
  "/password/reset",
  limits.resetPassword,
  validate({ body: resetBody }),
  async (req, res) => {
    const { token, password } = req.body as z.infer<typeof resetBody>
    const userId = await resetPassword(token, password)
    await audit(req, {
      action: "auth.password_reset",
      actorId: userId,
      targetType: "user",
      targetId: userId,
    })
    // If this browser had a session, it was just revoked too.
    clearSessionCookie(res)
    sendSuccess(res, null, {
      message: "Password changed. Sign in with your new password.",
    })
  }
)

// ─── Invitations (public) ────────────────────────────────────────────────────

/** What an invitation link is for, so the accept page can show it. */
authRouter.get(
  "/invites/:token",
  limits.invite,
  validate({ params: inviteTokenParam }),
  async (req, res) => {
    sendSuccess(res, await viewInvite(req.params.token as string))
  }
)

/** Creates the account from an invitation and signs the user in. */
authRouter.post(
  "/invites/:token/accept",
  limits.invite,
  validate({ params: inviteTokenParam, body: acceptInviteSchema }),
  async (req, res) => {
    const result = await acceptInvite(
      req.params.token as string,
      req.body as z.infer<typeof acceptInviteSchema>,
      requestMeta(req)
    )
    setSessionCookie(res, result.token, result.expiresAt)
    await audit(req, {
      action: "invite.accepted",
      orgId: result.orgId,
      branchId: result.branchId,
      actorId: result.userId,
      targetType: "member",
      targetId: result.membershipId,
      metadata: { inviteId: result.inviteId },
    })
    sendSuccess(res, null, { status: 201, message: "Welcome aboard" })
  }
)

import { type Request, Router } from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import { authenticateAny, getAnySession } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import {
  changePassword,
  listSessions,
  newPassword,
  revokeOtherSessions,
  revokeOwnSession,
} from "@/modules/identity/account/account.service.js"
import { audit } from "@/modules/identity/audit/audit.service.js"
import { setSessionCookie } from "@/modules/identity/sessions/session.cookie.js"
import { rotateSessionToken } from "@/modules/identity/sessions/session.service.js"
import { idParam } from "@/modules/identity/shared.js"
import { sendSuccess } from "@/utils/api-response.js"

const profileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.url().max(500).nullable().optional(),
})
const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword,
})

const profileSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
}

export const meRouter = Router()

// Your own account works in either mode, including for Platform Admins.
meRouter.use(authenticateAny)

const me = (req: Request) => getAnySession(req).auth

meRouter.get("/", async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: me(req).userId },
    select: profileSelect,
  })
  sendSuccess(res, user)
})

meRouter.patch("/", validate({ body: profileSchema }), async (req, res) => {
  const user = await prisma.user.update({
    where: { id: me(req).userId },
    data: req.body as z.infer<typeof profileSchema>,
    select: profileSelect,
  })
  sendSuccess(res, user, { message: "Profile updated" })
})

/** Changes the password, signs out other devices, and renews this session's token. */
meRouter.post(
  "/password",
  validate({ body: passwordSchema }),
  async (req, res) => {
    const auth = me(req)
    const input = req.body as z.infer<typeof passwordSchema>
    await changePassword(auth, input.currentPassword, input.newPassword)
    const { token, expiresAt } = await rotateSessionToken(auth.sessionId)
    setSessionCookie(res, token, expiresAt)
    await audit(req, {
      action: "auth.password_changed",
      targetType: "user",
      targetId: auth.userId,
    })
    sendSuccess(res, null, {
      message: "Password changed. Your other devices were signed out.",
    })
  }
)

/** Devices you're signed in on. */
meRouter.get("/sessions", async (req, res) => {
  sendSuccess(res, await listSessions(me(req)))
})

meRouter.delete(
  "/sessions/:id",
  validate({ params: idParam }),
  async (req, res) => {
    const id = req.params.id as string
    await revokeOwnSession(me(req), id)
    await audit(req, {
      action: "session.revoked",
      targetType: "session",
      targetId: id,
    })
    sendSuccess(res, null, { message: "Signed out of that device" })
  }
)

meRouter.post("/sessions/revoke-others", async (req, res) => {
  const count = await revokeOtherSessions(me(req))
  if (count > 0) {
    await audit(req, {
      action: "session.revoked_others",
      metadata: { count },
    })
  }
  sendSuccess(
    res,
    { revoked: count },
    { message: "Signed out of other devices" }
  )
})

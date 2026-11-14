import { Router } from "express"
import { prisma } from "@/lib/prisma.js"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { sendSuccess } from "@/utils/api-response.js"

export const meRouter = Router()

meRouter.use(authenticate)

meRouter.get("/", async (req, res) => {
  const auth = getAuth(req)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })
  sendSuccess(res, user)
})

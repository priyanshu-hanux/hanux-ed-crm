import { Router } from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import { requirePermission } from "@/modules/identity/permissions/access.js"
import { bumpAuthzVersion, timeZone } from "@/modules/identity/shared.js"
import { sendSuccess } from "@/utils/api-response.js"
import { HttpError } from "@/utils/http-error.js"

const updateOrgSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  timezone: timeZone.optional(),
})
const transferSchema = z.object({ membershipId: z.uuid() })

const orgSelect = {
  id: true,
  name: true,
  slug: true,
  timezone: true,
  status: true,
  createdAt: true,
}

export const organizationRouter = Router()
organizationRouter.use(authenticate)

organizationRouter.get("/", async (req, res) => {
  const auth = getAuth(req)
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: auth.orgId },
    select: orgSelect,
  })
  sendSuccess(res, org)
})

organizationRouter.patch(
  "/",
  requirePermission("org:manage"),
  validate({ body: updateOrgSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const org = await prisma.organization.update({
      where: { id: auth.orgId },
      data: req.body as z.infer<typeof updateOrgSchema>,
      select: orgSelect,
    })
    sendSuccess(res, org)
  }
)

/** The owner hands ownership to another active Super Admin. */
organizationRouter.post(
  "/transfer-ownership",
  validate({ body: transferSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    if (!auth.isOwner) {
      throw HttpError.forbidden("Only the owner can transfer ownership")
    }
    const { membershipId } = req.body as z.infer<typeof transferSchema>
    if (membershipId === auth.membershipId) {
      throw HttpError.badRequest("You already own this organization")
    }
    const target = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        orgId: auth.orgId,
        status: "ACTIVE",
        roleAssignments: { some: { role: "SUPER_ADMIN" } },
      },
      select: { id: true },
    })
    if (!target) {
      throw HttpError.badRequest(
        "Ownership can only go to an active Super Admin"
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: auth.membershipId },
        data: { isOwner: false },
      })
      await tx.membership.update({
        where: { id: target.id },
        data: { isOwner: true },
      })
      await bumpAuthzVersion(tx, [auth.membershipId, target.id])
    })
    sendSuccess(res, null, { message: "Ownership transferred" })
  }
)

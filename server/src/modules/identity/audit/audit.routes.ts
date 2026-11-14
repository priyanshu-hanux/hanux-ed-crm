import { Router } from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import type { Prisma } from "@/generated/prisma/client.js"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import { requirePermission } from "@/modules/identity/permissions/access.js"
import { paginationQuery } from "@/modules/identity/shared.js"
import { sendPaginated } from "@/utils/api-response.js"

const listQuery = paginationQuery.extend({
  /** Prefix, e.g. "auth." or "member.role" */
  action: z.string().trim().max(60).optional(),
  actorId: z.uuid().optional(),
})

export const auditRouter = Router()

/** Super Admins see the whole org; branch Admins see entries about their branch. */
auditRouter.get(
  "/",
  authenticate,
  requirePermission("audit:read"),
  validate({ query: listQuery }),
  async (req, res) => {
    const auth = getAuth(req)
    const q = req.query as unknown as z.infer<typeof listQuery>
    const where: Prisma.AuditLogWhereInput = {
      orgId: auth.orgId,
      ...(auth.role !== "SUPER_ADMIN" && { branchId: auth.branchId }),
      ...(q.action && { action: { startsWith: q.action } }),
      ...(q.actorId && { actorId: q.actorId }),
    }
    const [total, entries] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        select: {
          id: true,
          action: true,
          actorId: true,
          actorName: true,
          branchId: true,
          targetType: true,
          targetId: true,
          metadata: true,
          ip: true,
          userAgent: true,
          createdAt: true,
        },
      }),
    ])
    sendPaginated(res, entries, { total, page: q.page, limit: q.limit })
  }
)

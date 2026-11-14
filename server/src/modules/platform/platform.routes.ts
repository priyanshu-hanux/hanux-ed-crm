import { Router } from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import type { Prisma } from "@/generated/prisma/client.js"
import {
  authenticatePlatform,
  getPlatformAuth,
} from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import { audit } from "@/modules/identity/audit/audit.service.js"
import { idParam, paginationQuery } from "@/modules/identity/shared.js"
import { sendPaginated, sendSuccess } from "@/utils/api-response.js"
import { HttpError } from "@/utils/http-error.js"

/**
 * Hanux staff tools. Platform Admins manage organizations as accounts
 * (list, suspend, restore); they don't see an organization's CRM data.
 */
export const platformRouter = Router()
platformRouter.use(authenticatePlatform)

const listQuery = paginationQuery.extend({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
})
const suspendSchema = z.object({ reason: z.string().trim().min(3).max(500) })

const orgSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  timezone: true,
  createdAt: true,
  suspendedAt: true,
  suspendedReason: true,
  _count: {
    select: {
      memberships: { where: { status: "ACTIVE" as const } },
      branches: { where: { status: "ACTIVE" as const } },
    },
  },
  memberships: {
    where: { isOwner: true },
    take: 1,
    select: { user: { select: { name: true, email: true } } },
  },
} satisfies Prisma.OrganizationSelect

type OrgRow = Prisma.OrganizationGetPayload<{ select: typeof orgSelect }>

function toOrgDto(org: OrgRow, lastActivityAt: Date | null) {
  const { _count, memberships, ...rest } = org
  return {
    ...rest,
    memberCount: _count.memberships,
    branchCount: _count.branches,
    owner: memberships[0]?.user ?? null,
    lastActivityAt,
  }
}

/** Latest audit entry per org: a cheap "last active" signal. */
async function lastActivity(orgIds: string[]) {
  if (orgIds.length === 0) return new Map<string, Date | null>()
  const rows = await prisma.auditLog.groupBy({
    by: ["orgId"],
    where: { orgId: { in: orgIds } },
    _max: { createdAt: true },
  })
  return new Map(rows.map((r) => [r.orgId as string, r._max.createdAt]))
}

platformRouter.get("/stats", async (_req, res) => {
  const [organizations, suspended, users, activeSessions] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.session.count({
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() },
        lastUsedAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ])
  sendSuccess(res, { organizations, suspended, users, activeSessions })
})

platformRouter.get(
  "/organizations",
  validate({ query: listQuery }),
  async (req, res) => {
    const q = req.query as unknown as z.infer<typeof listQuery>
    const where: Prisma.OrganizationWhereInput = {
      ...(q.status && { status: q.status }),
      ...(q.search && {
        OR: [
          { name: { contains: q.search, mode: "insensitive" } },
          { slug: { contains: q.search, mode: "insensitive" } },
        ],
      }),
    }
    const [total, orgs] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        select: orgSelect,
      }),
    ])
    const activity = await lastActivity(orgs.map((o) => o.id))
    sendPaginated(
      res,
      orgs.map((o) => toOrgDto(o, activity.get(o.id) ?? null)),
      { total, page: q.page, limit: q.limit }
    )
  }
)

platformRouter.get(
  "/organizations/:id",
  validate({ params: idParam }),
  async (req, res) => {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id as string },
      select: orgSelect,
    })
    if (!org) throw HttpError.notFound("Organization not found")
    const activity = await lastActivity([org.id])
    sendSuccess(res, toOrgDto(org, activity.get(org.id) ?? null))
  }
)

/** Members can't sign in while suspended; signed-in members are cut off on their next request. */
platformRouter.post(
  "/organizations/:id/suspend",
  validate({ params: idParam, body: suspendSchema }),
  async (req, res) => {
    const { reason } = req.body as z.infer<typeof suspendSchema>
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, name: true, status: true },
    })
    if (!org) throw HttpError.notFound("Organization not found")
    if (org.status === "SUSPENDED") {
      throw HttpError.conflict("This organization is already suspended")
    }
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        status: "SUSPENDED",
        suspendedAt: new Date(),
        suspendedReason: reason,
      },
    })
    // Filed under the org, so its Super Admins see who suspended it and why.
    await audit(req, {
      action: "platform.org_suspended",
      orgId: org.id,
      actorId: getPlatformAuth(req).userId,
      targetType: "organization",
      targetId: org.id,
      metadata: { name: org.name, reason },
    })
    sendSuccess(res, null, { message: `${org.name} was suspended` })
  }
)

platformRouter.post(
  "/organizations/:id/restore",
  validate({ params: idParam }),
  async (req, res) => {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id as string },
      select: { id: true, name: true, status: true },
    })
    if (!org) throw HttpError.notFound("Organization not found")
    if (org.status === "ACTIVE") {
      throw HttpError.conflict("This organization isn't suspended")
    }
    await prisma.organization.update({
      where: { id: org.id },
      data: { status: "ACTIVE", suspendedAt: null, suspendedReason: null },
    })
    await audit(req, {
      action: "platform.org_restored",
      orgId: org.id,
      actorId: getPlatformAuth(req).userId,
      targetType: "organization",
      targetId: org.id,
      metadata: { name: org.name },
    })
    sendSuccess(res, null, { message: `${org.name} was restored` })
  }
)

/**
 * Everyone with Platform Admin access, so the team can spot an unexpected
 * name. Read-only: granting stays in src/scripts/platform-admin.ts.
 */
platformRouter.get("/admins", async (req, res) => {
  const admins = await prisma.user.findMany({
    where: { isPlatformAdmin: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      memberships: {
        where: { status: "ACTIVE" },
        take: 1,
        select: { organization: { select: { id: true, name: true } } },
      },
    },
  })
  const lastActions = await prisma.auditLog.groupBy({
    by: ["actorId"],
    where: {
      actorId: { in: admins.map((a) => a.id) },
      action: { startsWith: "platform." },
    },
    _max: { createdAt: true },
    _count: { _all: true },
  })
  const byActor = new Map(lastActions.map((row) => [row.actorId, row]))
  const me = getPlatformAuth(req).userId

  sendSuccess(
    res,
    admins.map(({ memberships, ...admin }) => ({
      ...admin,
      organization: memberships[0]?.organization ?? null,
      lastActionAt: byActor.get(admin.id)?._max.createdAt ?? null,
      actionCount: byActor.get(admin.id)?._count._all ?? 0,
      isYou: admin.id === me,
    }))
  )
})

const activityQuery = paginationQuery.extend({ actorId: z.uuid().optional() })

/** What Platform Admins have done, across all organizations (optionally one admin). */
platformRouter.get(
  "/audit-log",
  validate({ query: activityQuery }),
  async (req, res) => {
    const q = req.query as unknown as z.infer<typeof activityQuery>
    const where: Prisma.AuditLogWhereInput = {
      action: { startsWith: "platform." },
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
          actorName: true,
          metadata: true,
          ip: true,
          createdAt: true,
          organization: { select: { id: true, name: true } },
        },
      }),
    ])
    sendPaginated(res, entries, { total, page: q.page, limit: q.limit })
  }
)

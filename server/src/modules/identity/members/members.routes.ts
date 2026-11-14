import { Router } from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import type { Prisma } from "@/generated/prisma/client.js"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import {
  can,
  requirePermission,
} from "@/modules/identity/permissions/access.js"
import {
  canAssignRole,
  canManageMember,
} from "@/modules/identity/permissions/policy.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"
import {
  asManaged,
  bumpAuthzVersion,
  idParam,
  loadMember,
  memberSelect,
  paginationQuery,
  requireActiveBranch,
  toMemberDto,
  type Db,
} from "@/modules/identity/shared.js"
import { sendPaginated, sendSuccess } from "@/utils/api-response.js"
import { HttpError } from "@/utils/http-error.js"

const ROLE = z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE"])

const listQuery = paginationQuery.extend({
  search: z.string().trim().max(100).optional(),
  branchId: z.uuid().optional(),
  teamId: z.uuid().optional(),
  role: ROLE.optional(),
  status: z.enum(["ACTIVE", "DEACTIVATED", "ALL"]).default("ACTIVE"),
})
const addRoleSchema = z.object({ role: ROLE, branchId: z.uuid().nullish() })
const updateMemberSchema = z.object({ homeBranchId: z.uuid() })
const roleParams = z.object({ id: z.uuid(), assignmentId: z.uuid() })

/** Loads a member the active role is allowed to manage. */
async function loadManageable(auth: AuthContext, id: string) {
  const member = await loadMember(prisma, auth.orgId, id)
  if (!canManageMember(auth, asManaged(member))) {
    throw HttpError.forbidden(
      member.id === auth.membershipId
        ? "You can't do this to your own account"
        : "You can't manage this person"
    )
  }
  return member
}

/** Other active Super Admins in the org, besides `excludeId`. */
function otherSuperAdmins(db: Db, orgId: string, excludeId: string) {
  return db.membership.count({
    where: {
      orgId,
      status: "ACTIVE",
      id: { not: excludeId },
      roleAssignments: { some: { role: "SUPER_ADMIN" } },
    },
  })
}

/** Teams lose their manager when the manager can no longer manage them. */
async function clearManagedTeams(
  db: Db,
  membershipId: string,
  branchId?: string | null
) {
  await db.team.updateMany({
    where: {
      managerId: membershipId,
      ...(branchId && { homeBranchId: branchId }),
    },
    data: { managerId: null },
  })
}

export const membersRouter = Router()
membersRouter.use(authenticate)

/** The member directory. Deactivated members only for people who manage members. */
membersRouter.get(
  "/",
  requirePermission("members:read"),
  validate({ query: listQuery }),
  async (req, res) => {
    const auth = getAuth(req)
    const q = req.query as unknown as z.infer<typeof listQuery>
    const status =
      q.status !== "ACTIVE" && !can(auth, "members:manage")
        ? "ACTIVE"
        : q.status

    const where: Prisma.MembershipWhereInput = {
      orgId: auth.orgId,
      ...(status !== "ALL" && { status }),
      ...(q.branchId && { homeBranchId: q.branchId }),
      ...(q.teamId && { teamId: q.teamId }),
      ...(q.role && { roleAssignments: { some: { role: q.role } } }),
      ...(q.search && {
        user: {
          OR: [
            { name: { contains: q.search, mode: "insensitive" } },
            { email: { contains: q.search, mode: "insensitive" } },
          ],
        },
      }),
    }

    const [total, members] = await Promise.all([
      prisma.membership.count({ where }),
      prisma.membership.findMany({
        where,
        orderBy: { user: { name: "asc" } },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        select: memberSelect,
      }),
    ])
    sendPaginated(res, members.map(toMemberDto), {
      total,
      page: q.page,
      limit: q.limit,
    })
  }
)

membersRouter.get(
  "/:id",
  requirePermission("members:read"),
  validate({ params: idParam }),
  async (req, res) => {
    const auth = getAuth(req)
    const member = await loadMember(prisma, auth.orgId, req.params.id as string)
    sendSuccess(res, toMemberDto(member))
  }
)

/** Moving someone to another home branch is for Super Admins. */
membersRouter.patch(
  "/:id",
  requirePermission("members:manage"),
  validate({ params: idParam, body: updateMemberSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    if (auth.role !== "SUPER_ADMIN") {
      throw HttpError.forbidden("Only Super Admins can change home branches")
    }
    const { homeBranchId } = req.body as z.infer<typeof updateMemberSchema>
    const member = await loadMember(prisma, auth.orgId, req.params.id as string)
    await requireActiveBranch(prisma, auth.orgId, homeBranchId)
    await prisma.membership.update({
      where: { id: member.id },
      data: { homeBranchId },
    })
    sendSuccess(
      res,
      toMemberDto(await loadMember(prisma, auth.orgId, member.id))
    )
  }
)

/** Gives a member another role. You can also give yourself roles you could grant. */
membersRouter.post(
  "/:id/roles",
  requirePermission("members:manage"),
  validate({ params: idParam, body: addRoleSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const input = req.body as z.infer<typeof addRoleSchema>
    const member = await loadMember(prisma, auth.orgId, req.params.id as string)
    if (member.status !== "ACTIVE") {
      throw HttpError.conflict("Reactivate this member first")
    }
    const isSelf = member.id === auth.membershipId
    if (!isSelf && !canManageMember(auth, asManaged(member))) {
      throw HttpError.forbidden("You can't manage this person")
    }

    const branchId = input.role === "SUPER_ADMIN" ? null : input.branchId
    if (input.role !== "SUPER_ADMIN") {
      if (!branchId) throw HttpError.badRequest("Choose a branch for this role")
      await requireActiveBranch(prisma, auth.orgId, branchId)
    }
    if (!canAssignRole(auth, input.role, branchId ?? null)) {
      throw HttpError.forbidden("You can't give this role")
    }
    if (
      member.roleAssignments.some(
        (a) => a.role === input.role && a.branchId === (branchId ?? null)
      )
    ) {
      throw HttpError.conflict("They already have this role")
    }

    await prisma.$transaction(async (tx) => {
      await tx.roleAssignment.create({
        data: {
          membershipId: member.id,
          role: input.role,
          branchId: branchId ?? null,
          createdById: auth.membershipId,
        },
      })
      await bumpAuthzVersion(tx, [member.id])
    })
    sendSuccess(
      res,
      toMemberDto(await loadMember(prisma, auth.orgId, member.id)),
      { status: 201 }
    )
  }
)

membersRouter.delete(
  "/:id/roles/:assignmentId",
  requirePermission("members:manage"),
  validate({ params: roleParams }),
  async (req, res) => {
    const auth = getAuth(req)
    const member = await loadMember(prisma, auth.orgId, req.params.id as string)
    const assignment = member.roleAssignments.find(
      (a) => a.id === req.params.assignmentId
    )
    if (!assignment) throw HttpError.notFound("Role not found")

    const isSelf = member.id === auth.membershipId
    if (!isSelf && !canManageMember(auth, asManaged(member))) {
      throw HttpError.forbidden("You can't manage this person")
    }
    if (!canAssignRole(auth, assignment.role, assignment.branchId)) {
      throw HttpError.forbidden("You can't remove this role")
    }
    if (member.roleAssignments.length === 1) {
      throw HttpError.conflict(
        "This is their only role. Deactivate them instead."
      )
    }
    if (assignment.role === "SUPER_ADMIN") {
      if (member.isOwner) {
        throw HttpError.conflict("The owner always keeps Super Admin")
      }
      if ((await otherSuperAdmins(prisma, auth.orgId, member.id)) === 0) {
        throw HttpError.conflict(
          "The organization needs at least one Super Admin"
        )
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.roleAssignment.delete({ where: { id: assignment.id } })
      if (assignment.role === "MANAGER") {
        await clearManagedTeams(tx, member.id, assignment.branchId)
      }
      await bumpAuthzVersion(tx, [member.id])
    })
    sendSuccess(
      res,
      toMemberDto(await loadMember(prisma, auth.orgId, member.id))
    )
  }
)

/** Ends the member's access immediately and signs them out everywhere. */
membersRouter.post(
  "/:id/deactivate",
  requirePermission("members:manage"),
  validate({ params: idParam }),
  async (req, res) => {
    const auth = getAuth(req)
    const member = await loadManageable(auth, req.params.id as string)
    if (member.isOwner) {
      throw HttpError.conflict("The owner can't be deactivated")
    }
    if (member.status === "DEACTIVATED") {
      throw HttpError.conflict("They're already deactivated")
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: member.id },
        data: { status: "DEACTIVATED" },
      })
      await tx.session.updateMany({
        where: { membershipId: member.id, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: "MEMBER_DEACTIVATED" },
      })
      await clearManagedTeams(tx, member.id)
      await bumpAuthzVersion(tx, [member.id])
    })
    sendSuccess(
      res,
      toMemberDto(await loadMember(prisma, auth.orgId, member.id))
    )
  }
)

membersRouter.post(
  "/:id/reactivate",
  requirePermission("members:manage"),
  validate({ params: idParam }),
  async (req, res) => {
    const auth = getAuth(req)
    const member = await loadManageable(auth, req.params.id as string)
    if (member.status === "ACTIVE") {
      throw HttpError.conflict("They're already active")
    }
    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: member.id },
        data: { status: "ACTIVE" },
      })
      await bumpAuthzVersion(tx, [member.id])
    })
    sendSuccess(
      res,
      toMemberDto(await loadMember(prisma, auth.orgId, member.id))
    )
  }
)

/** Signs the member out on every device. */
membersRouter.post(
  "/:id/revoke-sessions",
  requirePermission("members:manage"),
  validate({ params: idParam }),
  async (req, res) => {
    const auth = getAuth(req)
    const member = await loadManageable(auth, req.params.id as string)
    const { count } = await prisma.session.updateMany({
      where: { membershipId: member.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "REVOKED_BY_ADMIN" },
    })
    sendSuccess(res, { revoked: count }, { message: "Signed out everywhere" })
  }
)

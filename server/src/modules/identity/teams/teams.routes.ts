import { Router } from "express"
import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import { requirePermission } from "@/modules/identity/permissions/access.js"
import { canManageTeam } from "@/modules/identity/permissions/policy.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"
import {
  bumpAuthzVersion,
  idParam,
  requireActiveBranch,
  type Db,
} from "@/modules/identity/shared.js"
import { sendSuccess } from "@/utils/api-response.js"
import { HttpError } from "@/utils/http-error.js"

const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(100),
  homeBranchId: z.uuid(),
  managerId: z.uuid().nullish(),
})
const updateTeamSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  managerId: z.uuid().nullable().optional(),
})
const setMembersSchema = z.object({
  membershipIds: z.array(z.uuid()).max(500),
})

const teamSelect = {
  id: true,
  name: true,
  createdAt: true,
  homeBranch: { select: { id: true, name: true } },
  manager: {
    select: { id: true, user: { select: { name: true, email: true } } },
  },
  members: {
    where: { status: "ACTIVE" as const },
    orderBy: { joinedAt: "asc" as const },
    select: {
      id: true,
      homeBranch: { select: { id: true, name: true } },
      user: { select: { name: true, email: true } },
    },
  },
}

type TeamRow = Awaited<
  ReturnType<typeof prisma.team.findFirstOrThrow<{ select: typeof teamSelect }>>
>

function toTeamDto(team: TeamRow) {
  return {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt,
    homeBranch: team.homeBranch,
    manager: team.manager && {
      id: team.manager.id,
      name: team.manager.user.name,
      email: team.manager.user.email,
    },
    members: team.members.map((m) => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      homeBranch: m.homeBranch,
    })),
  }
}

async function findManageableTeam(auth: AuthContext, id: string) {
  const team = await prisma.team.findFirst({ where: { id, orgId: auth.orgId } })
  if (!team) throw HttpError.notFound("Team not found")
  if (!canManageTeam(auth, team)) {
    throw HttpError.forbidden("You can only manage teams in your branch")
  }
  return team
}

/** A team's manager must be an active member with Manager in its home branch. */
async function requireManager(
  db: Db,
  orgId: string,
  managerId: string,
  homeBranchId: string
) {
  const manager = await db.membership.findFirst({
    where: {
      id: managerId,
      orgId,
      status: "ACTIVE",
      roleAssignments: { some: { role: "MANAGER", branchId: homeBranchId } },
    },
    select: { id: true },
  })
  if (!manager) {
    throw HttpError.badRequest(
      "The manager must have the Manager role in the team's branch"
    )
  }
}

export const teamsRouter = Router()
teamsRouter.use(authenticate)

teamsRouter.get(
  "/",
  requirePermission("members:read"),
  validate({ query: z.object({ branchId: z.uuid().optional() }) }),
  async (req, res) => {
    const auth = getAuth(req)
    const { branchId } = req.query as { branchId?: string }
    const teams = await prisma.team.findMany({
      where: { orgId: auth.orgId, ...(branchId && { homeBranchId: branchId }) },
      orderBy: { name: "asc" },
      select: teamSelect,
    })
    sendSuccess(res, teams.map(toTeamDto))
  }
)

teamsRouter.post(
  "/",
  requirePermission("teams:manage"),
  validate({ body: createTeamSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const input = req.body as z.infer<typeof createTeamSchema>
    if (!canManageTeam(auth, input)) {
      throw HttpError.forbidden("You can only create teams in your branch")
    }
    await requireActiveBranch(prisma, auth.orgId, input.homeBranchId)
    if (input.managerId) {
      await requireManager(
        prisma,
        auth.orgId,
        input.managerId,
        input.homeBranchId
      )
    }
    const team = await prisma.team.create({
      data: {
        orgId: auth.orgId,
        name: input.name,
        homeBranchId: input.homeBranchId,
        managerId: input.managerId ?? null,
      },
      select: teamSelect,
    })
    sendSuccess(res, toTeamDto(team), { status: 201 })
  }
)

teamsRouter.patch(
  "/:id",
  requirePermission("teams:manage"),
  validate({ params: idParam, body: updateTeamSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const team = await findManageableTeam(auth, req.params.id as string)
    const input = req.body as z.infer<typeof updateTeamSchema>
    if (input.managerId) {
      await requireManager(
        prisma,
        auth.orgId,
        input.managerId,
        team.homeBranchId
      )
    }
    const updated = await prisma.team.update({
      where: { id: team.id },
      data: input,
      select: teamSelect,
    })
    sendSuccess(res, toTeamDto(updated))
  }
)

teamsRouter.delete(
  "/:id",
  requirePermission("teams:manage"),
  validate({ params: idParam }),
  async (req, res) => {
    const auth = getAuth(req)
    const team = await findManageableTeam(auth, req.params.id as string)
    await prisma.$transaction(async (tx) => {
      const members = await tx.membership.findMany({
        where: { teamId: team.id },
        select: { id: true },
      })
      await tx.team.delete({ where: { id: team.id } }) // members' teamId → NULL
      await bumpAuthzVersion(
        tx,
        members.map((m) => m.id)
      )
    })
    sendSuccess(res, null, { message: "Team deleted" })
  }
)

/** Sets the team's members. They can come from any branch of the org. */
teamsRouter.put(
  "/:id/members",
  requirePermission("teams:manage"),
  validate({ params: idParam, body: setMembersSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const team = await findManageableTeam(auth, req.params.id as string)
    const ids = [
      ...new Set((req.body as z.infer<typeof setMembersSchema>).membershipIds),
    ]

    const valid = await prisma.membership.count({
      where: { id: { in: ids }, orgId: auth.orgId, status: "ACTIVE" },
    })
    if (valid !== ids.length) {
      throw HttpError.badRequest("Some of these people aren't active members")
    }

    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.membership.findMany({
        where: { teamId: team.id },
        select: { id: true },
      })
      const leaving = current.map((m) => m.id).filter((id) => !ids.includes(id))
      const joining = ids.filter((id) => !current.some((m) => m.id === id))

      await tx.membership.updateMany({
        where: { id: { in: leaving } },
        data: { teamId: null },
      })
      await tx.membership.updateMany({
        where: { id: { in: joining } },
        data: { teamId: team.id },
      })
      await bumpAuthzVersion(tx, [...leaving, ...joining])
      return tx.team.findUniqueOrThrow({
        where: { id: team.id },
        select: teamSelect,
      })
    })
    sendSuccess(res, toTeamDto(updated))
  }
)

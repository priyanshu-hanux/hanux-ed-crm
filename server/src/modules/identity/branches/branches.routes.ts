import { Router } from "express"
import { audit } from "@/modules/identity/audit/audit.service.js"
import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import { authenticate, getAuth } from "@/middleware/authenticate.js"
import { validate } from "@/middleware/validate.js"
import { requirePermission } from "@/modules/identity/permissions/access.js"
import { idParam, timeZone } from "@/modules/identity/shared.js"
import { sendSuccess } from "@/utils/api-response.js"
import { HttpError } from "@/utils/http-error.js"

const branchFields = {
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().max(10).nullish(),
  timezone: timeZone,
  address: z.string().trim().max(500).nullish(),
}
const createBranchSchema = z.object(branchFields)
const updateBranchSchema = z.object(branchFields).partial()

const branchSelect = {
  id: true,
  name: true,
  code: true,
  timezone: true,
  address: true,
  isDefault: true,
  status: true,
  createdAt: true,
  _count: {
    select: {
      homeMembers: { where: { status: "ACTIVE" as const } },
      homeTeams: true,
    },
  },
}

function toBranchDto(branch: {
  _count: { homeMembers: number; homeTeams: number }
  [key: string]: unknown
}) {
  const { _count, ...rest } = branch
  return {
    ...rest,
    memberCount: _count.homeMembers,
    teamCount: _count.homeTeams,
  }
}

async function findBranch(orgId: string, id: string) {
  const branch = await prisma.branch.findFirst({ where: { id, orgId } })
  if (!branch) throw HttpError.notFound("Branch not found")
  return branch
}

export const branchesRouter = Router()
branchesRouter.use(authenticate)

branchesRouter.get(
  "/",
  requirePermission("members:read"),
  validate({
    query: z.object({ includeArchived: z.stringbool().default(false) }),
  }),
  async (req, res) => {
    const auth = getAuth(req)
    const { includeArchived } = req.query as unknown as {
      includeArchived: boolean
    }
    const branches = await prisma.branch.findMany({
      where: {
        orgId: auth.orgId,
        // Archived branches only matter to people who manage branches.
        ...(!(includeArchived && auth.role === "SUPER_ADMIN") && {
          status: "ACTIVE",
        }),
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: branchSelect,
    })
    sendSuccess(res, branches.map(toBranchDto))
  }
)

branchesRouter.post(
  "/",
  requirePermission("branches:manage"),
  validate({ body: createBranchSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const input = req.body as z.infer<typeof createBranchSchema>
    const branch = await prisma.branch.create({
      data: { ...input, orgId: auth.orgId },
      select: branchSelect,
    })
    await audit(req, {
      action: "branch.created",
      branchId: branch.id,
      targetType: "branch",
      targetId: branch.id,
      metadata: { name: branch.name },
    })
    sendSuccess(res, toBranchDto(branch), { status: 201 })
  }
)

branchesRouter.patch(
  "/:id",
  requirePermission("branches:update"),
  validate({ params: idParam, body: updateBranchSchema }),
  async (req, res) => {
    const auth = getAuth(req)
    const branch = await findBranch(auth.orgId, req.params.id as string)
    // Branch Admins edit only their own branch.
    if (auth.role !== "SUPER_ADMIN" && branch.id !== auth.branchId) {
      throw HttpError.forbidden("You can only edit your own branch")
    }
    const updated = await prisma.branch.update({
      where: { id: branch.id },
      data: req.body as z.infer<typeof updateBranchSchema>,
      select: branchSelect,
    })
    await audit(req, {
      action: "branch.updated",
      branchId: branch.id,
      targetType: "branch",
      targetId: branch.id,
      metadata: { ...(req.body as object) },
    })
    sendSuccess(res, toBranchDto(updated))
  }
)

branchesRouter.post(
  "/:id/archive",
  requirePermission("branches:manage"),
  validate({ params: idParam }),
  async (req, res) => {
    const auth = getAuth(req)
    const branch = await findBranch(auth.orgId, req.params.id as string)
    if (branch.isDefault) {
      throw HttpError.conflict("The default branch can't be archived")
    }

    const [members, roles, teams] = await Promise.all([
      prisma.membership.count({
        where: { homeBranchId: branch.id, status: "ACTIVE" },
      }),
      prisma.roleAssignment.count({
        where: { branchId: branch.id, membership: { status: "ACTIVE" } },
      }),
      prisma.team.count({ where: { homeBranchId: branch.id } }),
    ])
    if (members || roles || teams) {
      throw HttpError.conflict(
        "Move this branch's members, roles and teams to another branch before archiving it",
        "CONFLICT",
        { members, roles, teams }
      )
    }

    await prisma.$transaction([
      prisma.invite.updateMany({
        where: { branchId: branch.id, acceptedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.branch.update({
        where: { id: branch.id },
        data: { status: "ARCHIVED" },
      }),
    ])
    await audit(req, {
      action: "branch.archived",
      branchId: branch.id,
      targetType: "branch",
      targetId: branch.id,
      metadata: { name: branch.name },
    })
    sendSuccess(res, null, { message: "Branch archived" })
  }
)

branchesRouter.post(
  "/:id/restore",
  requirePermission("branches:manage"),
  validate({ params: idParam }),
  async (req, res) => {
    const auth = getAuth(req)
    const branch = await findBranch(auth.orgId, req.params.id as string)
    await prisma.branch.update({
      where: { id: branch.id },
      data: { status: "ACTIVE" },
    })
    await audit(req, {
      action: "branch.restored",
      branchId: branch.id,
      targetType: "branch",
      targetId: branch.id,
      metadata: { name: branch.name },
    })
    sendSuccess(res, null, { message: "Branch restored" })
  }
)

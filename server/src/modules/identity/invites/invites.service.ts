import { z } from "zod"
import { env } from "@/config/env.js"
import { generateToken, sha256 } from "@/lib/crypto.js"
import { sendEmail } from "@/lib/mailer.js"
import { hashPassword } from "@/lib/password.js"
import { prisma } from "@/lib/prisma.js"
import type { Prisma, Role } from "@/generated/prisma/client.js"
import {
  canAssignRole,
  canManageInvite,
} from "@/modules/identity/permissions/policy.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"
import {
  createSession,
  type NewSession,
  type RequestMeta,
} from "@/modules/identity/sessions/session.service.js"
import {
  defaultBranch,
  requireActiveBranch,
} from "@/modules/identity/shared.js"
import { ROLE_LABELS } from "@/modules/identity/roles.js"
import { HttpError } from "@/utils/http-error.js"

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const inviteInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address").max(254)),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE"]),
  /** Home branch, and the role's branch. Optional for Super Admin (default branch). */
  branchId: z.uuid().nullish(),
  teamId: z.uuid().nullish(),
})
export type InviteInput = z.infer<typeof inviteInputSchema>

const inviteSelect = {
  id: true,
  email: true,
  role: true,
  expiresAt: true,
  acceptedAt: true,
  revokedAt: true,
  createdAt: true,
  branchId: true,
  invitedById: true,
  branch: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  invitedBy: { select: { id: true, user: { select: { name: true } } } },
} satisfies Prisma.InviteSelect

type InviteRow = Prisma.InviteGetPayload<{ select: typeof inviteSelect }>

function statusOf(invite: InviteRow) {
  if (invite.acceptedAt) return "ACCEPTED" as const
  if (invite.revokedAt) return "REVOKED" as const
  if (invite.expiresAt.getTime() <= Date.now()) return "EXPIRED" as const
  return "PENDING" as const
}

function toInviteDto(invite: InviteRow) {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: statusOf(invite),
    branch: invite.branch,
    team: invite.team,
    invitedBy: invite.invitedBy && {
      id: invite.invitedBy.id,
      name: invite.invitedBy.user.name,
    },
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
  }
}
export type InviteDto = ReturnType<typeof toInviteDto>

async function sendInviteEmail(
  orgId: string,
  email: string,
  role: Role,
  token: string,
  inviterName: string
) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { name: true },
  })
  const link = `${env.APP_URL}/auth/invite/${token}`
  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to ${org.name} on Hanux CRM`,
    text: [
      `${inviterName} invited you to join ${org.name} on Hanux CRM as ${ROLE_LABELS[role]}.`,
      "",
      `Accept the invitation: ${link}`,
      "",
      "This link expires in 7 days. If you weren't expecting it, you can ignore this email.",
    ].join("\n"),
  })
}

async function inviterName(auth: AuthContext) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.userId },
    select: { name: true },
  })
  return user.name
}

/**
 * Works out where the invitee will sit, checking the people-management rules:
 * - Managers invite Executives into a team they manage; the home branch is the team's.
 * - Admins invite Managers and Executives into their branch (and its teams).
 * - Super Admins invite anyone anywhere.
 */
async function resolvePlacement(auth: AuthContext, input: InviteInput) {
  let { branchId, teamId } = input

  if (auth.role === "MANAGER") {
    if (input.role !== "EXECUTIVE") {
      throw HttpError.forbidden("Managers can only invite Executives")
    }
    const teams = await prisma.team.findMany({
      where: { orgId: auth.orgId, managerId: auth.membershipId },
      select: { id: true, homeBranchId: true },
    })
    const team = teamId ? teams.find((t) => t.id === teamId) : teams[0]
    if (!team || (!teamId && teams.length > 1)) {
      throw HttpError.badRequest(
        teams.length === 0
          ? "You need a team before you can invite people"
          : "Choose which of your teams to invite them into"
      )
    }
    teamId = team.id
    branchId = team.homeBranchId
  }

  if (!branchId) {
    if (input.role !== "SUPER_ADMIN") {
      throw HttpError.badRequest("Choose a branch")
    }
    branchId = (await defaultBranch(prisma, auth.orgId)).id
  }
  await requireActiveBranch(prisma, auth.orgId, branchId)

  const roleBranch = input.role === "SUPER_ADMIN" ? null : branchId
  if (!canAssignRole(auth, input.role, roleBranch)) {
    throw HttpError.forbidden("You can't invite someone with this role")
  }

  if (teamId && auth.role !== "MANAGER") {
    const team = await prisma.team.findFirst({
      where: { id: teamId, orgId: auth.orgId },
      select: { homeBranchId: true },
    })
    if (!team) throw HttpError.badRequest("That team doesn't exist")
    if (auth.role === "ADMIN" && team.homeBranchId !== auth.branchId) {
      throw HttpError.forbidden(
        "You can only add people to your branch's teams"
      )
    }
  }

  return { branchId, teamId: teamId ?? null }
}

export async function createInvite(
  auth: AuthContext,
  input: InviteInput
): Promise<InviteDto> {
  const placement = await resolvePlacement(auth, input)

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { memberships: { select: { orgId: true } } },
  })
  if (existing) {
    throw HttpError.conflict(
      existing.memberships.some((m) => m.orgId === auth.orgId)
        ? "They're already a member of this organization"
        : "This email already has an account in another organization",
      "ALREADY_MEMBER"
    )
  }

  const token = generateToken()
  const invite = await prisma.$transaction(async (tx) => {
    // A new invite replaces any pending one for the same email.
    await tx.invite.updateMany({
      where: {
        orgId: auth.orgId,
        email: input.email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    })
    return tx.invite.create({
      data: {
        orgId: auth.orgId,
        email: input.email,
        role: input.role,
        ...placement,
        invitedById: auth.membershipId,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
      select: inviteSelect,
    })
  })

  try {
    await sendInviteEmail(
      auth.orgId,
      input.email,
      input.role,
      token,
      await inviterName(auth)
    )
  } catch {
    await prisma.invite.delete({ where: { id: invite.id } })
    throw new HttpError(
      502,
      "EMAIL_FAILED",
      "Couldn't send the invitation email"
    )
  }
  return toInviteDto(invite)
}

export async function listInvites(auth: AuthContext, includeClosed: boolean) {
  const scope: Prisma.InviteWhereInput =
    auth.role === "SUPER_ADMIN"
      ? {}
      : auth.role === "ADMIN"
        ? { branchId: auth.branchId ?? "" }
        : { invitedById: auth.membershipId }
  const invites = await prisma.invite.findMany({
    where: {
      orgId: auth.orgId,
      ...scope,
      ...(!includeClosed && { acceptedAt: null, revokedAt: null }),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: inviteSelect,
  })
  return invites.map(toInviteDto)
}

async function loadManageableInvite(auth: AuthContext, id: string) {
  const invite = await prisma.invite.findFirst({
    where: { id, orgId: auth.orgId },
    select: inviteSelect,
  })
  if (!invite || !canManageInvite(auth, invite)) {
    throw HttpError.notFound("Invite not found")
  }
  if (invite.acceptedAt || invite.revokedAt) {
    throw HttpError.conflict("This invite is no longer open")
  }
  return invite
}

/** New link, new 7-day expiry. The old link stops working. */
export async function resendInvite(auth: AuthContext, id: string) {
  const invite = await loadManageableInvite(auth, id)
  const token = generateToken()
  const updated = await prisma.invite.update({
    where: { id: invite.id },
    data: {
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
    select: inviteSelect,
  })
  try {
    await sendInviteEmail(
      auth.orgId,
      invite.email,
      invite.role,
      token,
      await inviterName(auth)
    )
  } catch {
    throw new HttpError(
      502,
      "EMAIL_FAILED",
      "Couldn't send the invitation email"
    )
  }
  return toInviteDto(updated)
}

export async function revokeInvite(auth: AuthContext, id: string) {
  const invite = await loadManageableInvite(auth, id)
  await prisma.invite.update({
    where: { id: invite.id },
    data: { revokedAt: new Date() },
  })
}

// ─── Public: viewing and accepting ────────────────────────────────────────────

const invalidInvite = () =>
  new HttpError(
    404,
    "INVITE_INVALID",
    "This invitation link is invalid or has expired. Ask for a new one."
  )

async function findOpenInvite(token: string) {
  const invite = await prisma.invite.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      organization: { select: { name: true, status: true } },
      branch: { select: { name: true, status: true } },
      team: { select: { id: true, name: true } },
      invitedBy: { select: { user: { select: { name: true } } } },
    },
  })
  if (
    !invite ||
    invite.acceptedAt ||
    invite.revokedAt ||
    invite.expiresAt.getTime() <= Date.now() ||
    invite.organization.status !== "ACTIVE" ||
    invite.branch.status !== "ACTIVE"
  ) {
    throw invalidInvite()
  }
  return invite
}

/** What the accept page shows. */
export async function viewInvite(token: string) {
  const invite = await findOpenInvite(token)
  const accountExists = Boolean(
    await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true },
    })
  )
  return {
    email: invite.email,
    role: invite.role,
    organization: { name: invite.organization.name },
    branch: { name: invite.branch.name },
    team: invite.team && { name: invite.team.name },
    invitedBy: invite.invitedBy && { name: invite.invitedBy.user.name },
    expiresAt: invite.expiresAt,
    accountExists,
  }
}

export const acceptInviteSchema = z.object({
  name: z.string().trim().min(1).max(100),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
})

/** Creates the account and membership, and signs the new member in. */
export async function acceptInvite(
  token: string,
  input: z.infer<typeof acceptInviteSchema>,
  meta: RequestMeta
): Promise<NewSession> {
  const invite = await findOpenInvite(token)
  if (
    await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true },
    })
  ) {
    throw HttpError.conflict(
      "This email already has an account. Joining a second organization isn't supported yet.",
      "ALREADY_MEMBER"
    )
  }
  const passwordHash = await hashPassword(input.password)

  return prisma.$transaction(async (tx) => {
    // Claim the invite first, so two clicks can't both use it.
    const claimed = await tx.invite.updateMany({
      where: { id: invite.id, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: new Date() },
    })
    if (claimed.count === 0) throw invalidInvite()

    const user = await tx.user.create({
      data: {
        email: invite.email,
        name: input.name,
        passwordHash,
        // They proved they own the address by opening the emailed link.
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      },
    })
    const membership = await tx.membership.create({
      data: {
        userId: user.id,
        orgId: invite.orgId,
        homeBranchId: invite.branchId,
        teamId: invite.team?.id ?? null,
      },
    })
    const assignment = await tx.roleAssignment.create({
      data: {
        membershipId: membership.id,
        role: invite.role,
        branchId: invite.role === "SUPER_ADMIN" ? null : invite.branchId,
        createdById: invite.invitedById,
      },
    })
    return createSession(
      tx,
      {
        userId: user.id,
        membershipId: membership.id,
        orgId: invite.orgId,
        activeAssignmentId: assignment.id,
      },
      meta
    )
  })
}

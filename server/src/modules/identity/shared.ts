import { z } from "zod"
import { prisma } from "@/lib/prisma.js"
import type { Prisma } from "@/generated/prisma/client.js"
import { HttpError } from "@/utils/http-error.js"

export type Db = Prisma.TransactionClient | typeof prisma

/** Valid IANA time zone, e.g. "Asia/Kolkata". */
export const timeZone = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}, "Unknown time zone")

export const idParam = z.object({ id: z.uuid() })

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
})

/**
 * Marks members' permissions as changed. Call in the same transaction as any
 * change to their status, role assignments or team.
 */
export async function bumpAuthzVersion(
  db: Db,
  membershipIds: string[]
): Promise<void> {
  if (membershipIds.length === 0) return
  await db.membership.updateMany({
    where: { id: { in: membershipIds } },
    data: { authzVersion: { increment: 1 } },
  })
}

/** An active branch of the org, or 400. */
export async function requireActiveBranch(
  db: Db,
  orgId: string,
  branchId: string
) {
  const branch = await db.branch.findFirst({
    where: { id: branchId, orgId, status: "ACTIVE" },
  })
  if (!branch) throw HttpError.badRequest("That branch doesn't exist")
  return branch
}

/** The org's default branch. */
export async function defaultBranch(db: Db, orgId: string) {
  return db.branch.findFirstOrThrow({ where: { orgId, isDefault: true } })
}

/** What a member looks like in API responses. */
export const memberSelect = {
  id: true,
  status: true,
  isOwner: true,
  joinedAt: true,
  homeBranchId: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      lastLoginAt: true,
    },
  },
  homeBranch: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  roleAssignments: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      branchId: true,
      branch: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.MembershipSelect

type MemberRow = Prisma.MembershipGetPayload<{ select: typeof memberSelect }>

export function toMemberDto(member: MemberRow) {
  return {
    id: member.id,
    userId: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatarUrl: member.user.avatarUrl,
    status: member.status,
    isOwner: member.isOwner,
    joinedAt: member.joinedAt,
    lastLoginAt: member.user.lastLoginAt,
    homeBranch: member.homeBranch,
    team: member.team,
    roles: member.roleAssignments.map((a) => ({
      id: a.id,
      role: a.role,
      branch: a.branch,
    })),
  }
}

/** A member of the org with their roles, or 404. */
export async function loadMember(db: Db, orgId: string, membershipId: string) {
  const member = await db.membership.findFirst({
    where: { id: membershipId, orgId },
    select: memberSelect,
  })
  if (!member) throw HttpError.notFound("Member not found")
  return member
}

/** The shape the people-management rules need. */
export function asManaged(member: MemberRow) {
  return {
    id: member.id,
    homeBranchId: member.homeBranchId,
    isOwner: member.isOwner,
    roles: member.roleAssignments.map((a) => ({
      role: a.role,
      branchId: a.branchId,
    })),
  }
}

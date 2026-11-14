import { randomBytes } from "node:crypto"
import { prisma } from "@/lib/prisma.js"
import {
  hashPassword,
  verifyAgainstDummy,
  verifyPassword,
} from "@/lib/password.js"
import type {
  LoginInput,
  SignupInput,
} from "@/modules/identity/auth/auth.schemas.js"
import { pickBroadest } from "@/modules/identity/roles.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"
import {
  createSession,
  type NewSession,
  type RequestMeta,
} from "@/modules/identity/sessions/session.service.js"
import { HttpError } from "@/utils/http-error.js"

function slugify(name: string): string {
  return (
    name
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "org"
  )
}

async function uniqueOrgSlug(name: string): Promise<string> {
  const base = slugify(name)
  let slug = base
  for (let attempt = 0; attempt < 5; attempt++) {
    const taken = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (!taken) return slug
    slug = `${base}-${randomBytes(3).toString("hex")}`
  }
  throw HttpError.conflict("Could not create a unique organization address")
}

/**
 * Creates the organization, its Main branch and the owner (Super Admin),
 * then signs them in.
 */
export async function signup(
  input: SignupInput,
  meta: RequestMeta
): Promise<NewSession> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })
  if (existing) {
    throw HttpError.conflict(
      "An account with this email already exists",
      "EMAIL_IN_USE"
    )
  }

  const [passwordHash, slug] = await Promise.all([
    hashPassword(input.password),
    uniqueOrgSlug(input.orgName),
  ])
  const timezone = input.timezone ?? "UTC"

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: input.orgName, slug, timezone },
      select: { id: true },
    })
    const branch = await tx.branch.create({
      data: { orgId: org.id, name: "Main", timezone, isDefault: true },
      select: { id: true },
    })
    const user = await tx.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      select: { id: true },
    })
    const membership = await tx.membership.create({
      data: {
        userId: user.id,
        orgId: org.id,
        homeBranchId: branch.id,
        isOwner: true,
      },
      select: { id: true },
    })
    const assignment = await tx.roleAssignment.create({
      data: { membershipId: membership.id, role: "SUPER_ADMIN" },
      select: { id: true },
    })
    await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return createSession(
      tx,
      {
        userId: user.id,
        membershipId: membership.id,
        orgId: org.id,
        activeAssignmentId: assignment.id,
      },
      meta
    )
  })
}

const invalidCredentials = () =>
  HttpError.unauthorized("Incorrect email or password", "INVALID_CREDENTIALS")

export async function login(
  input: LoginInput,
  meta: RequestMeta
): Promise<NewSession> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          orgId: true,
          organization: { select: { status: true } },
          roleAssignments: { select: { id: true, role: true } },
        },
      },
    },
  })

  if (!user) {
    await verifyAgainstDummy(input.password)
    throw invalidCredentials()
  }
  if (!(await verifyPassword(user.passwordHash, input.password))) {
    throw invalidCredentials()
  }

  // Only reveal account state after the password is proven.
  if (user.status !== "ACTIVE") {
    throw HttpError.forbidden(
      "Your account has been disabled",
      "ACCOUNT_DISABLED"
    )
  }

  // v1: one organization per user.
  const membership = user.memberships[0]
  if (!membership) {
    throw HttpError.forbidden(
      "You don't belong to any organization",
      "NO_ORGANIZATION"
    )
  }
  if (membership.organization.status !== "ACTIVE") {
    throw HttpError.forbidden(
      "Your organization has been suspended",
      "ORGANIZATION_SUSPENDED"
    )
  }
  const assignment = pickBroadest(membership.roleAssignments)
  if (!assignment) {
    throw HttpError.forbidden(
      "You don't have a role in this organization",
      "NO_ORGANIZATION"
    )
  }

  const [session] = await Promise.all([
    createSession(
      prisma,
      {
        userId: user.id,
        membershipId: membership.id,
        orgId: membership.orgId,
        activeAssignmentId: assignment.id,
      },
      meta
    ),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
  ])
  return session
}

/** Everything the client needs about the signed-in user, in one response. */
export async function getSessionInfo(auth: AuthContext) {
  const membership = await prisma.membership.findUniqueOrThrow({
    where: { id: auth.membershipId },
    select: {
      id: true,
      isOwner: true,
      homeBranchId: true,
      teamId: true,
      authzVersion: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          emailVerifiedAt: true,
          isPlatformAdmin: true,
        },
      },
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          timezone: true,
          branches: {
            where: { status: "ACTIVE" },
            orderBy: [{ isDefault: "desc" }, { name: "asc" }],
            select: {
              id: true,
              name: true,
              code: true,
              timezone: true,
              isDefault: true,
            },
          },
        },
      },
      roleAssignments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          branch: { select: { id: true, name: true } },
        },
      },
    },
  })

  const { branches, ...organization } = membership.organization

  return {
    user: membership.user,
    organization,
    branches,
    membership: {
      id: membership.id,
      isOwner: membership.isOwner,
      homeBranchId: membership.homeBranchId,
      teamId: membership.teamId,
    },
    assignments: membership.roleAssignments,
    activeAssignmentId: auth.assignmentId,
    authzVersion: membership.authzVersion,
  }
}

export type SessionInfo = Awaited<ReturnType<typeof getSessionInfo>>

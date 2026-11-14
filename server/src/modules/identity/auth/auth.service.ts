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
import type { AuditEvent } from "@/modules/identity/audit/audit.service.js"
import { pickBroadest } from "@/modules/identity/roles.js"
import type { LoadedSession } from "@/modules/identity/sessions/auth-context.js"
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
): Promise<NewSession & { userId: string; orgId: string; branchId: string }> {
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

    const session = await createSession(
      tx,
      {
        userId: user.id,
        membershipId: membership.id,
        orgId: org.id,
        activeAssignmentId: assignment.id,
      },
      meta
    )
    return { ...session, userId: user.id, orgId: org.id, branchId: branch.id }
  })
}

const invalidCredentials = () =>
  HttpError.unauthorized("Incorrect email or password", "INVALID_CREDENTIALS")

/** Failed sign-ins before the account locks, and for how long. */
export const MAX_FAILED_LOGINS = 10
export const LOCK_DURATION_MS = 15 * 60 * 1000

/**
 * Signs in. `record` receives audit events (failed attempts, lockouts,
 * success), since failures end in an error the route can't inspect safely.
 */
export async function login(
  input: LoginInput,
  meta: RequestMeta,
  record: (event: AuditEvent) => Promise<void>
): Promise<NewSession> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: {
      id: true,
      passwordHash: true,
      status: true,
      isPlatformAdmin: true,
      failedLoginCount: true,
      lockedUntil: true,
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          orgId: true,
          homeBranchId: true,
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

  const where = {
    orgId: user.memberships[0]?.orgId ?? null,
    branchId: user.memberships[0]?.homeBranchId ?? null,
    actorId: user.id,
    targetType: "user" as const,
    targetId: user.id,
  }

  // Locked: refuse even the right password until the lock ends (or a reset).
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await record({ ...where, action: "auth.login_blocked" })
    throw accountLocked()
  }

  if (!(await verifyPassword(user.passwordHash, input.password))) {
    const failures = user.failedLoginCount + 1
    const lock = failures >= MAX_FAILED_LOGINS
    await prisma.user.update({
      where: { id: user.id },
      data: lock
        ? {
            failedLoginCount: 0,
            lockedUntil: new Date(Date.now() + LOCK_DURATION_MS),
          }
        : { failedLoginCount: failures },
    })
    await record({
      ...where,
      action: lock ? "auth.locked" : "auth.login_failed",
      metadata: { failures },
    })
    throw lock ? accountLocked() : invalidCredentials()
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
  const assignment = membership && pickBroadest(membership.roleAssignments)
  const orgUsable =
    membership?.organization.status === "ACTIVE" && assignment !== undefined

  // Hanux staff without a usable org role sign in as Platform Admin.
  if (!orgUsable && !user.isPlatformAdmin) {
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
    throw HttpError.forbidden(
      "You don't have a role in this organization",
      "NO_ORGANIZATION"
    )
  }

  const [session] = await Promise.all([
    createSession(
      prisma,
      orgUsable
        ? {
            userId: user.id,
            membershipId: membership.id,
            orgId: membership.orgId,
            activeAssignmentId: assignment.id,
          }
        : {
            userId: user.id,
            membershipId: membership?.id ?? null,
            orgId: membership?.orgId ?? null,
            activeAssignmentId: assignment?.id ?? null,
            platformMode: true,
          },
      meta
    ),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), failedLoginCount: 0, lockedUntil: null },
    }),
  ])
  await record({ ...where, action: "auth.login" })
  return session
}

const accountLocked = () =>
  new HttpError(
    429,
    "ACCOUNT_LOCKED",
    "Too many failed sign-in attempts. Try again in 15 minutes, or reset your password."
  )

/**
 * Everything the client needs about the signed-in user, in one response.
 * In platform mode there is no active org role; their own org (if any) is
 * still returned so the role switcher can switch back to it.
 */
export async function getSessionInfo(loaded: LoadedSession) {
  const { auth } = loaded
  const [user, membership] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        isPlatformAdmin: true,
      },
    }),
    auth.membershipId
      ? prisma.membership.findUnique({
          where: { id: auth.membershipId },
          select: {
            id: true,
            isOwner: true,
            homeBranchId: true,
            teamId: true,
            authzVersion: true,
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
      : null,
  ])

  const organization = membership
    ? {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        timezone: membership.organization.timezone,
      }
    : null

  return {
    /** "org": working in an org role. "platform": working as Platform Admin. */
    mode: loaded.mode,
    user,
    organization,
    branches: membership?.organization.branches ?? [],
    membership: membership && {
      id: membership.id,
      isOwner: membership.isOwner,
      homeBranchId: membership.homeBranchId,
      teamId: membership.teamId,
    },
    assignments: membership?.roleAssignments ?? [],
    activeAssignmentId: loaded.mode === "org" ? loaded.auth.assignmentId : null,
    /** What the active role may do: permission → true or a scope. */
    permissions: loaded.mode === "org" ? loaded.auth.permissions : {},
    authzVersion: membership?.authzVersion ?? 0,
  }
}

export type SessionInfo = Awaited<ReturnType<typeof getSessionInfo>>

import { sha256 } from "@/lib/crypto.js"
import { prisma } from "@/lib/prisma.js"
import type { Role } from "@/generated/prisma/client.js"
import {
  type PermissionMap,
  permissionsFor,
} from "@/modules/identity/permissions/catalog.js"
import { pickBroadest } from "@/modules/identity/roles.js"
import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from "@/modules/identity/sessions/session.config.js"
import { revokeSession } from "@/modules/identity/sessions/session.service.js"
import { HttpError } from "@/utils/http-error.js"

/** Who is making the request, and with which org role. Set on req.auth. */
export interface AuthContext {
  sessionId: string
  userId: string
  orgId: string
  membershipId: string
  isOwner: boolean
  /** Active role assignment. */
  assignmentId: string
  role: Role
  /** Branch of the active assignment; null for Super Admin (org-wide). */
  branchId: string | null
  isPlatformAdmin: boolean
  authzVersion: number
  /** What the active role may do. */
  permissions: PermissionMap
}

/** A Hanux staff member working as Platform Admin. Set on req.platformAuth. */
export interface PlatformContext {
  sessionId: string
  userId: string
  /** Their own org membership, if they have one (to switch back to it). */
  membershipId: string | null
  orgId: string | null
}

export type LoadedSession =
  | { mode: "org"; auth: AuthContext }
  | { mode: "platform"; auth: PlatformContext }

const revoked = (message: string) =>
  HttpError.unauthorized(message, "SESSION_REVOKED")

const permissionsChanged = (message: string) =>
  HttpError.forbidden(message, "PERMISSIONS_CHANGED")

/**
 * The only place that reads session and permission data for a request.
 * Checks everything on every request, so removed access ends immediately.
 * A Redis cache, when added, goes inside this function.
 */
export async function loadSession(token: string): Promise<LoadedSession> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: { select: { status: true, isPlatformAdmin: true } },
      membership: {
        select: {
          status: true,
          isOwner: true,
          authzVersion: true,
          organization: { select: { status: true } },
        },
      },
      activeAssignment: { select: { id: true, role: true, branchId: true } },
    },
  })

  if (!session) throw HttpError.unauthorized()

  if (session.revokedAt) {
    throw revoked("You were signed out. Please sign in again.")
  }

  const now = Date.now()
  if (
    session.expiresAt.getTime() <= now ||
    session.lastUsedAt.getTime() + SESSION_IDLE_TIMEOUT_MS <= now
  ) {
    throw HttpError.unauthorized(
      "Your session expired. Please sign in again.",
      "SESSION_EXPIRED"
    )
  }

  if (session.user.status !== "ACTIVE") {
    throw revoked("Your account has been disabled.")
  }

  const membershipUsable =
    session.membership?.status === "ACTIVE" &&
    session.membership.organization.status === "ACTIVE"

  // ─── Platform mode ──────────────────────────────────────────────────────
  if (session.platformMode) {
    if (!session.user.isPlatformAdmin) {
      // Platform access was removed: fall back to their org role, if any.
      if (membershipUsable) {
        await prisma.session.update({
          where: { id: session.id },
          data: { platformMode: false },
        })
        throw permissionsChanged(
          "Your Platform Admin access was removed. You've been switched to your organization role."
        )
      }
      await revokeSession(session.id, "NO_ROLES_LEFT")
      throw revoked("Your Platform Admin access was removed.")
    }
    await touch(session.id, session.lastUsedAt, now)
    return {
      mode: "platform",
      auth: {
        sessionId: session.id,
        userId: session.userId,
        membershipId: session.membershipId,
        orgId: session.orgId,
      },
    }
  }

  // ─── Org mode ───────────────────────────────────────────────────────────
  // The database guarantees org sessions have a membership and an org.
  if (!session.membership || !session.membershipId || !session.orgId) {
    throw revoked("Please sign in again.")
  }
  if (session.membership.status !== "ACTIVE") {
    throw revoked("Your access to this organization has been removed.")
  }
  if (session.membership.organization.status !== "ACTIVE") {
    throw revoked("Your organization has been suspended.")
  }

  // The role this session was using was removed: move to another one, or end
  // the session if none is left.
  if (!session.activeAssignment) {
    const remaining = await prisma.roleAssignment.findMany({
      where: { membershipId: session.membershipId },
      select: { id: true, role: true },
    })
    const next = pickBroadest(remaining)
    if (!next) {
      await revokeSession(session.id, "NO_ROLES_LEFT")
      throw revoked("You no longer have any role in this organization.")
    }
    await prisma.session.update({
      where: { id: session.id },
      data: { activeAssignmentId: next.id },
    })
    throw permissionsChanged(
      "The role you were using was removed. You've been switched to another of your roles."
    )
  }

  await touch(session.id, session.lastUsedAt, now)

  return {
    mode: "org",
    auth: {
      sessionId: session.id,
      userId: session.userId,
      orgId: session.orgId,
      membershipId: session.membershipId,
      isOwner: session.membership.isOwner,
      assignmentId: session.activeAssignment.id,
      role: session.activeAssignment.role,
      branchId: session.activeAssignment.branchId,
      isPlatformAdmin: session.user.isPlatformAdmin,
      authzVersion: session.membership.authzVersion,
      permissions: permissionsFor(session.activeAssignment.role),
    },
  }
}

/** lastUsedAt is written at most every few minutes. */
async function touch(sessionId: string, lastUsedAt: Date, now: number) {
  if (lastUsedAt.getTime() + SESSION_TOUCH_INTERVAL_MS <= now) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date(now) },
    })
  }
}

/** For org routes: refuses sessions working as Platform Admin. */
export async function loadAuthContext(token: string): Promise<AuthContext> {
  const loaded = await loadSession(token)
  if (loaded.mode === "platform") {
    throw HttpError.forbidden(
      "You're working as Platform Admin. Switch to an organization role to use this.",
      "PLATFORM_MODE"
    )
  }
  return loaded.auth
}

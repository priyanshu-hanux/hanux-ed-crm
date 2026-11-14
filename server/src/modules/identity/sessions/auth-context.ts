import { sha256 } from "@/lib/crypto.js"
import { prisma } from "@/lib/prisma.js"
import type { Role } from "@/generated/prisma/client.js"
import { pickBroadest } from "@/modules/identity/roles.js"
import {
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_TOUCH_INTERVAL_MS,
} from "@/modules/identity/sessions/session.config.js"
import { revokeSession } from "@/modules/identity/sessions/session.service.js"
import { HttpError } from "@/utils/http-error.js"

/** Who is making the request, and with which role. Set on req.auth. */
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
}

const revoked = (message: string) =>
  HttpError.unauthorized(message, "SESSION_REVOKED")

/**
 * The only place that reads session and permission data for a request.
 * Checks everything on every request, so removed access ends immediately.
 * A Redis cache, when added, goes inside this function.
 */
export async function loadAuthContext(token: string): Promise<AuthContext> {
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
    throw HttpError.forbidden(
      "Your role was changed. Reload to continue.",
      "PERMISSIONS_CHANGED"
    )
  }

  if (session.lastUsedAt.getTime() + SESSION_TOUCH_INTERVAL_MS <= now) {
    await prisma.session.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date(now) },
    })
  }

  return {
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
  }
}

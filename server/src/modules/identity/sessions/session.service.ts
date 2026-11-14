import { generateToken, sha256 } from "@/lib/crypto.js"
import { prisma } from "@/lib/prisma.js"
import type { Prisma, SessionRevokedReason } from "@/generated/prisma/client.js"
import { SESSION_MAX_AGE_MS } from "@/modules/identity/sessions/session.config.js"
import { HttpError } from "@/utils/http-error.js"

type Db = Prisma.TransactionClient | typeof prisma

export interface RequestMeta {
  userAgent?: string | undefined
  ip?: string | undefined
}

export interface NewSession {
  /** Raw token for the cookie. Never stored. */
  token: string
  sessionId: string
  expiresAt: Date
}

export async function createSession(
  db: Db,
  input: {
    userId: string
    /** null only for Platform Admins without an organization. */
    membershipId: string | null
    orgId: string | null
    activeAssignmentId: string | null
    platformMode?: boolean
  },
  meta: RequestMeta
): Promise<NewSession> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)

  const session = await db.session.create({
    data: {
      ...input,
      tokenHash: sha256(token),
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 512),
      ip: meta.ip,
    },
    select: { id: true },
  })

  return { token, sessionId: session.id, expiresAt }
}

/** Revokes a session by its raw token. Does nothing if unknown or revoked. */
export async function revokeSessionByToken(
  token: string,
  reason: SessionRevokedReason
): Promise<void> {
  await prisma.session.updateMany({
    where: { tokenHash: sha256(token), revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  })
}

/**
 * Switches what the session works as, and replaces its token (the old cookie
 * stops working):
 * - an assignment id: one of the member's org roles;
 * - "platform": Platform Admin (Hanux staff only).
 */
export async function switchSessionRole(input: {
  sessionId: string
  userId: string
  membershipId: string | null
  target: { assignmentId: string } | { platform: true }
}): Promise<{ token: string; expiresAt: Date }> {
  let data: Prisma.SessionUpdateInput
  if ("platform" in input.target) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: { isPlatformAdmin: true },
    })
    if (!user.isPlatformAdmin) throw HttpError.forbidden()
    data = { platformMode: true }
  } else {
    const assignment = await prisma.roleAssignment.findFirst({
      where: {
        id: input.target.assignmentId,
        membershipId: input.membershipId ?? "",
        // Only into an org they can actually use.
        membership: { status: "ACTIVE", organization: { status: "ACTIVE" } },
      },
      select: { id: true },
    })
    if (!assignment) throw HttpError.notFound("You don't have that role")
    data = {
      platformMode: false,
      activeAssignment: { connect: { id: assignment.id } },
    }
  }

  const token = generateToken()
  const session = await prisma.session.update({
    where: { id: input.sessionId },
    data: { ...data, tokenHash: sha256(token) },
    select: { expiresAt: true },
  })
  return { token, expiresAt: session.expiresAt }
}

/** Gives a session a new token (e.g. after a password change). */
export async function rotateSessionToken(
  sessionId: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken()
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { tokenHash: sha256(token) },
    select: { expiresAt: true },
  })
  return { token, expiresAt: session.expiresAt }
}

export async function revokeSession(
  sessionId: string,
  reason: SessionRevokedReason
): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  })
}

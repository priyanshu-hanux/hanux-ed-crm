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
    membershipId: string
    orgId: string
    activeAssignmentId: string
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
 * Makes another of the member's role assignments active and replaces the
 * session token (the old cookie stops working).
 */
export async function switchActiveAssignment(input: {
  sessionId: string
  membershipId: string
  assignmentId: string
}): Promise<{ token: string; expiresAt: Date }> {
  const assignment = await prisma.roleAssignment.findFirst({
    where: { id: input.assignmentId, membershipId: input.membershipId },
    select: { id: true },
  })
  if (!assignment) throw HttpError.notFound("You don't have that role")

  const token = generateToken()
  const session = await prisma.session.update({
    where: { id: input.sessionId },
    data: { activeAssignmentId: assignment.id, tokenHash: sha256(token) },
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

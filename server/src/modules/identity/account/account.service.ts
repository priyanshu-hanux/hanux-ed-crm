import { randomInt } from "node:crypto"
import { z } from "zod"
import { env } from "@/config/env.js"
import { generateToken, sha256 } from "@/lib/crypto.js"
import { sendEmail } from "@/lib/mailer.js"
import { hashPassword, verifyPassword } from "@/lib/password.js"
import { prisma } from "@/lib/prisma.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"
import { HttpError } from "@/utils/http-error.js"

const MINUTE = 60 * 1000
const EMAIL_CODE_TTL_MS = 10 * MINUTE
const EMAIL_CODE_MAX_ATTEMPTS = 5
const RESET_TTL_MS = 30 * MINUTE

/** Same rule as sign-up and the client's hint. */
export const newPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")

const codeHash = (userId: string, code: string) => sha256(`${userId}:${code}`)

// ─── Email verification ──────────────────────────────────────────────────────

/** Emails a 6-digit code. Any earlier code stops working. */
export async function sendVerificationCode(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { email: true, emailVerifiedAt: true },
  })
  if (user.emailVerifiedAt) {
    throw HttpError.conflict("Your email is already verified")
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0")
  await prisma.$transaction([
    prisma.verificationToken.updateMany({
      where: { userId, type: "EMAIL_VERIFY", usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.verificationToken.create({
      data: {
        userId,
        type: "EMAIL_VERIFY",
        tokenHash: codeHash(userId, code),
        expiresAt: new Date(Date.now() + EMAIL_CODE_TTL_MS),
      },
    }),
  ])

  await sendEmail({
    to: user.email,
    subject: `${code} is your Hanux CRM verification code`,
    text: [
      `Your verification code is ${code}.`,
      "",
      "It expires in 10 minutes. If you didn't ask for it, you can ignore this email.",
    ].join("\n"),
  })
}

/** Checks the latest code: 10 minutes, 5 attempts. */
export async function verifyEmailCode(
  userId: string,
  code: string
): Promise<void> {
  const token = await prisma.verificationToken.findFirst({
    where: {
      userId,
      type: "EMAIL_VERIFY",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })
  if (!token || token.attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
    throw new HttpError(
      400,
      "CODE_INVALID",
      "This code has expired or had too many attempts. Request a new one."
    )
  }

  if (token.tokenHash !== codeHash(userId, code)) {
    const attempts = token.attempts + 1
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { attempts },
    })
    const left = EMAIL_CODE_MAX_ATTEMPTS - attempts
    throw new HttpError(
      400,
      "CODE_INVALID",
      left > 0
        ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.`
        : "That code isn't right. Request a new one."
    )
  }

  await prisma.$transaction([
    prisma.verificationToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ])
}

// ─── Password reset ──────────────────────────────────────────────────────────

/**
 * Emails a reset link if the address has an active account. Returns the
 * user id (for the audit log) but callers always answer the same way, so the
 * response doesn't reveal which emails have accounts.
 */
export async function requestPasswordReset(
  email: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true },
  })
  if (!user || user.status !== "ACTIVE") return null

  const token = generateToken()
  await prisma.$transaction([
    prisma.verificationToken.updateMany({
      where: { userId: user.id, type: "PASSWORD_RESET", usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    }),
  ])

  await sendEmail({
    to: email,
    subject: "Reset your Hanux CRM password",
    text: [
      "Someone asked to reset the password for your Hanux CRM account.",
      "",
      `Choose a new password: ${env.APP_URL}/auth/reset-password/${token}`,
      "",
      "The link works once and expires in 30 minutes. If it wasn't you, ignore this email: your password stays the same.",
    ].join("\n"),
  })
  return user.id
}

/**
 * Sets a new password from a reset link and signs the user out everywhere.
 * Also unlocks the account and verifies the email (they used the emailed link).
 * Returns the user id.
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<string> {
  const record = await prisma.verificationToken.findFirst({
    where: {
      tokenHash: sha256(token),
      type: "PASSWORD_RESET",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  })
  if (!record) {
    throw new HttpError(
      400,
      "TOKEN_INVALID",
      "This reset link is invalid or has expired. Request a new one."
    )
  }

  const passwordHash = await hashPassword(password)
  await prisma.$transaction(async (tx) => {
    // Claim the link first, so it can't be used twice.
    const claimed = await tx.verificationToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    })
    if (claimed.count === 0) {
      throw new HttpError(
        400,
        "TOKEN_INVALID",
        "This reset link was already used."
      )
    }
    const user = await tx.user.findUniqueOrThrow({
      where: { id: record.userId },
      select: { emailVerifiedAt: true },
    })
    await tx.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    })
    await tx.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "PASSWORD_RESET" },
    })
  })
  return record.userId
}

// ─── Signed-in account ───────────────────────────────────────────────────────

/** Changes the password; every other device is signed out. */
export async function changePassword(
  auth: AuthContext,
  currentPassword: string,
  password: string
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: auth.userId },
    select: { passwordHash: true },
  })
  if (!(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new HttpError(
      400,
      "INVALID_PASSWORD",
      "Your current password isn't right"
    )
  }
  if (currentPassword === password) {
    throw HttpError.badRequest("Choose a password you haven't used here")
  }

  const passwordHash = await hashPassword(password)
  await prisma.$transaction([
    prisma.user.update({ where: { id: auth.userId }, data: { passwordHash } }),
    prisma.session.updateMany({
      where: {
        userId: auth.userId,
        revokedAt: null,
        id: { not: auth.sessionId },
      },
      data: { revokedAt: new Date(), revokedReason: "PASSWORD_CHANGED" },
    }),
  ])
}

export async function listSessions(auth: AuthContext) {
  const sessions = await prisma.session.findMany({
    where: {
      userId: auth.userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { lastUsedAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      ip: true,
      createdAt: true,
      lastUsedAt: true,
    },
  })
  return sessions.map((s) => ({ ...s, current: s.id === auth.sessionId }))
}

/** Signs out one of your other devices. Use sign out for this one. */
export async function revokeOwnSession(auth: AuthContext, sessionId: string) {
  if (sessionId === auth.sessionId) {
    throw HttpError.badRequest("Use sign out to end this session")
  }
  const { count } = await prisma.session.updateMany({
    where: { id: sessionId, userId: auth.userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: "REVOKED_BY_USER" },
  })
  if (count === 0) throw HttpError.notFound("Session not found")
}

export async function revokeOtherSessions(auth: AuthContext): Promise<number> {
  const { count } = await prisma.session.updateMany({
    where: {
      userId: auth.userId,
      revokedAt: null,
      id: { not: auth.sessionId },
    },
    data: { revokedAt: new Date(), revokedReason: "REVOKED_BY_USER" },
  })
  return count
}

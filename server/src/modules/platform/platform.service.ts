import { generateToken } from "@/lib/crypto.js"
import { hashPassword } from "@/lib/password.js"
import { prisma } from "@/lib/prisma.js"
import { requestPasswordReset } from "@/modules/identity/account/account.service.js"

/**
 * Makes someone a Platform Admin (Hanux staff). Creates the account if it
 * doesn't exist yet, with an unusable password, and emails a link to set one.
 * Only callable from the server (src/scripts/platform-admin.ts), never the API.
 */
export async function grantPlatformAdmin(
  email: string,
  name?: string
): Promise<{ created: boolean }> {
  const normalized = email.trim().toLowerCase()
  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  })
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { isPlatformAdmin: true },
    })
    return { created: false }
  }

  await prisma.user.create({
    data: {
      email: normalized,
      name: name?.trim() || normalized.split("@")[0] || "Platform Admin",
      // Nobody knows this password; they set their own from the emailed link.
      passwordHash: await hashPassword(generateToken()),
      isPlatformAdmin: true,
    },
  })
  await requestPasswordReset(normalized)
  return { created: true }
}

/** Removes Platform Admin. Their platform sessions end on their next request. */
export async function revokePlatformAdmin(email: string): Promise<boolean> {
  const { count } = await prisma.user.updateMany({
    where: { email: email.trim().toLowerCase(), isPlatformAdmin: true },
    data: { isPlatformAdmin: false },
  })
  return count > 0
}

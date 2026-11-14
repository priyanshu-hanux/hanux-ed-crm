import type { Role } from "@/generated/prisma/client.js"

/** Broadest first. Used to pick the default assignment on sign-in. */
export const ROLE_ORDER: readonly Role[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "EXECUTIVE",
]

export function pickBroadest<T extends { role: Role }>(
  assignments: readonly T[]
): T | undefined {
  return [...assignments].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role)
  )[0]
}

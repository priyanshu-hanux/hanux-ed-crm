import type { RequestHandler } from "express"
import { prisma } from "@/lib/prisma.js"
import { getAuth } from "@/middleware/authenticate.js"
import type {
  Grant,
  Permission,
  Scope,
} from "@/modules/identity/permissions/catalog.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"
import { HttpError } from "@/utils/http-error.js"

/** The active role's grant for a permission, or undefined if not allowed. */
export function grantOf(
  auth: AuthContext,
  permission: Permission
): Grant | undefined {
  return auth.permissions[permission]
}

export function can(auth: AuthContext, permission: Permission): boolean {
  return grantOf(auth, permission) !== undefined
}

/** 403 unless the active role has every listed permission. */
export const requirePermission =
  (...permissions: Permission[]): RequestHandler =>
  (req, _res, next) => {
    const auth = getAuth(req)
    if (!permissions.every((permission) => can(auth, permission))) {
      throw HttpError.forbidden()
    }
    next()
  }

/**
 * Filter for records that carry `orgId`, `branchId` and `ownerId`
 * (an owner Membership id). Merge it into a Prisma `where`:
 *
 *   const where = { ...(await scopeWhere(auth, "leads:read")), status: "OPEN" }
 *
 * - own:    ownerId = me
 * - team:   ownerId = me or a member of a team I manage (any branch)
 * - branch: branchId = my active assignment's branch
 * - org:    the whole organization
 * Every filter includes orgId.
 */
export async function scopeWhere(
  auth: AuthContext,
  permission: Permission
): Promise<ScopeWhere> {
  const grant = grantOf(auth, permission)
  if (grant === undefined) throw HttpError.forbidden()

  const scope: Scope = grant === true ? "org" : grant
  switch (scope) {
    case "org":
      return { orgId: auth.orgId }
    case "branch":
      if (!auth.branchId) throw HttpError.forbidden()
      return { orgId: auth.orgId, branchId: auth.branchId }
    case "team":
      return {
        orgId: auth.orgId,
        ownerId: { in: await visibleTeamMemberIds(auth) },
      }
    case "own":
      return { orgId: auth.orgId, ownerId: { in: [auth.membershipId] } }
  }
}

export type ScopeWhere =
  | { orgId: string }
  | { orgId: string; branchId: string }
  | { orgId: string; ownerId: { in: string[] } }

/** Me plus every member of the teams I manage, from any branch. */
export async function visibleTeamMemberIds(
  auth: AuthContext
): Promise<string[]> {
  const members = await prisma.membership.findMany({
    where: { orgId: auth.orgId, team: { managerId: auth.membershipId } },
    select: { id: true },
  })
  return [auth.membershipId, ...members.map((member) => member.id)]
}

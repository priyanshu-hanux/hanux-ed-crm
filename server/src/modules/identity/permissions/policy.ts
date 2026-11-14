import type { Role } from "@/generated/prisma/client.js"
import type { AuthContext } from "@/modules/identity/sessions/auth-context.js"

/**
 * Rules for managing people (docs/identity.md, "Rules for managing people").
 * Route-level permissions (requirePermission) say *whether* a role can manage
 * people at all; these functions say *which* people and roles.
 */

/**
 * Whether the active role may grant `role` for `branchId` (null = org-wide,
 * Super Admin only). No one grants more than they have.
 */
export function canAssignRole(
  auth: AuthContext,
  role: Role,
  branchId: string | null
): boolean {
  switch (auth.role) {
    case "SUPER_ADMIN":
      return true
    case "ADMIN":
      return (
        (role === "MANAGER" || role === "EXECUTIVE") &&
        branchId !== null &&
        branchId === auth.branchId
      )
    case "MANAGER":
      return role === "EXECUTIVE" && branchId === auth.branchId
    case "EXECUTIVE":
      return false
  }
}

export interface ManagedMember {
  id: string
  homeBranchId: string
  isOwner: boolean
  roles: { role: Role; branchId: string | null }[]
}

/**
 * Whether the active role may change another member's roles, status or
 * sessions. Super Admins: anyone in the org. Branch Admins: members whose
 * home branch is theirs, except Admins and Super Admins. Never yourself
 * (callers allow specific self-service actions explicitly).
 */
export function canManageMember(
  auth: AuthContext,
  target: ManagedMember
): boolean {
  if (target.id === auth.membershipId) return false
  switch (auth.role) {
    case "SUPER_ADMIN":
      return true
    case "ADMIN":
      return (
        target.homeBranchId === auth.branchId &&
        !target.roles.some(
          (r) => r.role === "ADMIN" || r.role === "SUPER_ADMIN"
        )
      )
    default:
      return false
  }
}

/** Teams are managed by the Admin of their home branch, or a Super Admin. */
export function canManageTeam(
  auth: AuthContext,
  team: { homeBranchId: string }
): boolean {
  if (auth.role === "SUPER_ADMIN") return true
  return auth.role === "ADMIN" && team.homeBranchId === auth.branchId
}

/** Who may see, resend or revoke an invite. */
export function canManageInvite(
  auth: AuthContext,
  invite: { branchId: string; invitedById: string | null }
): boolean {
  switch (auth.role) {
    case "SUPER_ADMIN":
      return true
    case "ADMIN":
      return invite.branchId === auth.branchId
    case "MANAGER":
      return invite.invitedById === auth.membershipId
    case "EXECUTIVE":
      return false
  }
}

import type { Member } from "@/types/identity";
import type { OrgRole, RoleAssignment } from "@/types/session";
import { ROLE_LABELS } from "@/types/session";

/**
 * Client copy of the server's people-management rules
 * (server/src/modules/identity/permissions/policy.ts), used only to decide
 * which buttons to show. The server checks every request.
 */

/** Roles the active role may grant, and for which branch (null = any branch). */
export function grantableRoles(active: RoleAssignment | null): { role: OrgRole; branchId: string | null }[] {
    switch (active?.role) {
        case "SUPER_ADMIN":
            return (["SUPER_ADMIN", "ADMIN", "MANAGER", "EXECUTIVE"] as const).map((role) => ({ role, branchId: null }));
        case "ADMIN":
            return (["MANAGER", "EXECUTIVE"] as const).map((role) => ({ role, branchId: active.branch?.id ?? null }));
        case "MANAGER":
            return [{ role: "EXECUTIVE", branchId: active.branch?.id ?? null }];
        default:
            return [];
    }
}

export function canManageMember(active: RoleAssignment | null, myMembershipId: string | undefined, member: Member) {
    if (!active || member.id === myMembershipId) return false;
    if (active.role === "SUPER_ADMIN") return true;
    return (
        active.role === "ADMIN" &&
        member.homeBranch.id === active.branch?.id &&
        !member.roles.some((r) => r.role === "ADMIN" || r.role === "SUPER_ADMIN")
    );
}

export function canAssign(active: RoleAssignment | null, role: OrgRole, branchId: string | null) {
    return grantableRoles(active).some((g) => g.role === role && (g.branchId === null || g.branchId === branchId));
}

/** "Admin · Mumbai", or just "Admin" with one branch or for Super Admin. */
export function roleLabel(role: OrgRole, branch: { name: string } | null, branchCount: number) {
    return branch && branchCount > 1 ? `${ROLE_LABELS[role]} · ${branch.name}` : ROLE_LABELS[role];
}

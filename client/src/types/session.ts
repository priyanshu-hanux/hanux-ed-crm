import type { PermissionMap } from "@/types/permissions";

/** Org roles. Keep in sync with the server's Role enum. */
export type OrgRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EXECUTIVE";

export const ROLE_LABELS: Record<OrgRole, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    MANAGER: "Manager",
    EXECUTIVE: "Executive",
};

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    emailVerifiedAt: string | null;
    isPlatformAdmin: boolean;
}

export interface SessionOrganization {
    id: string;
    name: string;
    slug: string;
    timezone: string;
}

export interface SessionBranch {
    id: string;
    name: string;
    code: string | null;
    timezone: string;
    isDefault: boolean;
}

export interface RoleAssignment {
    id: string;
    role: OrgRole;
    /** null for Super Admin (org-wide). */
    branch: { id: string; name: string } | null;
}

/** Response of GET /v1/auth/session. */
export interface SessionInfo {
    /** "org": working in an org role. "platform": working as Platform Admin (Hanux staff). */
    mode: "org" | "platform";
    user: SessionUser;
    /** null for Platform Admins without an organization. */
    organization: SessionOrganization | null;
    branches: SessionBranch[];
    membership: {
        id: string;
        isOwner: boolean;
        homeBranchId: string;
        teamId: string | null;
    } | null;
    assignments: RoleAssignment[];
    /** null in platform mode. */
    activeAssignmentId: string | null;
    /** What the active role may do. */
    permissions: PermissionMap;
    authzVersion: number;
}

export interface SignupInput {
    orgName: string;
    name: string;
    email: string;
    password: string;
    timezone?: string;
}

/** "Admin · Mumbai", or just "Admin" while the org has one branch. */
export function assignmentLabel(assignment: RoleAssignment, branchCount: number): string {
    const role = ROLE_LABELS[assignment.role];
    return assignment.branch && branchCount > 1 ? `${role} · ${assignment.branch.name}` : role;
}

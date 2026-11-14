import type { OrgRole } from "@/types/session";

/** Shapes returned by the identity endpoints (server/src/modules/identity). */

export interface NamedRef {
    id: string;
    name: string;
}

export interface MemberRole {
    id: string;
    role: OrgRole;
    /** null for Super Admin (org-wide). */
    branch: NamedRef | null;
}

export interface Member {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    status: "ACTIVE" | "DEACTIVATED";
    isOwner: boolean;
    joinedAt: string;
    lastLoginAt: string | null;
    homeBranch: NamedRef;
    team: NamedRef | null;
    roles: MemberRole[];
}

export type InviteStatus = "PENDING" | "EXPIRED" | "ACCEPTED" | "REVOKED";

export interface Invite {
    id: string;
    email: string;
    role: OrgRole;
    status: InviteStatus;
    branch: NamedRef;
    team: NamedRef | null;
    invitedBy: NamedRef | null;
    expiresAt: string;
    createdAt: string;
}

export interface InviteInput {
    email: string;
    role: OrgRole;
    branchId?: string | null;
    teamId?: string | null;
}

export interface BulkInviteResult {
    sent: number;
    failed: number;
    results: { row: number; email: string; ok: boolean; error?: string }[];
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    homeBranch: NamedRef;
}

export interface Team {
    id: string;
    name: string;
    createdAt: string;
    homeBranch: NamedRef;
    manager: { id: string; name: string; email: string } | null;
    members: TeamMember[];
}

export interface Branch {
    id: string;
    name: string;
    code: string | null;
    timezone: string;
    address: string | null;
    isDefault: boolean;
    status: "ACTIVE" | "ARCHIVED";
    memberCount: number;
    teamCount: number;
}

export interface BranchInput {
    name: string;
    code?: string | null;
    timezone: string;
    address?: string | null;
}

/** Public view of an invitation link (GET /v1/auth/invites/:token). */
export interface InvitePreview {
    email: string;
    role: OrgRole;
    organization: { name: string };
    branch: { name: string };
    team: { name: string } | null;
    invitedBy: { name: string } | null;
    expiresAt: string;
    accountExists: boolean;
}

import { createApi } from "@/apis/api-client";
import { identityUrl } from "@/apis/server-api";
import type {
    Branch,
    BranchInput,
    BulkInviteResult,
    Invite,
    InviteInput,
    InvitePreview,
    Member,
    Team,
} from "@/types/identity";
import type { OrgRole } from "@/types/session";

const api = createApi(identityUrl);

const data = <T>(promise: Promise<{ data: { data: T } }>) => promise.then((res) => res.data.data);

// ─── Members ─────────────────────────────────────────────────────────────────

export const listMembers = (params: { status?: "ACTIVE" | "DEACTIVATED" | "ALL" } = {}) =>
    data<Member[]>(api.get("/v1/members", { params: { limit: 500, ...params } }));

export const addMemberRole = (id: string, role: OrgRole, branchId: string | null) =>
    data<Member>(api.post(`/v1/members/${id}/roles`, { role, branchId }));

export const removeMemberRole = (id: string, assignmentId: string) =>
    data<Member>(api.delete(`/v1/members/${id}/roles/${assignmentId}`));

export const deactivateMember = (id: string) => data<Member>(api.post(`/v1/members/${id}/deactivate`));

export const reactivateMember = (id: string) => data<Member>(api.post(`/v1/members/${id}/reactivate`));

export const revokeMemberSessions = (id: string) =>
    data<{ revoked: number }>(api.post(`/v1/members/${id}/revoke-sessions`));

// ─── Invites ─────────────────────────────────────────────────────────────────

export const listInvites = () => data<Invite[]>(api.get("/v1/invites"));

export const createInvite = (input: InviteInput) => data<Invite>(api.post("/v1/invites", input));

export const bulkInvite = (invites: InviteInput[]) =>
    data<BulkInviteResult>(api.post("/v1/invites/bulk", { invites }));

export const resendInvite = (id: string) => data<Invite>(api.post(`/v1/invites/${id}/resend`));

export const revokeInvite = (id: string) => data<null>(api.delete(`/v1/invites/${id}`));

/** Public: what an invitation link is for. */
export const getInvitePreview = (token: string) => data<InvitePreview>(api.get(`/v1/auth/invites/${token}`));

/** Public: creates the account and signs in (sets the session cookie). */
export const acceptInvite = (token: string, input: { name: string; password: string }) =>
    data<null>(api.post(`/v1/auth/invites/${token}/accept`, input));

// ─── Teams ───────────────────────────────────────────────────────────────────

export const listTeams = () => data<Team[]>(api.get("/v1/teams"));

export const createTeam = (input: { name: string; homeBranchId: string; managerId?: string | null }) =>
    data<Team>(api.post("/v1/teams", input));

export const updateTeam = (id: string, input: { name?: string; managerId?: string | null }) =>
    data<Team>(api.patch(`/v1/teams/${id}`, input));

export const deleteTeam = (id: string) => data<null>(api.delete(`/v1/teams/${id}`));

export const setTeamMembers = (id: string, membershipIds: string[]) =>
    data<Team>(api.put(`/v1/teams/${id}/members`, { membershipIds }));

// ─── Branches ────────────────────────────────────────────────────────────────

export const listBranches = () => data<Branch[]>(api.get("/v1/branches"));

export const createBranch = (input: BranchInput) => data<Branch>(api.post("/v1/branches", input));

export const updateBranch = (id: string, input: Partial<BranchInput>) =>
    data<Branch>(api.patch(`/v1/branches/${id}`, input));

export const archiveBranch = (id: string) => data<null>(api.post(`/v1/branches/${id}/archive`));

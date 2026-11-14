import { createApi } from "@/apis/api-client";
import { identityUrl } from "@/apis/server-api";

const api = createApi(identityUrl);

const data = <T>(promise: Promise<{ data: { data: T } }>) => promise.then((res) => res.data.data);

export interface Profile {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface DeviceSession {
    id: string;
    userAgent: string | null;
    ip: string | null;
    createdAt: string;
    lastUsedAt: string;
    current: boolean;
}

export interface AuditEntry {
    id: string;
    action: string;
    actorId: string | null;
    actorName: string | null;
    branchId: string | null;
    targetType: string | null;
    targetId: string | null;
    metadata: Record<string, unknown> | null;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
}

// ─── Email verification ──────────────────────────────────────────────────────

export const sendVerificationCode = () => data<null>(api.post("/v1/auth/email/send-code"));

export const verifyEmail = (code: string) => data<null>(api.post("/v1/auth/email/verify", { code }));

// ─── Password reset (public) ─────────────────────────────────────────────────

export const forgotPassword = (email: string) => data<null>(api.post("/v1/auth/password/forgot", { email }));

export const resetPassword = (token: string, password: string) =>
    data<null>(api.post("/v1/auth/password/reset", { token, password }));

// ─── Signed-in account ───────────────────────────────────────────────────────

export const updateProfile = (input: { name?: string; avatarUrl?: string | null }) =>
    data<Profile>(api.patch("/v1/me", input));

export const changePassword = (currentPassword: string, newPassword: string) =>
    data<null>(api.post("/v1/me/password", { currentPassword, newPassword }));

export const listSessions = () => data<DeviceSession[]>(api.get("/v1/me/sessions"));

export const revokeSession = (id: string) => data<null>(api.delete(`/v1/me/sessions/${id}`));

export const revokeOtherSessions = () => data<{ revoked: number }>(api.post("/v1/me/sessions/revoke-others"));

// ─── Audit log ───────────────────────────────────────────────────────────────

export const listAuditLog = (params: { page?: number; limit?: number; action?: string } = {}) =>
    api
        .get<{ data: AuditEntry[]; pagination: { total: number; page: number; totalPages: number } }>("/v1/audit-log", {
            params: { limit: 50, ...params },
        })
        .then((res) => res.data);

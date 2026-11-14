import { createApi } from "@/apis/api-client";
import { platformUrl } from "@/apis/server-api";

const api = createApi(platformUrl);

export interface PlatformStats {
    organizations: number;
    suspended: number;
    users: number;
    /** Sessions used in the last 24 hours. */
    activeSessions: number;
}

export interface PlatformOrganization {
    id: string;
    name: string;
    slug: string;
    status: "ACTIVE" | "SUSPENDED";
    timezone: string;
    createdAt: string;
    suspendedAt: string | null;
    suspendedReason: string | null;
    memberCount: number;
    branchCount: number;
    owner: { name: string; email: string } | null;
    lastActivityAt: string | null;
}

export interface PlatformAuditEntry {
    id: string;
    action: string;
    actorName: string | null;
    metadata: Record<string, unknown> | null;
    ip: string | null;
    createdAt: string;
    organization: { id: string; name: string } | null;
}

interface Page<T> {
    data: T[];
    pagination: { total: number; page: number; totalPages: number };
}

export const getStats = () => api.get<{ data: PlatformStats }>("/v1/platform/stats").then((r) => r.data.data);

export const listOrganizations = (params: { search?: string; status?: "ACTIVE" | "SUSPENDED" } = {}) =>
    api
        .get<Page<PlatformOrganization>>("/v1/platform/organizations", { params: { limit: 500, ...params } })
        .then((r) => r.data);

export const suspendOrganization = (id: string, reason: string) =>
    api.post(`/v1/platform/organizations/${id}/suspend`, { reason });

export const restoreOrganization = (id: string) => api.post(`/v1/platform/organizations/${id}/restore`);

/** Optionally only one admin's actions. */
export const listPlatformActivity = (page = 1, actorId?: string) =>
    api
        .get<Page<PlatformAuditEntry>>("/v1/platform/audit-log", { params: { page, limit: 50, actorId } })
        .then((r) => r.data);

export interface PlatformAdmin {
    id: string;
    name: string;
    email: string;
    status: "ACTIVE" | "DISABLED";
    emailVerifiedAt: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    /** Their own organization, if they also belong to one. */
    organization: { id: string; name: string } | null;
    lastActionAt: string | null;
    actionCount: number;
    isYou: boolean;
}

/** Everyone with Platform Admin access (read-only; granting is a server script). */
export const listPlatformAdmins = () =>
    api.get<{ data: PlatformAdmin[] }>("/v1/platform/admins").then((r) => r.data.data);

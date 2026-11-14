import type { Role } from "@/generated/prisma/client.js"

/** How far a scoped permission reaches. Broadest last. */
export const SCOPES = ["own", "team", "branch", "org"] as const
export type Scope = (typeof SCOPES)[number]

/**
 * Every permission. Keep in sync with client/src/types/permissions.ts.
 * Each CRM module adds its own entries when it's built.
 */
export const PERMISSIONS = [
  "leads:read",
  "leads:create",
  "leads:update",
  "leads:assign",
  "leads:delete",
  "reports:read",
  "members:read",
  "members:invite",
  "members:manage",
  "teams:manage",
  "branches:update",
  "branches:manage",
  "org:manage",
  "audit:read",
] as const
export type Permission = (typeof PERMISSIONS)[number]

/** `true` = allowed without a scope; a Scope = allowed within that scope. */
export type Grant = true | Scope
export type PermissionMap = Partial<Record<Permission, Grant>>

/**
 * Role → permissions. The single source of truth, mirrored in
 * server/docs/identity.md. Who may invite or manage *which* people is
 * refined by the people-management rules (phase 3).
 */
export const ROLE_PERMISSIONS: Record<Role, PermissionMap> = {
  EXECUTIVE: {
    "leads:read": "own",
    "leads:create": true,
    "leads:update": "own",
    "reports:read": "own",
    "members:read": true,
  },
  MANAGER: {
    "leads:read": "team",
    "leads:create": true,
    "leads:update": "team",
    "leads:assign": "team",
    "reports:read": "team",
    "members:read": true,
    "members:invite": "team",
  },
  ADMIN: {
    "leads:read": "branch",
    "leads:create": true,
    "leads:update": "branch",
    "leads:assign": "branch",
    "leads:delete": "branch",
    "reports:read": "branch",
    "members:read": true,
    "members:invite": "branch",
    "members:manage": "branch",
    "teams:manage": "branch",
    "branches:update": "branch",
    "audit:read": "branch",
  },
  SUPER_ADMIN: {
    "leads:read": "org",
    "leads:create": true,
    "leads:update": "org",
    "leads:assign": "org",
    "leads:delete": "org",
    "reports:read": "org",
    "members:read": true,
    "members:invite": "org",
    "members:manage": "org",
    "teams:manage": "org",
    "branches:update": "org",
    "branches:manage": true,
    "org:manage": true,
    "audit:read": "org",
  },
}

export function permissionsFor(role: Role): PermissionMap {
  return ROLE_PERMISSIONS[role]
}

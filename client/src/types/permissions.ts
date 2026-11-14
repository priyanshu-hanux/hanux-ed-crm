/** Mirrors server/src/modules/identity/permissions/catalog.ts. */
export type Scope = "own" | "team" | "branch" | "org";

export type Permission =
    | "leads:read"
    | "leads:create"
    | "leads:update"
    | "leads:assign"
    | "leads:delete"
    | "reports:read"
    | "members:read"
    | "members:invite"
    | "members:manage"
    | "teams:manage"
    | "branches:update"
    | "branches:manage"
    | "org:manage";

/** `true` = allowed without a scope; a Scope = allowed within that scope. */
export type Grant = true | Scope;

export type PermissionMap = Partial<Record<Permission, Grant>>;

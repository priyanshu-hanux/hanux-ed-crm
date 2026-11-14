# Identity module plan

Users, organizations, branches, authentication and permissions for the CRM.

## Decisions

| Topic | Decision |
|---|---|
| Tenancy | Multi-tenant. Every company is an **Organization**; users and all CRM data belong to one. |
| Branches | An organization has one or more **Branches** (offices, centers). Sign-up creates a **"Main"** branch, so every member, team and record always has one. The UI hides branch pickers until a second branch exists. |
| Accounts | Public sign-up creates a new organization, its Main branch, and makes that person its **owner and Super Admin**. Everyone else joins by **email invite** (single or bulk CSV). |
| Roles | **Platform Admin**: Hanux staff, outside any organization. **Org roles**: **Super Admin** (whole org), **Admin** (a branch), **Manager** (their teams), **Executive** (their own work). Custom roles later. |
| Role assignment | Roles are assigned **per branch**, e.g. "Admin · Mumbai", "Manager · Pune". Super Admin is org-wide. A user can hold several assignments and **switches** between them; permissions come from the **active assignment** only. |
| Appointing Admins | Only **Super Admins** create branches and appoint branch Admins (and other Super Admins). |
| Teams | **Can span branches.** A team has a home branch (its manager's) but members can come from any branch, like a Bangalore + New York team reporting to a New York manager. |
| Permissions | Defined in code as `resource:action` with a scope (`own`, `team`, `branch`, `org`), mapped from roles. Checked on the server; sent to the client for showing/hiding UI. |
| Sessions | **Server-side sessions stored in Postgres.** The browser holds only a random token in an **httpOnly cookie**; every request is checked against the database, so removed access ends **immediately**. No JWTs, nothing in `localStorage`. A Redis cache can be added later without changing the design. |

## Concepts: location vs reporting line

Two independent structures, as in most large companies:

- **Branch = location.** Every member has one **home branch** (where they sit). Branch Admins administer the people and records of their branch.
- **Team = reporting line.** A member belongs to at most one team; the team's manager sees their work, wherever they sit.

Example: a team of 2 Bangalore + 3 New York executives, managed from New York.

| Who | Sees the leads of |
|---|---|
| New York manager (Manager · New York) | all 5 team members (team scope) |
| Bangalore Admin (Admin · Bangalore) | the 2 Bangalore members, plus every other record in Bangalore (branch scope) |
| New York Admin (Admin · New York) | the 3 New York members, plus every other record in New York |
| Super Admin | everything in the org |
| Each executive | their own leads |

A record can be visible through several paths (team and branch). That's intended: each scope adds an "or" condition, and every one of them is also limited to the org.

## Data model

```
Organization 1──* Branch
     │
     ├──* Membership *──1 User
     │      │  homeBranch → Branch, team → Team?
     │      ├──* RoleAssignment (role, branch?)
     │      └──* Session (active assignment, session token hash)
     ├──* Team (homeBranch → Branch, manager → Membership)
     ├──* Invite
     └──* AuditLog
User 1──* VerificationToken (email verify code, password reset)
```

**Organization**: `id`, `name`, `slug` (unique), `status` (ACTIVE, SUSPENDED), `timezone`, timestamps.

**Branch**: `id`, `orgId`, `name`, `code?` (short label, e.g. `BLR`), `timezone`, `address?`, `isDefault`, `status` (ACTIVE, ARCHIVED), timestamps. Unique `(orgId, name)`. Exactly one default branch per org. A branch can only be archived once it has no active members or open records.

**User**: global identity, one per email.
`id`, `email` (unique, stored lowercase), `name`, `passwordHash`, `avatarUrl?`, `emailVerifiedAt?`, `isPlatformAdmin`, `status` (ACTIVE, DISABLED), `failedLoginCount`, `lockedUntil?`, `lastLoginAt?`, timestamps.

**Membership**: a user's place in an org.
`id`, `userId`, `orgId`, `homeBranchId`, `teamId?`, `isOwner`, `status` (ACTIVE, DEACTIVATED), `authzVersion`, `joinedAt`. Unique `(userId, orgId)`.
`authzVersion` is incremented in the same transaction as any change to the member's status, role assignments or team. It lets the client tell "your permissions changed" apart from other errors, and is the version the Redis cache will use later.

**RoleAssignment**: what a member may do, and where.
`id`, `membershipId`, `role` (SUPER_ADMIN, ADMIN, MANAGER, EXECUTIVE), `branchId?`, `createdById`, `createdAt`. Unique `(membershipId, role, branchId)`.
`branchId` is empty for SUPER_ADMIN and required for every other role (a database check constraint enforces this). A member always has at least one assignment.

**Team**: `id`, `orgId`, `homeBranchId`, `name`, `managerId?` (Membership), timestamps. The manager must hold a MANAGER assignment in the team's home branch.

**Session**: one per signed-in device.
`id`, `tokenHash` (unique), `userId`, `membershipId`, `orgId`, `activeAssignmentId`, `userAgent`, `ip`, `createdAt`, `lastUsedAt`, `expiresAt` (absolute limit), `revokedAt?`, `revokedReason?` (SIGNED_OUT, REVOKED_BY_USER, REVOKED_BY_ADMIN, PASSWORD_CHANGED, MEMBER_DEACTIVATED, ...).

**Invite**: `id`, `orgId`, `email`, `role`, `branchId` (for the role, and the new member's home branch), `teamId?`, `invitedById`, `tokenHash`, `expiresAt`, `acceptedAt?`, `revokedAt?`.

**VerificationToken**: `id`, `userId`, `type` (EMAIL_VERIFY, PASSWORD_RESET), `tokenHash`, `attempts`, `expiresAt`, `usedAt?`.

**AuditLog**: `id`, `orgId?`, `branchId?`, `actorId?`, `action` (e.g. `auth.login`, `member.role_assigned`), `targetType?`, `targetId?`, `metadata Json`, `ip?`, `createdAt`.

**CRM records** (leads and later modules) carry `orgId`, `branchId` and `ownerId?`. Unassigned leads have a branch but no owner (the branch's pool).

## Authentication

**Passwords**: argon2id (`@node-rs/argon2`, prebuilt binaries, no install script). Minimum 8 characters; matches the client's password-requirements hint.

### Sessions

**Token**: 32 random bytes, sent in one cookie, `session`. The database stores only its SHA-256 hash, so a leaked database copy can't be used to sign in.

**Check on every request**: one query loads the session together with its user, membership, active role assignment and organization, and the request is allowed only if:
- the session isn't revoked and hasn't expired;
- the user is active (a sign-in lockout only blocks new sign-ins, so an attacker guessing passwords can't sign the real user out);
- the membership is active and the organization isn't suspended;
- the active role assignment still exists.

So deactivating a member, removing a role, signing out a device or suspending an organization takes effect on the user's **next request**. (A request already running when the change commits still finishes.)

**Removed active role**: if the assignment a session is using is removed, the session switches to the member's broadest remaining assignment and the response says so; if none is left, the member is deactivated and their sessions are revoked.

**Expiry**: 7 days of inactivity, and 30 days at most regardless of activity. `lastUsedAt` is written at most once every 5 minutes, so normal requests don't each cause a database write.

**New token issued** on sign-in, role switch and password change; the old token stops working (protects against session fixation). Changing or resetting the password revokes every other session.

**Errors the client handles** (all `{ success: false, code, message }`):
| Status, code | Meaning | Client does |
|---|---|---|
| `401 UNAUTHENTICATED` | No or unknown session cookie | Go to sign-in |
| `401 SESSION_EXPIRED` | Expired after inactivity or the 30-day limit | Go to sign-in, "please sign in again" |
| `401 SESSION_REVOKED` | Signed out elsewhere, deactivated, password changed, org suspended | Go to sign-in with the reason |
| `403 PERMISSIONS_CHANGED` | Active role was removed or switched | Reload `GET /auth/session`, show a toast |
| `403 FORBIDDEN` | The active role doesn't allow this action | Show "not allowed" |

Every response for a signed-in user includes an `X-Authz-Version` header (the membership's `authzVersion`). If it differs from the one the client loaded, the client reloads the session in the background, so menus update as soon as an admin changes someone's roles.

**Cookies**: `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Domain` from `COOKIE_DOMAIN` (e.g. `.yourdomain.com`, so `app.` and `api.` share them).

**CSRF**: SameSite=Lax plus the CORS allowlist covers other sites. Since sibling subdomains count as the same site, state-changing requests must also be `Content-Type: application/json` (which a plain HTML form can't send).

**Brute force**: rate limit `login`, `signup`, `forgot-password` and code verification per IP and per email (`express-rate-limit`, in memory for now, Redis later). Lock the account for 15 minutes after 10 failed logins.

**Email verification**: 6-digit code (the client already has an OTP input), 10 minutes, 5 attempts. Unverified users can sign in but can't invite others. **Password reset**: emailed link with a single-use token, 30 minutes; resetting revokes all sessions.

**Email**: `lib/mailer.ts` interface. Dev logs emails to the console; production sends with Resend.

## Permissions

### Data scopes

The active assignment decides the scope of what a user sees and changes:

| Scope | Role | Matches records where |
|---|---|---|
| `own` | Executive | `ownerId = me` |
| `team` | Manager | `ownerId` is me or a member of a team I manage (any branch) |
| `branch` | Admin | `branchId` = the assignment's branch (including unassigned leads) |
| `org` | Super Admin | no extra filter |

Every query is also filtered by `orgId`.

### Permission table

| Permission | Executive | Manager | Admin | Super Admin |
|---|:-:|:-:|:-:|:-:|
| `leads:read` | own | team | branch | org |
| `leads:create` | ✓ | ✓ | ✓ | ✓ |
| `leads:update` | own | team | branch | org |
| `leads:assign` | | team | branch | org |
| `leads:delete` | | | branch | org |
| `reports:read` | own | team | branch | org |
| `members:read` (directory) | ✓ | ✓ | ✓ | ✓ |
| `members:invite` | | Executives, into own team | Managers, Executives, in branch | anyone |
| `members:manage` (roles, team, deactivate) | | | home branch, below Admin | org |
| `teams:manage` | | | home branch | org |
| `branches:update` | | | own branch | org |
| `branches:manage` (create, archive) | | | | ✓ |
| `org:manage` (settings, integrations, billing) | | | | ✓ |

The table covers identity plus a first guess at leads/reports; each CRM module adds its own rows when it's built.

### Rules for managing people

- **No one grants more than they have.** Admins assign Manager/Executive in their branch; only Super Admins assign Admin or Super Admin.
- **Branch Admins** manage members whose home branch is theirs, except Admins and Super Admins.
- **Teams**: the Admin of a team's home branch (or a Super Admin) creates it, sets its manager and adds members from **any** branch. The member's home-branch Admin sees the change in the audit log.
- **Managers** invite Executives into their own team; the new member's home branch is the team's home branch.
- **Owner protection**: the owner always keeps Super Admin and can't be deactivated or removed. An org always keeps at least one Super Admin. Ownership can be transferred to another Super Admin.

### Platform Admin

`isPlatformAdmin` users (Hanux staff) get a "Platform Admin" entry in the role switcher, which opens platform-only routes (`/v1/platform/*`): list organizations, suspend/unsuspend. They don't see an organization's data. Support access to an org (temporary, audited, with the org's consent) is a later feature.

### Code

- `permissions/catalog.ts`: every permission and the role → permission/scope map (`true` = allowed without a scope). The single source of truth; the client mirrors it in `client/src/types/permissions.ts`.
- `permissions/access.ts`:
  - `requirePermission("leads:assign")` middleware: 403 `FORBIDDEN` if the active assignment lacks it.
  - `scopeWhere(auth, "leads:read")` returns the filter for the active scope (`{ orgId }`, `{ orgId, branchId }` or `{ orgId, ownerId: { in } }`); services spread it into their Prisma `where`. Records it applies to need `orgId`, `branchId` and `ownerId` (a Membership id) columns.
  - `can(auth, permission)` and `grantOf(auth, permission)` for checks inside services.
- `canManageMember(auth, target)` and similar helpers implement the rules above (phase 3).
- `req.auth.permissions` holds the active role's map, computed from the catalog on every request.

**Client**: `useAuth().can(permission)` and `grantOf(permission)` for showing UI; nav items carry a `permission` and are filtered by `filterNavigation`; routes are gated with `withPermission("org:manage")` (redirects to `/unauthorized`). These only shape the UI; the server checks every request.

**Switching roles**: `POST /v1/auth/switch-role { assignmentId }` checks the assignment belongs to the member, updates `session.activeAssignmentId`, issues a new session token (the old cookie stops working) and returns the updated session, so the client updates without another request. Default on sign-in: the broadest assignment held (Super Admin, then Admin, Manager, Executive).

## Request context

`authenticate` middleware calls `loadAuthContext(sessionToken)`, the **only** function that reads session and permission data, and sets:

```ts
req.auth = {
  userId, sessionId, orgId, membershipId,
  assignmentId, role, branchId,   // active assignment
  isPlatformAdmin, permissions, authzVersion,
}
```

Today `loadAuthContext` queries Postgres. The Redis cache (see Later) goes inside this function, so nothing else changes when it's added. Team membership for team scope is loaded only by routes that need it.

Services take `auth` as an argument; no query on org data runs without `orgId`.
Later option: Prisma client extension or Postgres row-level security to enforce this automatically.

## API (`/v1`)

**Auth** (`/auth`)
| Method & path | Purpose |
|---|---|
| `POST /auth/signup` | `{ orgName, name, email, password }`: creates org, Main branch, user, owner membership with Super Admin; signs in |
| `POST /auth/login` | `{ email, password }`: sets the session cookie |
| `POST /auth/logout` | Revokes the session, clears the cookie |
| `GET /auth/session` | User, org, branches, assignments, active assignment, permissions with scopes (replaces `verify-token`) |
| `POST /auth/switch-role` | `{ assignmentId }` |
| `POST /auth/email/send-code`, `POST /auth/email/verify` | Email verification |
| `POST /auth/password/forgot`, `POST /auth/password/reset` | Password reset |
| `GET /auth/invites/:token`, `POST /auth/invites/:token/accept` | View invite; accept with `{ name, password }` (or just accept if already a user) |

**Me** (`/me`): `GET`, `PATCH` (name, avatar), `POST /me/password`, `GET /me/sessions`, `DELETE /me/sessions/:id`, `POST /me/sessions/revoke-others`.

Admins can also sign a member out everywhere: `POST /members/:id/revoke-sessions`.

**Members** (`/members`, scoped): `GET` (paginated; filter by branch, role, team, status, search), `GET /:id`, `PATCH /:id` (home branch, team), `POST /:id/roles` (add assignment), `DELETE /:id/roles/:assignmentId`, `POST /:id/deactivate`, `POST /:id/reactivate`.

**Invites** (`/invites`): `GET`, `POST` (single), `POST /bulk` (CSV rows, reports per-row errors), `POST /:id/resend`, `DELETE /:id`.

**Teams** (`/teams`): CRUD; `PUT /:id/members`.

**Branches** (`/branches`): `GET`, `POST` and archive (Super Admin), `PATCH /:id` (Super Admin, or Admin of that branch).

**Organization** (`/organization`): `GET`, `PATCH`, `POST /transfer-ownership`.

**Platform** (`/platform`, Platform Admin only, later): list orgs, suspend/unsuspend.

## Code layout

```
src/
├── modules/identity/
│   ├── auth/          routes, controller, service, schemas, cookies.ts
│   ├── sessions/      session.service.ts (create, rotate, revoke), auth-context.ts (loadAuthContext)
│   ├── me/
│   ├── members/       members + role assignments
│   ├── invites/
│   ├── teams/
│   ├── branches/
│   ├── organizations/
│   ├── permissions/   catalog.ts, access.ts (requirePermission, scopeWhere, can, grantOf)
│   └── audit/         audit.service.ts
├── middleware/authenticate.ts
└── lib/password.ts, crypto.ts (random tokens, sha256), mailer.ts, rate-limit.ts
```

New env vars: `APP_URL` (links in emails), `COOKIE_DOMAIN` (production), `RESEND_API_KEY`, `EMAIL_FROM`.

New packages: `@node-rs/argon2`, `express-rate-limit`, `resend`.

## Client changes

- `apis/auth-api.ts`: new paths; drop the education-app fields (`courses`, `semester`).
- `api-client.ts`: remove the refresh-token queue and `localStorage` token handling. Handle the error codes above (sign-in redirect with reason, session reload on `PERMISSIONS_CHANGED`) and watch `X-Authz-Version`.
- `types/app-types.ts`: replace `User` with the session shape `{ user, organization, branches, assignments, activeAssignment, permissions }`.
- `app-context`: load `GET /auth/session`; add `can(permission)`. Turn `ProtectedRoute` back on, redirect to sign-in.
- Wire `AuthForm` (sign-in, sign-up with organization name, forgot password); add accept-invite and reset-password pages.
- Role switcher lists assignments as "Admin · Mumbai" (just "Admin" while the org has one branch) and calls `switch-role`. Hide nav items the active assignment can't use.
- Build the `/team` page (members, invites, teams, branches) on the existing data table.

## Phases

1. ✅ **Foundation** (done): schema and migration (organizations, branches, users, memberships, role assignments, sessions), password and token helpers, `loadAuthContext` and `authenticate`, signup/login/logout/session, `GET /me`. Client: auth API, sign-in/up wired, protected routes, session error handling.
2. ✅ **Permissions** (done): catalog, `requirePermission`, `scopeWhere`, switch-role, permissions in the session response. Client: role switcher, nav gating.
3. **Members, invites, teams, branches**: management endpoints, people-management rules, email sending. Client: Team page, accept-invite page.
4. **Account security**: email verification, password reset and change, session list/revoke, rate limits, lockout, audit log.
5. **Platform admin** (later): organization management for Hanux staff.

Each phase ends with tests (Vitest + Supertest against a Neon branch) and a working slice in the client.

## Later

- **Multiple organizations per user** with an org switcher (the schema already allows it).
- **Custom roles**: a `Role` table per org with the four built-in roles seeded; `RoleAssignment.role` becomes a reference. Permission checks don't change because they read permissions, not role names.
- **Strict branches**: an org setting that keeps teams inside one branch, for customers whose branches are separate business units.
- **Platform support access**: temporary, audited access to an org for Hanux support.
- **Database-enforced tenancy**: Postgres row-level security on `orgId`.
- **Redis cache for sessions and permissions** (below).

### Redis cache (later)

Add only when response times or database load call for it. Postgres stays the source of truth; Redis only speeds up `loadAuthContext`. If Redis is down, the app reads Postgres and keeps working, just slower.

**Keys**
- `session:<tokenHash>`: session validity, user, membership, active assignment, expiry. Signing out a device clears this key.
- `authz:member:<membershipId>`: status, role assignments, permissions, `authzVersion`. A role, team or status change clears this key, covering every device the member is signed in on.

Every key has a short TTL (60 seconds) as a safety net.

**Reads (cache-aside)**: read Redis; on a miss, read Postgres and store the result.

**Writes**: commit the change in Postgres (incrementing `authzVersion` in the same transaction), **then** invalidate Redis. Never write new values into Redis directly, and never try to update both in one transaction (they're separate systems).

**Two ways the cache could go stale, and the fixes**
1. *Postgres commits but the Redis invalidation fails.* The TTL limits staleness to 60 seconds. To remove even that, write an "invalidate" row to an **outbox table** in the same Postgres transaction; a worker retries the Redis delete until it succeeds.
2. *A slow reader stores old data after a writer invalidated.* The writer replaces the key with a marker holding the new `authzVersion` instead of deleting it. Readers store their result only if its version is newer than what Redis holds (a small Lua script does the compare-and-write in one step), so old data can't overwrite the marker.

**Failure rule**: Redis unreachable → read Postgres. Postgres unreachable → deny the request. Never allow a request because the check couldn't run.

# CRM Notifications — shadcn/ui + Radix + TypeScript

A modular starter for an advanced CRM notification center. It includes:
- A compact notification popover limited to the last 7 days.
- A full `/notifications` page with URL-driven filters and pagination.
- Typed notification events, roles, priorities, and action descriptors.
- Shared provider state so the popover and page stay in sync while the app is mounted.
- Mock data only: replace provider mutations and the data adapter with your authenticated API.

## Important: shadcn/ui now defaults new projects to Base UI

This starter specifically targets the **Radix** shadcn/ui component variant, as requested. The official shadcn docs note that Base UI became the default in July 2026, while Radix remains supported. Initialize a Radix project explicitly.

## Setup

For an existing Next.js App Router + Tailwind project:

```bash
pnpm dlx shadcn@latest add -b radix button badge avatar separator popover tabs scroll-area dropdown-menu input select checkbox
pnpm add lucide-react date-fns
```

If starting a new project, initialize shadcn with Radix:

```bash
pnpm dlx shadcn@latest init -b radix
```

Copy `components/notifications/` into your project. Put `app/notifications/page.tsx` at the matching route. Add the provider in a client wrapper and mount that wrapper once in `app/layout.tsx`, as shown below.

### `app/providers.tsx`

```tsx
"use client";

import { NotificationProvider } from "@/components/notifications/notification-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider currentRole="sales" currentUserId="demo-user">
      {children}
    </NotificationProvider>
  );
}
```

### `app/layout.tsx`

```tsx
import { AppProviders } from "./providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

Mount the bell anywhere in your application shell:

```tsx
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppHeader() {
  return (
    <header className="flex items-center justify-end border-b px-6 py-3">
      <NotificationBell />
    </header>
  );
}
```

## Files

- `types.ts`: discriminated unions and domain types.
- `mock-data.ts`: typed demo notifications with timestamps relative to now.
- `notification-provider.tsx`: shared client state and role-aware filtering.
- `notification-item.tsx`: reusable notification row and actions.
- `notification-bell.tsx`: seven-day popover and unread count.
- `notification-center.tsx`: complete history UI, URL filters, search, pagination.
- `app/notifications/page.tsx`: standalone route.
- `app/providers.example.tsx`: provider wiring example.

## Route query parameters

Example:

`/notifications?tab=all&status=unread&q=acme&page=1`

Supported values:
- `tab`: `all | mentions | tasks | deals | system`
- `status`: `all | unread | read`
- `q`: free-text search
- `page`: positive page number

## Production integration checklist

1. Filter notifications on the server using the authenticated user, tenant, and role/permission scope. The demo provider accepts `currentUserId` and `currentRole`. Client-side role filtering is not an authorization boundary.
2. Replace provider mutations with API calls or server actions; persist `readAt`, `archivedAt`, and snooze state server-side.
3. Emit notifications from domain events/outbox jobs, not directly from UI click handlers.
4. Add pagination/cursor support to the API and return a server-derived unread count.
5. Add idempotency keys, retries, retention rules, and audit records for approval actions.
6. For live updates, subscribe through SSE/WebSockets and invalidate/refetch the notification query.
7. Validate action permissions server-side even if the UI hides unavailable actions.
8. Use the application's existing toast/error pattern for failed actions.

The included provider uses in-memory state and mock data so the UI can be explored immediately; it is not a backend implementation.

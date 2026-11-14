import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import type { Permission } from "@/types/permissions";

/**
 * A layout route that renders its children only if the active role has
 * `permission`; otherwise it goes to /unauthorized. Must sit inside
 * ProtectedRoute. The server enforces permissions on every request; this only
 * keeps users out of pages they can't use.
 *
 *   { Component: withPermission("org:manage"), children: [...] }
 */
export function withPermission(permission: Permission) {
    function PermissionRoute() {
        const { can } = useAuth();
        if (!can(permission)) return <Navigate to="/unauthorized" replace />;
        return <Outlet />;
    }
    PermissionRoute.displayName = `PermissionRoute(${permission})`;
    return PermissionRoute;
}

import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import type { OrgRole } from "@/types/session";

interface RoleBasedRouteProps {
    allowedRoles: OrgRole[];
}

/**
 * Only for the active role in `allowedRoles`. Must sit inside ProtectedRoute.
 * The server enforces permissions; this only keeps users out of pages they can't use.
 */
export const RoleBasedRoute = ({ allowedRoles }: RoleBasedRouteProps) => {
    const { activeAssignment } = useAuth();

    if (!activeAssignment || !allowedRoles.includes(activeAssignment.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <Outlet />;
};

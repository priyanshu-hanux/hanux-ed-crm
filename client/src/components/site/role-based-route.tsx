import { Navigate, Outlet } from "react-router";
import { useContextAPI } from "@/hooks/use-app-context";
import { LoadingSpinner } from "@/components/site/loading-spinner";

interface RoleBasedRouteProps {
    allowedRoles: string[];
}

export const RoleBasedRoute = ({ allowedRoles }: RoleBasedRouteProps) => {
    const { user, isLoggedIn, appLoading } = useContextAPI();

    if (appLoading) {
        return <LoadingSpinner />;
    }

    if (!isLoggedIn) {
        return <Navigate to="/auth/login" replace />;
    }

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/not-found" replace />;
    }

    return <Outlet />;
};
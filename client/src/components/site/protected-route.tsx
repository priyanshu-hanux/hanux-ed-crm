import { Outlet } from "react-router";
import { useContextAPI } from "@/hooks/use-app-context";
import { LoadingSpinner } from "@/components/site/loading-spinner";

export const ProtectedRoute = () => {
    const { isLoggedIn, appLoading, isLoggingOut } = useContextAPI();

    if (appLoading || isLoggingOut) {
        return <LoadingSpinner />;
    }

    if (isLoggedIn) {
        return <Outlet />;
    }

    return null;
};
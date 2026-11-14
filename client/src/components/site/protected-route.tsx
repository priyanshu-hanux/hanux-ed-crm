import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/site/loading-spinner";

export interface AuthRedirectState {
    /** Where to go after signing in. */
    from?: string;
    /** Why the user was sent to sign in. */
    reason?: string | null;
    /** A success message for the sign-in page, e.g. "Password changed". */
    notice?: string;
    /** Prefills the forgot-password form. */
    email?: string;
}

function FullPageSpinner() {
    return (
        <div className="flex h-screen items-center justify-center">
            <LoadingSpinner />
        </div>
    );
}

/** Pages for signed-in users. Others go to sign-in, then come back. */
export const ProtectedRoute = () => {
    const { status, signedOutReason } = useAuth();
    const location = useLocation();

    if (status === "loading") return <FullPageSpinner />;

    if (status === "unauthenticated") {
        const state: AuthRedirectState = {
            from: location.pathname + location.search,
            reason: signedOutReason,
        };
        return <Navigate to="/auth/sign-in" replace state={state} />;
    }

    return <Outlet />;
};

/** Sign-in and sign-up pages. Signed-in users go to where they were headed. */
export const GuestRoute = () => {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "loading") return <FullPageSpinner />;

    if (status === "authenticated") {
        const from = (location.state as AuthRedirectState | null)?.from;
        return <Navigate to={from?.startsWith("/") && !from.startsWith("/auth") ? from : "/"} replace />;
    }

    return <Outlet />;
};

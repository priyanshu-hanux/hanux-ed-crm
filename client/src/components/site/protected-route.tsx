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

/** Pages open to Platform Admins while working as Platform Admin. */
const PLATFORM_PATHS = ["/platform", "/settings"];
const isPlatformPath = (pathname: string) =>
    PLATFORM_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/**
 * Pages for signed-in users. Others go to sign-in, then come back.
 * Also keeps each mode on its own pages: Platform Admins working as such stay
 * on platform pages, and org roles can't open them.
 */
export const ProtectedRoute = () => {
    const { status, signedOutReason, session } = useAuth();
    const location = useLocation();

    if (status === "loading") return <FullPageSpinner />;

    if (status === "unauthenticated") {
        const state: AuthRedirectState = {
            from: location.pathname + location.search,
            reason: signedOutReason,
        };
        return <Navigate to="/auth/sign-in" replace state={state} />;
    }

    if (session?.mode === "platform" && !isPlatformPath(location.pathname)) {
        return <Navigate to="/platform" replace />;
    }
    if (session?.mode === "org" && location.pathname.startsWith("/platform")) {
        return <Navigate to="/" replace />;
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

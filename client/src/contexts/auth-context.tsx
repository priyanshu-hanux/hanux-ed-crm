import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import * as authApi from "@/apis/auth-api";
import { authEvents } from "@/apis/auth-events";
import type { Grant, Permission } from "@/types/permissions";
import type { RoleAssignment, SessionInfo, SignupInput } from "@/types/session";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
    status: AuthStatus;
    session: SessionInfo | null;
    activeAssignment: RoleAssignment | null;
    /** Why the user was signed out (expired, revoked...), shown on the sign-in page. */
    signedOutReason: string | null;
    /**
     * Whether the active role has a permission. For showing and hiding UI only:
     * the server checks every request.
     */
    can: (permission: Permission) => boolean;
    /** The active role's grant: true, a scope ("own", "team"...), or undefined. */
    grantOf: (permission: Permission) => Grant | undefined;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (input: SignupInput) => Promise<void>;
    signOut: () => Promise<void>;
    switchRole: (assignmentId: string) => Promise<void>;
    refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [session, setSession] = useState<SessionInfo | null>(null);
    const [signedOutReason, setSignedOutReason] = useState<string | null>(null);

    // Latest values for the event listener, without re-subscribing.
    const statusRef = useRef(status);
    const sessionRef = useRef(session);
    useEffect(() => {
        statusRef.current = status;
        sessionRef.current = session;
    }, [status, session]);

    const reloading = useRef<Promise<void> | null>(null);

    const refreshSession = useCallback(() => {
        // Several triggers can fire at once; share one request.
        reloading.current ??= authApi
            .getSession()
            .then((info) => {
                setSession(info);
                setStatus("authenticated");
            })
            .catch(() => {
                // A 401 also arrives as a "signed-out" event, handled below.
                setSession(null);
                setStatus("unauthenticated");
            })
            .finally(() => {
                reloading.current = null;
            });
        return reloading.current;
    }, []);

    useEffect(() => {
        void refreshSession();
    }, [refreshSession]);

    useEffect(
        () =>
            authEvents.subscribe((event) => {
                switch (event.type) {
                    case "signed-out":
                        // Only explain it if they were signed in.
                        if (statusRef.current === "authenticated") {
                            setSignedOutReason(event.message);
                        }
                        setSession(null);
                        setStatus("unauthenticated");
                        break;
                    case "permissions-changed":
                        toast.info(event.message);
                        void refreshSession();
                        break;
                    case "authz-version":
                        if (sessionRef.current && event.version !== sessionRef.current.authzVersion) {
                            void refreshSession();
                        }
                        break;
                }
            }),
        [refreshSession]
    );

    const signIn = useCallback(
        async (email: string, password: string) => {
            await authApi.login(email, password);
            setSignedOutReason(null);
            await refreshSession();
        },
        [refreshSession]
    );

    const signUp = useCallback(
        async (input: SignupInput) => {
            await authApi.signup(input);
            setSignedOutReason(null);
            await refreshSession();
        },
        [refreshSession]
    );

    const signOut = useCallback(async () => {
        try {
            await authApi.logout();
        } finally {
            setSignedOutReason(null);
            setSession(null);
            setStatus("unauthenticated");
        }
    }, []);

    const switchRole = useCallback(async (assignmentId: string) => {
        setSession(await authApi.switchRole(assignmentId));
    }, []);

    const value = useMemo<AuthContextValue>(() => {
        const grantOf = (permission: Permission) => session?.permissions[permission];
        return {
            status,
            session,
            activeAssignment:
                session?.assignments.find((assignment) => assignment.id === session.activeAssignmentId) ?? null,
            signedOutReason,
            can: (permission) => grantOf(permission) !== undefined,
            grantOf,
            signIn,
            signUp,
            signOut,
            switchRole,
            refreshSession,
        };
    }, [status, session, signedOutReason, signIn, signUp, signOut, switchRole, refreshSession]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

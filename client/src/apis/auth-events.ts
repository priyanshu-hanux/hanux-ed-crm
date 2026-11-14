/**
 * Signals from the API layer to the auth provider, so any request anywhere
 * in the app can report "signed out" or "permissions changed".
 */
export type AuthEvent =
    | { type: "signed-out"; code: string; message: string }
    | { type: "permissions-changed"; message: string }
    | { type: "authz-version"; version: number };

type Listener = (event: AuthEvent) => void;

const listeners = new Set<Listener>();

export const authEvents = {
    emit(event: AuthEvent) {
        listeners.forEach((listener) => listener(event));
    },
    subscribe(listener: Listener): () => void {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};

import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/types/app-error";

/** Shared React Query cache. Cleared on sign-out; refetched when the role changes. */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            // Auth and permission errors won't fix themselves on retry.
            retry: (failureCount, error) =>
                failureCount < 2 && !(isApiError(error) && error.status !== undefined && error.status < 500),
        },
    },
});

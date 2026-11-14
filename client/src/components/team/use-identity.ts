import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as identityApi from "@/apis/identity-api";
import { useAuth } from "@/hooks/use-auth";
import { isApiError } from "@/types/app-error";

/** Query keys of the Team page. Any change refetches all of them. */
const KEYS = { members: ["members"], invites: ["invites"], teams: ["teams"], branches: ["branches"] } as const;

export function useMembers() {
    const { can } = useAuth();
    // People who manage members also see deactivated ones.
    const status = can("members:manage") ? "ALL" : "ACTIVE";
    return useQuery({ queryKey: [...KEYS.members, status], queryFn: () => identityApi.listMembers({ status }) });
}

export function useInvites(enabled: boolean) {
    return useQuery({ queryKey: KEYS.invites, queryFn: identityApi.listInvites, enabled });
}

export function useTeams() {
    return useQuery({ queryKey: KEYS.teams, queryFn: identityApi.listTeams });
}

export function useBranches() {
    return useQuery({ queryKey: KEYS.branches, queryFn: identityApi.listBranches });
}

/**
 * A change on the Team page: shows a toast, refetches the page's data, and
 * reports server errors (the server enforces the rules).
 */
export function useIdentityAction<TArgs extends unknown[], TResult>(
    action: (...args: TArgs) => Promise<TResult>,
    success: string | ((result: TResult) => string)
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (args: TArgs) => action(...args),
        onSuccess: (result) => {
            toast.success(typeof success === "function" ? success(result) : success);
            for (const key of Object.values(KEYS)) void queryClient.invalidateQueries({ queryKey: key });
        },
        onError: (error) => {
            toast.error(isApiError(error) ? error.message : "Something went wrong");
        },
    });
}

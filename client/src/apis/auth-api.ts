import { createApi } from "@/apis/api-client";
import { identityUrl } from "@/apis/server-api";
import type { SessionInfo, SignupInput } from "@/types/session";

const authApi = createApi(identityUrl);

/** Creates the organization and its owner, and signs them in. */
export const signup = async (input: SignupInput): Promise<void> => {
    await authApi.post("/v1/auth/signup", input);
};

export const login = async (email: string, password: string): Promise<void> => {
    await authApi.post("/v1/auth/login", { email, password });
};

export const logout = async (): Promise<void> => {
    await authApi.post("/v1/auth/logout");
};

/** Makes another of the user's roles active. Returns the updated session. */
export const switchRole = async (assignmentId: string): Promise<SessionInfo> => {
    const { data } = await authApi.post<{ data: SessionInfo }>("/v1/auth/switch-role", { assignmentId });
    return data.data;
};

/** Everything about the signed-in user. Rejects with 401 when signed out. */
export const getSession = async (): Promise<SessionInfo> => {
    const { data } = await authApi.get<{ data: SessionInfo }>("/v1/auth/session");
    return data.data;
};

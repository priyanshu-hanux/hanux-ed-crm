import axios, { AxiosError, type AxiosInstance } from "axios";
import { authEvents } from "@/apis/auth-events";
import { ApiError, type ApiErrorCode } from "@/types/app-error";

const SIGNED_OUT_CODES = new Set<string>(["UNAUTHENTICATED", "SESSION_EXPIRED", "SESSION_REVOKED"]);

function toApiError(error: unknown): ApiError {
    if (error instanceof AxiosError) {
        if (!error.response) {
            return new ApiError("Can't reach the server. Check your connection and try again.", "NETWORK_ERROR");
        }
        const body = error.response.data as
            | { code?: ApiErrorCode; message?: string; error?: unknown }
            | undefined;
        return new ApiError(
            body?.message ?? error.message,
            body?.code ?? "INTERNAL_ERROR",
            error.response.status,
            body?.error
        );
    }
    if (error instanceof Error) return new ApiError(error.message, "INTERNAL_ERROR");
    return new ApiError("Something went wrong", "INTERNAL_ERROR");
}

/**
 * Axios instance for one API. The session lives in an httpOnly cookie, so
 * requests only need `withCredentials`; there are no tokens to manage here.
 */
export const createApi = (baseURL: string): AxiosInstance => {
    const api = axios.create({
        baseURL,
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
    });

    api.interceptors.response.use(
        (response) => {
            const version = Number(response.headers["x-authz-version"]);
            if (version) authEvents.emit({ type: "authz-version", version });
            return response;
        },
        (error: unknown) => {
            const apiError = toApiError(error);
            if (apiError.status === 401 && SIGNED_OUT_CODES.has(apiError.code)) {
                authEvents.emit({ type: "signed-out", code: apiError.code, message: apiError.message });
            } else if (apiError.code === "PERMISSIONS_CHANGED") {
                authEvents.emit({ type: "permissions-changed", message: apiError.message });
            }
            return Promise.reject(apiError);
        }
    );

    return api;
};

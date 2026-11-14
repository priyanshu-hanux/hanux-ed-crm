/** Error codes sent by the API as `code`. Keep in sync with server/src/utils/http-error.ts. */
export type ApiErrorCode =
    | "BAD_REQUEST"
    | "VALIDATION_ERROR"
    | "UNAUTHENTICATED"
    | "SESSION_EXPIRED"
    | "SESSION_REVOKED"
    | "INVALID_CREDENTIALS"
    | "FORBIDDEN"
    | "PERMISSIONS_CHANGED"
    | "ACCOUNT_DISABLED"
    | "NO_ORGANIZATION"
    | "ORGANIZATION_SUSPENDED"
    | "NOT_FOUND"
    | "CONFLICT"
    | "EMAIL_IN_USE"
    | "ALREADY_MEMBER"
    | "INVITE_INVALID"
    | "EMAIL_FAILED"
    | "EMAIL_NOT_VERIFIED"
    | "CODE_INVALID"
    | "TOKEN_INVALID"
    | "INVALID_PASSWORD"
    | "ACCOUNT_LOCKED"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR"
    | "NETWORK_ERROR";

/** Field errors returned with VALIDATION_ERROR. */
export interface ValidationDetails {
    formErrors: string[];
    fieldErrors: Record<string, string[] | undefined>;
}

/** Every failed API call rejects with this. */
export class ApiError extends Error {
    readonly status?: number;
    readonly code: ApiErrorCode;
    readonly details?: unknown;

    constructor(message: string, code: ApiErrorCode, status?: number, details?: unknown) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.status = status;
        this.details = details;
    }

    /** First message per field, for VALIDATION_ERROR responses. */
    get fieldErrors(): Record<string, string> {
        if (this.code !== "VALIDATION_ERROR") return {};
        const details = this.details as ValidationDetails | undefined;
        const result: Record<string, string> = {};
        for (const [field, messages] of Object.entries(details?.fieldErrors ?? {})) {
            if (messages?.[0]) result[field] = messages[0];
        }
        return result;
    }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

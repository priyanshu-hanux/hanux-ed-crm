/**
 * Machine-readable error codes sent to the client as `code`.
 * Keep in sync with the client's error handling.
 */
export type ErrorCode =
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

/** An error with an HTTP status whose message is safe to show to the client. */
export class HttpError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly details?: unknown

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message = "Bad request", details?: unknown) {
    return new HttpError(400, "BAD_REQUEST", message, details)
  }

  static unauthorized(
    message = "Please sign in to continue",
    code: ErrorCode = "UNAUTHENTICATED"
  ) {
    return new HttpError(401, code, message)
  }

  static forbidden(
    message = "You don't have permission to do this",
    code: ErrorCode = "FORBIDDEN"
  ) {
    return new HttpError(403, code, message)
  }

  static notFound(message = "Not found") {
    return new HttpError(404, "NOT_FOUND", message)
  }

  static conflict(
    message = "Conflict",
    code: ErrorCode = "CONFLICT",
    details?: unknown
  ) {
    return new HttpError(409, code, message, details)
  }
}

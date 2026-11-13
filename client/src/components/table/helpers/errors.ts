/** A readable message for whatever was passed as `error` */
export function describeError(error: unknown): string {
    if (typeof error === "string" && error) return error
    if (error instanceof Error && error.message) return error.message
    return "Something went wrong. Check your connection and try again."
}

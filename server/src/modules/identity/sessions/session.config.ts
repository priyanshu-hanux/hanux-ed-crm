const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

export const SESSION_COOKIE = "session"

/** Signed out after this long without a request. */
export const SESSION_IDLE_TIMEOUT_MS = 7 * DAY

/** Signed out this long after sign-in, however active. */
export const SESSION_MAX_AGE_MS = 30 * DAY

/** lastUsedAt is written at most this often. */
export const SESSION_TOUCH_INTERVAL_MS = 5 * MINUTE

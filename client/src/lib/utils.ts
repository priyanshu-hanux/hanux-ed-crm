export { cn } from "cn"

export function getDashboardPath(role?: string): string {
  switch (role) {
    case "admin":
      return "/admin-dashboard";
    case "faculty":
      return "/faculty-dashboard";
    default:
      return "/faculty-dashboard";
  }
}

/* ---------- Helpers for user-supplied timezones (e.g. candidate data) ---------- */

const validityCache = new Map<string, boolean>()

/**
 * True for a real IANA name like "Asia/Kolkata". Intl throws on typos and on
 * abbreviations like "IST", so check before passing data from an API to the formatters.
 */
export function isValidTimeZone(timeZone: string): boolean {
  let valid = validityCache.get(timeZone)
  if (valid === undefined) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone })
      valid = true
    } catch {
      valid = false
    }
    validityCache.set(timeZone, valid)
  }
  return valid
}

/** UTC offset in minutes (e.g. 330 for GMT+5:30), for sorting zones west → east. */
export function getOffsetMinutes(timeZone: string, date: Date = new Date()): number {
  const label =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT"
  const match = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) return 0
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0))
}
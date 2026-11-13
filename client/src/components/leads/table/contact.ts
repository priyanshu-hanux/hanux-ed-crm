import type { ContactPoint, SocialPlatform, SocialProfile } from "@/types/candidate";

/**
 * Helpers for a candidate's contact fields: emails, phones and social profiles.
 * Used by the candidates table and the details drawer.
 */

/** Placeholder values that mean "nothing here" */
const EMPTY_VALUES = new Set(["", "n/a", "na", "-", "---", "none", "null"]);

/**
 * Cleans a list of emails or phones for display: trims, drops placeholders and duplicates
 * (emails ignoring capitals, phones ignoring spacing), and puts the primary one first.
 * The primary is the first entry marked isPrimary, or else the first entry.
 */
export function cleanContacts(points: readonly ContactPoint[] | null | undefined, kind: "email" | "phone"): ContactPoint[] {
  const seen = new Set<string>();
  const result: ContactPoint[] = [];
  for (const point of points ?? []) {
    const value = point?.value?.trim() ?? "";
    if (EMPTY_VALUES.has(value.toLowerCase())) continue;
    const key = kind === "phone" ? phoneDigits(value) : value.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({ ...point, value });
  }
  const primaryIndex = result.findIndex((point) => point.isPrimary);
  if (primaryIndex > 0) result.unshift(...result.splice(primaryIndex, 1));
  // Exactly one primary from here on: the first
  return result.map((point, index) => ({ ...point, isPrimary: index === 0 }));
}

/** The cleaned values as plain strings, primary first */
export function contactValues(points: readonly ContactPoint[] | null | undefined, kind: "email" | "phone"): string[] {
  return cleanContacts(points, kind).map((point) => point.value);
}

/** The primary value, or undefined */
export function primaryValue(points: readonly ContactPoint[] | null | undefined, kind: "email" | "phone"): string | undefined {
  return cleanContacts(points, kind)[0]?.value;
}

/** "work" → "Work", for the small tag next to a contact */
export const CONTACT_TYPE_LABEL: Record<NonNullable<ContactPoint["type"]>, string> = {
  work: "Work",
  personal: "Personal",
  mobile: "Mobile",
  other: "Other",
};

/** "+91 98765 43210" → "+919876543210" (for copying and tel: links) */
export function phoneDigits(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export const telHref = (phone: string) => `tel:${phoneDigits(phone)}`;
export const mailtoHref = (email: string) => `mailto:${email}`;

/** Which platform a host belongs to, or undefined for any other site */
function platformOfHost(hostname: string): Exclude<SocialPlatform, "portfolio" | "other"> | undefined {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") return "linkedin";
  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") return "x";
  if (host === "github.com") return "github";
  return undefined;
}

/**
 * A profile link that is safe to put in href, always https. "linkedin.com/in/x" without a scheme
 * is accepted. Returns null for anything that isn't a web address ("javascript:…", "not a url").
 */
export function safeProfileUrl(url: string | null | undefined): string | null {
  const value = url?.trim();
  if (!value) return null;
  try {
    const parsed = new URL(/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    // A real host has a dot (or is localhost); this rejects text like "not a url"
    if (!parsed.hostname.includes(".") || /\s|%20/.test(parsed.hostname)) return null;
    parsed.protocol = "https:";
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Cleans social profiles for display: drops unsafe or empty links and duplicates, and trusts
 * the address over the stored platform (a "linkedin" entry pointing at github.com is GitHub).
 * LinkedIn comes first, since recruiters look for it first.
 */
export function cleanSocials(socials: readonly SocialProfile[] | null | undefined): SocialProfile[] {
  const seen = new Set<string>();
  const result: SocialProfile[] = [];
  for (const social of socials ?? []) {
    const url = safeProfileUrl(social?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const known = platformOfHost(new URL(url).hostname);
    const declared = social.platform;
    // Known sites always win; otherwise keep "portfolio" / "other" as given
    const platform: SocialPlatform = known ?? (declared === "portfolio" ? "portfolio" : "other");
    result.push({ platform, url });
  }
  return result.sort((a, b) => Number(b.platform === "linkedin") - Number(a.platform === "linkedin"));
}

export const SOCIAL_PLATFORM_LABEL: Record<SocialPlatform, string> = {
  linkedin: "LinkedIn",
  x: "X",
  github: "GitHub",
  portfolio: "Portfolio",
  other: "Website",
};

/**
 * Short text for a profile link: "in/jane-doe" for LinkedIn, "@jane" for X,
 * "jane" for GitHub, and the host + path for anything else.
 */
export function socialLabel(social: SocialProfile): string {
  try {
    const { hostname, pathname } = new URL(social.url);
    const path = pathname.replace(/\/+$/, "");
    const firstSegment = path.split("/").filter(Boolean)[0];
    if (social.platform === "linkedin" && path) return path.replace(/^\//, "");
    if (social.platform === "x" && firstSegment) return `@${firstSegment}`;
    if (social.platform === "github" && firstSegment) return firstSegment;
    return `${hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return social.url;
  }
}

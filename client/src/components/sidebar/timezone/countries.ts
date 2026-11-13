import { TIMEZONES } from "./timezones";

/**
 * Country for IANA zones that aren't in the TIMEZONES picker list.
 * Zones in TIMEZONES use their own `countryCode`, so only add zones here that aren't listed there.
 */
const EXTRA_ZONE_COUNTRIES: Record<string, string> = {
  "Asia/Calcutta": "IN",
  "Asia/Karachi": "PK",
  "Asia/Dhaka": "BD",
  "Asia/Colombo": "LK",
  "Asia/Kathmandu": "NP",
  "Asia/Shanghai": "CN",
  "Asia/Seoul": "KR",
  "Asia/Manila": "PH",
  "Asia/Jakarta": "ID",
  "Asia/Bangkok": "TH",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Riyadh": "SA",
  "Asia/Qatar": "QA",
  "Asia/Jerusalem": "IL",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Zurich": "CH",
  "Europe/Vienna": "AT",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Copenhagen": "DK",
  "Europe/Helsinki": "FI",
  "Europe/Dublin": "IE",
  "Europe/Lisbon": "PT",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Athens": "GR",
  "Europe/Istanbul": "TR",
  "Europe/Moscow": "RU",
  "Africa/Cairo": "EG",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Pacific/Auckland": "NZ",
  "America/Phoenix": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Vancouver": "CA",
  "America/Mexico_City": "MX",
  "America/Bogota": "CO",
  "America/Lima": "PE",
  "America/Santiago": "CL",
  "America/Argentina/Buenos_Aires": "AR",
};

/** "Asia/Kolkata" → "IN"; undefined for zones we can't place (e.g. "UTC") */
export function getZoneCountryCode(timeZone: string | null | undefined): string | undefined {
  if (!timeZone) return undefined;
  return TIMEZONES.find((tz) => tz.timeZone === timeZone)?.countryCode ?? EXTRA_ZONE_COUNTRIES[timeZone];
}

/** "Asia/Kolkata" → "New Delhi" when it's in TIMEZONES, otherwise the zone's last part ("Kolkata") */
export function getZoneCity(timeZone: string): string {
  return (
    TIMEZONES.find((tz) => tz.timeZone === timeZone)?.city ??
    timeZone.split("/").pop()!.replace(/_/g, " ")
  );
}

let regionNames: Intl.DisplayNames | null | undefined;

/** "IN" → "India" (in English), or the code itself if the browser can't name it */
export function getCountryName(code: string): string {
  if (regionNames === undefined) {
    try {
      regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      regionNames = null;
    }
  }
  return regionNames?.of(code) ?? code;
}

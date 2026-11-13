import {
  AE, AR, AT, AU, BD, BE, BR, CA, CH, CL, CN, CO, CZ, DE, DK, EG, ES, FI, FR, GB, GR, HK, ID, IE, IL, IN,
  IT, JP, KE, KR, LK, MX, MY, NG, NL, NO, NP, NZ, PE, PH, PK, PL, PT, QA, RU, SA, SE, SG, TH, TR, US, VN, ZA,
} from "country-flag-icons/react/3x2";

import { cn } from "@/lib/utils";
import { getCountryName } from "./countries";

/**
 * The flags the app can show. Imported one by one, so only these end up in the bundle.
 * Covers every country in TIMEZONES and in countries.ts; add a flag here when you add a country there.
 */
const FLAGS = {
  AE, AR, AT, AU, BD, BE, BR, CA, CH, CL, CN, CO, CZ, DE, DK, EG, ES, FI, FR, GB, GR, HK, ID, IE, IL, IN,
  IT, JP, KE, KR, LK, MX, MY, NG, NL, NO, NP, NZ, PE, PH, PK, PL, PT, QA, RU, SA, SE, SG, TH, TR, US, VN, ZA,
} as const;

export type FlagCountryCode = keyof typeof FLAGS;

/**
 * A small 3:2 country flag (SVG, works on every OS including Windows).
 * Renders nothing for an unknown code, so callers can show their own fallback.
 */
export function CountryFlag({
  code,
  className,
  decorative = false,
}: {
  /** ISO 3166-1 alpha-2, e.g. "IN" */
  code: string | null | undefined;
  className?: string;
  /** true when the country name is already written next to the flag */
  decorative?: boolean;
}) {
  const upper = code?.toUpperCase();
  const Flag = upper && upper in FLAGS ? FLAGS[upper as FlagCountryCode] : undefined;
  if (!Flag || !upper) return null;

  const name = getCountryName(upper);
  return (
    <Flag
      className={cn("h-3 w-4.5 shrink-0", className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    />
  );
}

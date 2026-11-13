// candidate-timezone-cell.tsx
import { Globe } from "lucide-react";

import { CountryFlag } from "@/components/sidebar/timezone/country-flag";
import { getCountryName, getZoneCity, getZoneCountryCode } from "@/components/sidebar/timezone/countries";
import { StatusDot } from "@/components/sidebar/timezone/status-dot";
import {
  describeRelativeToLocal,
  formatTime,
  getCallWindowStatus,
  getZoneAbbreviation,
} from "@/components/sidebar/timezone/time-utils";
import { useNow } from "@/components/sidebar/timezone/use-now";
import { EmptyCell } from "@/components/table";
import { isValidTimeZone } from "@/lib/utils";

/** Flag of the zone's country, or a globe when it can't be placed (e.g. "UTC") */
function ZoneFlag({ timeZone }: { timeZone: string }) {
  const code = getZoneCountryCode(timeZone);
  return code ? (
    <CountryFlag code={code} />
  ) : (
    <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
  );
}

export function CandidateTimezoneCell({ timeZone }: { timeZone?: string | null }) {
  const now = useNow(); // hooks first, before any early return
  const zone = timeZone?.trim();

  // Missing or not a real zone (the tooltip shows what was given)
  if (!zone || !isValidTimeZone(zone)) return <EmptyCell title={zone || undefined} />;

  // useNow can be null on the first render, same as in the switcher
  if (!now) {
    return <span className="text-[13px] tabular-nums text-muted-foreground">--:--</span>;
  }

  const status = getCallWindowStatus(zone, now);
  const countryCode = getZoneCountryCode(zone);
  const place = countryCode ? `${getZoneCity(zone)}, ${getCountryName(countryCode)}` : getZoneCity(zone);

  return (
    <div className="flex min-w-0 items-center gap-2" title={`${place} · ${status.label} · ${describeRelativeToLocal(zone, now)}`}>
      <ZoneFlag timeZone={zone} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <StatusDot good={status.good} className="size-1.5" />
          <span className="text-[11px] font-medium tabular-nums">{formatTime(zone, now)}</span>
          <span className="sr-only">{status.label}</span>
        </div>
        <div className="truncate text-[10px] text-muted-foreground">
          {getZoneCity(zone)} · {getZoneAbbreviation(zone, now)}
        </div>
      </div>
    </div>
  );
}

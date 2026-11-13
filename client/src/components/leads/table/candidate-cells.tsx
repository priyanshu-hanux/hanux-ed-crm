import { images } from "@/assets";
import { CountryFlag } from "@/components/sidebar/timezone/country-flag";
import { cn } from "@/lib/utils";

/** Avatar, name and (when known) the job title underneath */
export function CandidateNameCell({ name, role }: { name: string; role?: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
        <img src={images.user} alt={name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium" title={name}>
          {name}
        </div>
        {role && (
          <div className="truncate text-[10px] tracking-wide text-muted-foreground" title={role}>
            {role}
          </div>
        )}
      </div>
    </div>
  );
}

/** A company or job title; a past job (between jobs) is muted and marked "Past" */
export function JobText({ text, isCurrent, className }: { text: string; isCurrent: boolean; className?: string }) {
  return (
    <span
      className={cn("flex min-w-0 items-center gap-1.5 text-[13px]", className)}
      title={isCurrent ? text : `${text} (most recent, not current)`}
    >
      <span className={cn("truncate", !isCurrent && "text-muted-foreground")}>{text}</span>
      {!isCurrent && (
        <span className="shrink-0 rounded-full border px-1.5 text-[10px] font-normal text-muted-foreground">Past</span>
      )}
    </span>
  );
}

/** "Jaipur, India" with the country's flag (no flag when the country is unknown) */
export function LocationText({ label, countryCode }: { label: string; countryCode?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-[13px]" title={label}>
      <CountryFlag code={countryCode} decorative />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Average extraction confidence as a bar, or "Manual entry" when there are no scores */
export function ConfidenceCell({ average }: { average: number | undefined }) {
  if (average === undefined) {
    return <span className="text-[13px] text-muted-foreground">Manual entry</span>;
  }
  const percent = Math.round(average * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-[13px] font-medium tabular-nums">{percent}%</span>
      </div>
      <div className="text-xs text-muted-foreground">Average extraction confidence</div>
    </div>
  );
}

/** The executive working the lead: initials and name */
export function OwnerCell({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex min-w-0 items-center gap-2 text-[13px]">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground"
      >
        {initials}
      </span>
      <span className="truncate" title={name}>
        {name}
      </span>
    </span>
  );
}

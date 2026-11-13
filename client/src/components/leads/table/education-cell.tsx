import { GraduationCap } from "lucide-react";

import { EmptyCell, OverflowHoverCard } from "@/components/table";
import type { Education } from "@/types/candidate";
import { cleanEducation, educationMeta, educationTitle } from "./candidate-fields";

/**
 * A candidate's education in a table cell: the first entry (degree and institution) and a
 * "+N" pill that lists every entry.
 */
export function EducationCell({ education }: { education: readonly Education[] | null | undefined }) {
  const list = cleanEducation(education);
  if (list.length === 0) return <EmptyCell />;

  const [first, ...others] = list;
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="min-w-0">
        <div className="truncate text-[13px]" title={educationTitle(first)}>
          {educationTitle(first)}
        </div>
        {educationMeta(first) && (
          <div className="truncate text-[10px] tracking-wide text-muted-foreground">{educationMeta(first)}</div>
        )}
      </div>

      {others.length > 0 && (
        <OverflowHoverCard
          hiddenCount={others.length}
          title={`${list.length} qualifications`}
          triggerLabel={`Show all ${list.length} qualifications`}
          className="w-80"
        >
          <ul className="divide-y">
            {list.map((entry, index) => (
              <li key={`${educationTitle(entry)}-${index}`} className="flex gap-3 px-3 py-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <GraduationCap className="size-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-snug">{educationTitle(entry)}</p>
                  {educationMeta(entry) && <p className="text-xs text-muted-foreground">{educationMeta(entry)}</p>}
                </div>
              </li>
            ))}
          </ul>
        </OverflowHoverCard>
      )}
    </div>
  );
}

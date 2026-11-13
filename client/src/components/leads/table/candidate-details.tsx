import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Candidate } from "@/data/dummy-candidates";
import { cn } from "@/lib/utils";
import { useLeadRecord } from "./details/hooks/use-lead-record";
import { LEAD_TABS } from "./details/tabs-config";
import type { LeadTabValue } from "./details/types";

// Generic so Edit/Delete hand back the same row type the table passed in (e.g. CandidateRow)
interface CandidateDetailsProps<T extends Candidate> {
  candidate: T;
  onEdit: (candidate: T) => void;
  onDelete: (candidate: T) => void;
}

/**
 * Content of the candidate details drawer: tabs (Overview, Timeline, Notes, Tasks, Resume,
 * Certifications) plus the Edit / Delete actions.
 * The selected tab stays the same while stepping through candidates with ↑/↓.
 */
export function CandidateDetails<T extends Candidate>({ candidate, onEdit, onDelete }: CandidateDetailsProps<T>) {
  const [tab, setTab] = useState<LeadTabValue>("overview");

  return (
    <div className="flex min-h-full flex-col bg-muted/40 dark:bg-muted/20">
      {/* key: each candidate starts from its own record (notes, tasks, …) */}
      <CandidateTabs key={candidate.id} candidate={candidate} tab={tab} onTabChange={setTab} />

      {/* Actions stay at the bottom while the content scrolls */}
      <div className="sticky bottom-0 z-10 flex gap-2 border-t bg-popover px-4 py-3">
        <Button variant="outline" className="flex-1" onClick={() => onEdit(candidate)}>
          <Edit />
          Edit
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-red-200 text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-red-500/30"
          onClick={() => onDelete(candidate)}
        >
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  );
}

function CandidateTabs({
  candidate,
  tab,
  onTabChange,
}: {
  candidate: Candidate;
  tab: LeadTabValue;
  onTabChange: (tab: LeadTabValue) => void;
}) {
  const { record, actions } = useLeadRecord(candidate);

  return (
    <Tabs value={tab} onValueChange={(value) => onTabChange(value as LeadTabValue)} className="flex-1 gap-0">
      {/* Tab bar stays visible while the panel scrolls; scrolls sideways on narrow screens */}
      <div className="scroll-zero sticky top-0 z-10 overflow-x-auto border-b bg-popover px-4">
        <TabsList variant="line" className="gap-0.5 p-0 group-data-horizontal/tabs:h-11">
          {LEAD_TABS.map(({ value, label, count }) => {
            const total = count?.(candidate, record);
            const active = value === tab;
            return (
              <TabsTrigger
                key={value}
                value={value}
                className="h-full flex-none rounded-none px-2 text-[13px] group-data-horizontal/tabs:after:bottom-0"
              >
                {label}
                {!!total && (
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 text-center text-[11px] font-medium tabular-nums",
                      active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {total}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {LEAD_TABS.map(({ value, component: TabComponent }) => (
        <TabsContent key={value} value={value}>
          <TabComponent candidate={candidate} record={record} actions={actions} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

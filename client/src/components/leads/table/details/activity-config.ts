import {
  CalendarDays,
  CheckSquare,
  FileText,
  Flag,
  Mail,
  Phone,
  Sparkles,
  StickyNote,
  type LucideIcon,
} from "lucide-react";

import type { LeadActivityType, LeadTaskType } from "./types";

/** Icon and colors per activity type on the timeline (the badge adds ring-1, so ring-* sets its border) */
export const ACTIVITY_CONFIG: Record<LeadActivityType, { label: string; icon: LucideIcon; className: string }> = {
  call: { label: "Call", icon: Phone, className: "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30" },
  email: { label: "Email", icon: Mail, className: "bg-sky-50 text-sky-600 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/30" },
  meeting: { label: "Meeting", icon: CalendarDays, className: "bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30" },
  note: { label: "Note", icon: StickyNote, className: "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30" },
  task: { label: "Task", icon: CheckSquare, className: "bg-muted text-muted-foreground ring-border" },
  status: { label: "Status", icon: Flag, className: "bg-muted text-muted-foreground ring-border" },
  resume: { label: "Resume", icon: FileText, className: "bg-muted text-muted-foreground ring-border" },
  created: { label: "Created", icon: Sparkles, className: "bg-muted text-muted-foreground ring-border" },
};

/** Timeline filter chips: label → the activity types it shows (empty = all) */
export const TIMELINE_FILTERS: { value: string; label: string; types: LeadActivityType[] }[] = [
  { value: "all", label: "All", types: [] },
  { value: "calls", label: "Calls", types: ["call"] },
  { value: "emails", label: "Emails", types: ["email"] },
  { value: "meetings", label: "Meetings", types: ["meeting"] },
  { value: "notes", label: "Notes", types: ["note"] },
  { value: "updates", label: "Updates", types: ["status", "task", "resume", "created"] },
];

export const TASK_TYPE_CONFIG: Record<LeadTaskType, { label: string; icon: LucideIcon }> = {
  call: { label: "Call", icon: Phone },
  email: { label: "Email", icon: Mail },
  "follow-up": { label: "Follow-up", icon: CheckSquare },
  meeting: { label: "Meeting", icon: CalendarDays },
};

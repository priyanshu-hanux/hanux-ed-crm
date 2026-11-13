import { format, isToday, isTomorrow, isYesterday } from "date-fns";

import type { LeadStatus } from "./types";

/** 245760 → "240 KB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "Today", "Yesterday", "Tomorrow" or "Mon, 12 Oct" */
export function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, d MMM");
}

/** Unique enough id for items created in the browser */
export function createLocalId(prefix: string) {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Label and colors per pipeline status */
export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; className: string; dotClassName: string }> = {
  new: { label: "New", className: "bg-sky-500/10 text-sky-700 dark:text-sky-300", dotClassName: "bg-sky-500" },
  contacted: { label: "Contacted", className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300", dotClassName: "bg-indigo-500" },
  qualified: { label: "Qualified", className: "bg-violet-500/10 text-violet-700 dark:text-violet-300", dotClassName: "bg-violet-500" },
  offer: { label: "Offer", className: "bg-teal-500/10 text-teal-700 dark:text-teal-300", dotClassName: "bg-teal-500" },
  interviewing: { label: "Interviewing", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", dotClassName: "bg-emerald-500" },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-700 dark:text-red-300", dotClassName: "bg-red-500" },
  hired: { label: "Hired", className: "bg-amber-500/10 text-amber-700 dark:text-amber-300", dotClassName: "bg-amber-500" },
};

/** Confidence (0–1) → percent and a level for coloring */
export function confidenceLevel(value: number | undefined) {
  const percent = Math.round(Math.max(0, Math.min(1, value ?? 0)) * 100);
  const level = percent >= 80 ? "high" : percent >= 60 ? "medium" : "low";
  return { percent, level } as const;
}

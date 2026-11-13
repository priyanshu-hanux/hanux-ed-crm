import { addDays, format } from "date-fns";
import type { Activity } from "./types";

/** Fast local `yyyy-MM-dd` key (called for every calendar cell, so no date-fns here). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** `14:30` -> `2:30 PM` */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** `2026-10-28` -> `Wed, Oct 28` */
export function formatShortDate(key: string): string {
  return format(fromDateKey(key), "EEE, MMM d");
}

/** ISO-style keys sort correctly as plain strings, so no Date parsing is needed. */
export function compareActivities(a: Activity, b: Activity): number {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
}

/** `Today` / `Tomorrow` / `Wed, Oct 28` relative to the given today key. */
export function formatDayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return "Today";
  if (key === toDateKey(addDays(fromDateKey(todayKey), 1))) return "Tomorrow";
  return formatShortDate(key);
}
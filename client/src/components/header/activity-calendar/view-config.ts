import type { ActivityStats, AgendaGroupKey } from "./types";

/**
 * Everything about which view/tab shows by default lives here.
 * Change a value in PANEL_DEFAULTS (or pass the matching prop) and nothing else needs to move.
 */

export type ActivityView = "list" | "calendar";
export type ListTabSetting = AgendaGroupKey | "auto";

export const PANEL_DEFAULTS: { view: ActivityView; listTab: ListTabSetting } = {
  /** View shown the first time the popover opens. Afterwards the user's last choice is kept. */
  view: "list",
  /** List tab chosen every time the popover opens. "auto" = most urgent non-empty tab. */
  listTab: "auto",
};

/** Order here = order of the tabs. Reorder, rename or remove freely. */
export const LIST_TABS: {
  value: AgendaGroupKey;
  label: string;
  count: (stats: ActivityStats) => number;
  urgent?: boolean;
}[] = [
  { value: "overdue", label: "Overdue", count: (s) => s.overdue, urgent: true },
  { value: "today", label: "Today", count: (s) => s.dueToday },
  { value: "upcoming", label: "Upcoming", count: (s) => s.upcoming },
];

/** Priority used by "auto": first tab in this order that has something in it. */
const AUTO_PRIORITY: AgendaGroupKey[] = ["overdue", "today", "upcoming"];

export function resolveListTab(setting: ListTabSetting, stats: ActivityStats): AgendaGroupKey {
  if (setting !== "auto") return setting;
  const counts: Record<AgendaGroupKey, number> = {
    overdue: stats.overdue,
    today: stats.dueToday,
    upcoming: stats.upcoming,
  };
  return AUTO_PRIORITY.find((key) => counts[key] > 0) ?? "today";
}
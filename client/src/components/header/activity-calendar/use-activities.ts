import { useCallback, useMemo, useRef, useState } from "react";
import type { Activity, ActivityStats, ActivityStatus, AgendaGroups } from "./types";
import { compareActivities, toDateKey } from "./utils";

interface UseActivitiesOptions {
  /** Persist status changes to your API here (the UI updates optimistically). */
  onStatusChange?: (id: string, status: ActivityStatus) => void;
}

export function useActivities(initial: Activity[], { onStatusChange }: UseActivitiesOptions = {}) {
  const [activities, setActivities] = useState<Activity[]>(initial);

  const latest = useRef(activities);
  latest.current = activities;
  const statusCallback = useRef(onStatusChange);
  statusCallback.current = onStatusChange;

  const now = new Date();
  const todayKey = toDateKey(now);

  const sorted = useMemo(() => [...activities].sort(compareActivities), [activities]);

  /** O(1) lookup per calendar cell instead of scanning every activity. */
  const byDate = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of sorted) {
      const list = map.get(activity.date);
      if (list) list.push(activity);
      else map.set(activity.date, [activity]);
    }
    return map;
  }, [sorted]);

  const agenda = useMemo<AgendaGroups>(() => {
    const groups: AgendaGroups = { overdue: [], today: [], upcoming: [] };
    for (const activity of sorted) {
      // Today keeps completed items so progress stays visible.
      if (activity.date === todayKey) groups.today.push(activity);
      else if (activity.status !== "pending") continue;
      else if (activity.date < todayKey) groups.overdue.push(activity);
      else groups.upcoming.push(activity);
    }
    return groups;
  }, [sorted, todayKey]);

  const stats = useMemo<ActivityStats>(
    () => ({
      overdue: agenda.overdue.length,
      dueToday: agenda.today.filter((a) => a.status === "pending").length,
      upcoming: agenda.upcoming.length,
      pending: activities.filter((a) => a.status === "pending").length,
    }),
    [agenda, activities]
  );

  /** Stable identity, so memoized rows don't re-render when one item changes. */
  const toggleComplete = useCallback((id: string) => {
    const target = latest.current.find((a) => a.id === id);
    if (!target) return;
    const status: ActivityStatus = target.status === "completed" ? "pending" : "completed";

    setActivities((current) => current.map((a) => (a.id === id ? { ...a, status } : a)));
    statusCallback.current?.(id, status);
  }, []);

  return { activities: sorted, byDate, agenda, stats, todayKey, toggleComplete, setActivities };
}
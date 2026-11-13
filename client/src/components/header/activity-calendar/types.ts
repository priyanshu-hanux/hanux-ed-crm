export type ActivityType = "task" | "follow-up" | "call" | "meeting" | "reminder";

export type ActivityStatus = "pending" | "completed";

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  /** Local date, `yyyy-MM-dd` */
  date: string;
  /** 24h local time, `HH:mm` (sortable as a string) */
  time: string;
  contact: string;
  company?: string;
  phone?: string;
  email?: string;
  status: ActivityStatus;
  description?: string;
}

export type AgendaGroupKey = "overdue" | "today" | "upcoming";

export type AgendaGroups = Record<AgendaGroupKey, Activity[]>;

export interface ActivityStats {
  overdue: number;
  dueToday: number;
  upcoming: number;
  pending: number;
}
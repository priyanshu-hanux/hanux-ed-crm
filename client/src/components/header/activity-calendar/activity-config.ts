import { Bell, ListTodo, Mail, Phone, Users, type LucideIcon } from "lucide-react";
import type { ActivityType } from "./types";

export const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  "call",
  "meeting",
  "follow-up",
  "task",
  "reminder",
];

export const ACTIVITY_TYPES: Record<
  ActivityType,
  { label: string; icon: LucideIcon; tone: string; dot: string }
> = {
  task: {
    label: "Task",
    icon: ListTodo,
    tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  "follow-up": {
    label: "Follow-up",
    icon: Mail,
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  call: {
    label: "Call",
    icon: Phone,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  meeting: {
    label: "Meeting",
    icon: Users,
    tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  reminder: {
    label: "Reminder",
    icon: Bell,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500",
  },
};

export const notificationCategories = [
  "mention",
  "task",
  "lead",
  "deal",
  "meeting",
  "approval",
  "billing",
  "system",
] as const;

export type NotificationEntity = "lead" | "contact" | "deal" | "task" | "meeting" | "invoice" | "system";
export type NotificationCategory = (typeof notificationCategories)[number];
export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type UserRole = "admin" | "manager" | "sales" | "support" | "member";

export type NotificationAction =
  | { type: "navigate"; label: string; href: string }
  | { type: "complete-task"; label: string; taskId: string }
  | { type: "approve"; label: string; entityId: string }
  | { type: "reject"; label: string; entityId: string };

export interface Notification {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string;

  priority: NotificationPriority;

  recipientId: string;
  audienceRoles?: UserRole[];

  actor?: {
    id: string;
    name: string;
    avatarUrl?: string
  };

  entity?: {
    type: NotificationEntity;
    id: string;
    label: string
  };

  href?: string;

  actions?: NotificationAction[];
  readAt: string | null;
  archivedAt: string | null;
}

export type NotificationTab = "all" | "mentions" | "tasks" | "deals" | "system";
export type NotificationReadFilter = "all" | "unread" | "read";

export function isNotificationUnread(notification: Notification): boolean {
  return notification.readAt === null;
}

export function matchesTab(notification: Notification, tab: NotificationTab): boolean {
  if (tab === "all") return true;
  if (tab === "mentions") return notification.category === "mention";
  if (tab === "tasks") return notification.category === "task";
  if (tab === "deals") return notification.category === "deal";
  return notification.category === "system";
}

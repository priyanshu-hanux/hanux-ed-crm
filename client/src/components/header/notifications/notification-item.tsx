import type { ComponentType } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import {
  Archive, ArrowUpRight, BellRing, CalendarClock, CircleAlert, Handshake,
  ListTodo, Mail, MailOpen, MessageSquareText, ShieldCheck, UserRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isNotificationUnread, type Notification, type NotificationCategory } from "../../../types/notification-types";
import { images } from "@/assets";

type CategoryMeta = { icon: ComponentType<{ className?: string }>; tone: string };

// Each category gets its own icon + tint so items are scannable without reading badges.
const categoryMeta: Record<NotificationCategory, CategoryMeta> = {
  mention: { icon: MessageSquareText, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  task: { icon: ListTodo, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  lead: { icon: UserRound, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  deal: { icon: Handshake, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  meeting: { icon: CalendarClock, tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
  approval: { icon: ShieldCheck, tone: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  billing: { icon: CircleAlert, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  system: { icon: BellRing, tone: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
};

// const priorityStyle: Partial<Record<Notification["priority"], string>> = {
//   high: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
//   urgent: "bg-destructive/10 text-destructive",
// };

const UNIT_SHORT: Record<string, string> = { second: "s", minute: "m", hour: "h", day: "d", month: "mo", year: "y" };

function parseDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "Just now", then "18m" / "3h" in compact lists, or "18 minutes ago" on the full page. */
function relativeTime(date: Date | null, compact: boolean): string {
  if (!date) return "Recently";
  if (Date.now() - date.getTime() < 60_000) return "Just now";
  if (!compact) return formatDistanceToNowStrict(date, { addSuffix: true });
  return formatDistanceToNowStrict(date).replace(/ (second|minute|hour|day|month|year)s?/, (_, unit: string) => UNIT_SHORT[unit]);
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function NotificationItem({
  notification,
  compact = false,
  onRead,
  onUnread,
  onArchive,
  onAction,
}: {
  notification: Notification;
  compact?: boolean;
  onRead: (id: string) => void;
  onUnread: (id: string) => void;
  onArchive: (id: string) => void;
  onAction: (notification: Notification, action: NonNullable<Notification["actions"]>[number]) => void;
}) {
  const { icon: Icon, tone } = categoryMeta[notification.category];
  const unread = isNotificationUnread(notification);
  const [primaryAction, ...secondaryActions] = notification.actions ?? [];
  const date = parseDate(notification.createdAt);
  // const priorityClass = priorityStyle[notification.priority];
  // const hasMeta = Boolean(priorityClass || notification.entity);

  return (
    <article
      className={cn(
        "group cursor-default relative flex gap-3 rounded-xl transition-colors duration-150 hover:bg-muted/60 focus-within:bg-muted/60 border border-transparent ",
        compact ? "py-3 px-3" : "py-4 px-4",
      )}
    >

      {/* Avatar with category glyph, or a tinted category tile when there is no actor */}
      <div className="relative mt-0.5 shrink-0 flex flex-col items-center justify-between">
        {notification.actor?.name ? (
          <>
            <Avatar className={cn(
              "border border-border/60",
              compact ? "size-9" : "size-10",
            )}>
              <AvatarImage src={(notification.actor.avatarUrl) ? notification.actor.avatarUrl : images.message} alt="" />
              <AvatarFallback className="bg-muted text-xs font-medium text-foreground/80">
                {initials(notification.actor.name)}
              </AvatarFallback>
            </Avatar>
          </>
        ) : (
          <span className={cn("grid size-9 place-items-center rounded-full", tone)}>
            <Icon className="size-4" />
          </span>
        )}
        <span className="sr-only">{notification.category}</span>
        {unread ? (
          <span
            className={cn("absolute size-1.5 rounded-full bg-green-500", compact ? "left-1 top-0" : "left-1.5 top-[1.55rem]")}
          >
            <span className="sr-only">Unread</span>
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <p
            className={cn(
              "min-w-0 flex-1 text-sm leading-5",
              compact && "truncate",
              unread ? "font-medium text-foreground" : "font-medium text-foreground/75",
            )}
          >
            {notification.title}
          </p>
          <time
            dateTime={notification.createdAt}
            title={date ? format(date, "PPpp") : undefined}
            className="shrink-0 text-xs tabular-nums text-muted-foreground"
          >
            {relativeTime(date, compact)}
          </time>
        </div>

        <p
          className={cn(
            "text-xs leading-5",
            unread ? "text-muted-foreground" : "text-muted-foreground/80",
            compact
              ? "line-clamp-2"
              : "line-clamp-3",
          )}
        >
          {(notification.message.length < 45) ? notification.message : notification.message.slice(0, 45) + "..."}
        </p>

        {/* {hasMeta ? (
          <div className="mt-2 flex min-w-0 items-center gap-2">
            {priorityClass ? (
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", priorityClass)}>
                <span className="size-1.5 rounded-full bg-current" />
                {notification.priority}
              </span>
            ) : null}
            {notification.entity ? (
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                <span className="capitalize">{notification.entity.type}</span>
                <span className="mx-1.5 text-muted-foreground/50">/</span>
                <span className="text-foreground/70">{notification.entity.label}</span>
              </span>
            ) : null}
          </div>
        ) : null} */}

        {/* Actions on the left */}
        <div className="mt-2 flex items-center gap-2">
          {primaryAction ? (
            <div className="flex min-w-0 flex-wrap gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 rounded-md px-2.5 text-[10px] tracking-wide"
                onClick={() => onAction(notification, primaryAction)}
              >
                {primaryAction.label}
                {primaryAction.type === "navigate" ? <ArrowUpRight className="ml-0.5 size-3.5" /> : null}
              </Button>
              {secondaryActions.map((action) => (
                <Button
                  key={`${action.type}-${action.label}`}
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => onAction(notification, action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          ) : null}

          <div
            className={cn(
              "ml-auto flex shrink-0 items-center gap-0.5 transition-opacity",
              "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100",
            )}
          >
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:text-foreground"
              aria-label={unread ? "Mark as read" : "Mark as unread"}
              title={unread ? "Mark as read" : "Mark as unread"}
              onClick={() => (unread ? onRead(notification.id) : onUnread(notification.id))}
            >
              {unread ? <MailOpen className="size-3.5" /> : <Mail className="size-3.5" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7 text-muted-foreground hover:text-foreground"
              aria-label="Archive notification"
              title="Archive notification"
              onClick={() => onArchive(notification.id)}
            >
              <Archive className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
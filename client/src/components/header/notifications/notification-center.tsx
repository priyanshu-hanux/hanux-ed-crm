import * as React from "react";

import { Link } from "react-router";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { Search, SlidersHorizontal, CheckCheck, Inbox, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationItem } from "./notification-item";
import { useNotifications } from "@/contexts/notification-provider";
import { matchesTab, type NotificationReadFilter, type NotificationTab } from "@/types/notification-types";

const PAGE_SIZE = 8;

function validTab(value: string | null): NotificationTab {
  return value === "mentions" || value === "tasks" || value === "deals" || value === "system" ? value : "all";
}
function validStatus(value: string | null): NotificationReadFilter {
  return value === "unread" || value === "read" ? value : "all";
}

export function NotificationCenter() {
  const router = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const { notifications, unreadCount, markRead, markUnread, markAllRead, archive, runAction } = useNotifications();
  const tab = validTab(searchParams.get("tab"));
  const status = validStatus(searchParams.get("status"));
  const query = searchParams.get("q") ?? "";
  const requestedPage = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const [searchValue, setSearchValue] = React.useState(query);

  React.useEffect(() => setSearchValue(query), [query]);

  const updateParams = React.useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || (key === "page" && value === "1") || (key === "tab" && value === "all") || (key === "status" && value === "all")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router(`${pathname}?${params.toString()}`, { replace: true, preventScrollReset: true });
  }, [pathname, router, searchParams]);

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return notifications
      .filter((item) => !item.archivedAt)
      .filter((item) => matchesTab(item, tab))
      .filter((item) => status === "all" || (status === "unread" ? !item.readAt : Boolean(item.readAt)))
      .filter((item) => !normalized || `${item.title} ${item.message} ${item.category} ${item.entity?.label ?? ""}`.toLowerCase().includes(normalized))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [notifications, tab, status, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    if (requestedPage !== page) updateParams({ page: String(page) });
  }, [requestedPage, page, updateParams]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateParams({ q: searchValue.trim() || null, page: "1" });
  }

  return (
    <main className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay on top of activity across your workspace.</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="mr-2 size-4" /> Mark all as read
        </Button>
      </div>

      <div className="mt-7 rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onValueChange={(value) => updateParams({ tab: value, page: "1" })}>
            <TabsList className="grid h-9 w-full grid-cols-5 sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="mentions">Mentions</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="deals">Deals</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form onSubmit={submitSearch} className="relative min-w-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search notifications..." className="pl-9" aria-label="Search notifications" />
            </form>
            <Select value={status} onValueChange={(value) => updateParams({ status: value, page: "1" })}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filter by read status">
                <SlidersHorizontal className="mr-2 size-4" />
                <SelectValue placeholder="Read status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "notification" : "notifications"}
            {status === "unread" ? " · Unread" : status === "read" ? " · Read" : ""}
          </p>
          <Link to="/settings/notifications" className="text-sm font-medium text-primary hover:underline">Preferences</Link>
        </div>
        <Separator />

        {pageItems.length ? (
          <div className="divide-y p-2 sm:p-3">
            {pageItems.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markRead}
                onUnread={markUnread}
                onArchive={archive}
                onAction={runAction}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Inbox className="mb-3 size-10 text-muted-foreground" />
            <h2 className="font-medium">No matching notifications</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Try another filter or search term. New activity will appear here.</p>
            {(query || status !== "all" || tab !== "all") ? (
              <Button className="mt-4" variant="outline" onClick={() => updateParams({ q: null, status: "all", tab: "all", page: "1" })}>
                Clear filters
              </Button>
            ) : null}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · Showing {pageItems.length} of {filtered.length}
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
              <ChevronLeft className="mr-1 size-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}>
              Next <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Demo UI: notifications older than seven days remain available here. The popover only shows the most recent seven days.
      </p>
    </main>
  );
}

import { Suspense } from "react";
import { NotificationCenter } from "@/components/header/notifications/notification-center";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted-foreground">Loading notifications…</div>}>
      <NotificationCenter />
    </Suspense>
  );
}

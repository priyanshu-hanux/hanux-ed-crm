"use client";

import * as React from "react";
import { mockNotifications } from "@/data/mock-data";
import type {
    Notification,
    NotificationAction,
    UserRole,
} from "@/types/notification-types";

interface NotificationContextValue {
    notifications: Notification[];
    currentRole: UserRole;
    unreadCount: number;
    markRead: (id: string) => void;
    markUnread: (id: string) => void;
    markAllRead: () => void;
    archive: (id: string) => void;
    runAction: (notification: Notification, action: NotificationAction) => void;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
    children,
    currentRole = "member",
    currentUserId = "demo-user",
    initialNotifications = mockNotifications,
}: {
    children: React.ReactNode;
    currentRole?: UserRole;
    currentUserId?: string;
    initialNotifications?: Notification[];
}) {
    const [notifications, setNotifications] = React.useState<Notification[]>(initialNotifications);

    const visibleNotifications = React.useMemo(
        () =>
            notifications.filter(
                (item) => item.recipientId === currentUserId && (!item.audienceRoles || item.audienceRoles.includes(currentRole)),
            ),
        [notifications, currentRole, currentUserId],
    );

    const markRead = React.useCallback((id: string) => {
        setNotifications((items) =>
            items.map((item) => item.id === id && !item.readAt
                ? { ...item, readAt: new Date().toISOString() }
                : item),
        );
    }, []);

    const markUnread = React.useCallback((id: string) => {
        setNotifications((items) =>
            items.map((item) => item.id === id ? { ...item, readAt: null } : item),
        );
    }, []);

    const markAllRead = React.useCallback(() => {
        const now = new Date().toISOString();
        setNotifications((items) =>
            items.map((item) =>
                item.recipientId === currentUserId && (!item.audienceRoles || item.audienceRoles.includes(currentRole)) && !item.readAt
                    ? { ...item, readAt: now }
                    : item,
            ),
        );
    }, [currentRole, currentUserId]);

    const archive = React.useCallback((id: string) => {
        setNotifications((items) =>
            items.map((item) => item.id === id
                ? { ...item, archivedAt: new Date().toISOString() }
                : item),
        );
    }, []);

    const runAction = React.useCallback(
        (notification: Notification, action: NotificationAction) => {
            // Demo-only action handling. In production, call an authenticated API,
            // verify permissions on the server, and only then update local state.
            if (action.type === "complete-task" || action.type === "approve" || action.type === "reject") {
                markRead(notification.id);
                return;
            }
            markRead(notification.id);
            if (typeof window !== "undefined") window.location.assign(action.href);
        },
        [markRead],
    );

    const value = React.useMemo<NotificationContextValue>(() => ({
        notifications: visibleNotifications,
        currentRole,
        unreadCount: visibleNotifications.filter((item) => !item.readAt && !item.archivedAt).length,
        markRead,
        markUnread,
        markAllRead,
        archive,
        runAction,
    }), [visibleNotifications, currentRole, markRead, markUnread, markAllRead, archive, runAction]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): NotificationContextValue {
    const context = React.useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotifications must be used inside NotificationProvider");
    }
    return context;
}

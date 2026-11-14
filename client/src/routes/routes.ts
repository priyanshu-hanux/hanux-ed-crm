import { createBrowserRouter } from "react-router";
import { lazy } from "react";

import { RootLayout } from "@/layouts/root-layout";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { GuestRoute, ProtectedRoute } from "@/components/site/protected-route";
import { withPermission } from "@/components/site/permission-route";
import { ErrorPage } from "@/app/error/error";
import { Unauthorized } from "@/app/error/unauthorized";
import SignInPage from "@/app/auth/signin-page";
import SignUpPage from "@/app/auth/signup-page";
import DestinationPage from "@/components/leads/page";

const Overview = lazy(() => import("@/app/dashboard/overview-page"));
const SearchPage = lazy(() => import("@/app/dashboard/search-page"));
const CampaignsPage = lazy(() => import("@/app/dashboard/campaigns-page"));
const LeadsPage = lazy(() => import("@/app/dashboard/leads-page"));
const CallTransferPage = lazy(() => import("@/app/dashboard/call-transfer-page"));
const FollowUpPage = lazy(() => import("@/app/dashboard/followup-page"));
const CalendarPage = lazy(() => import("@/app/dashboard/calendar-page"));
const NotificationsPage = lazy(() => import("@/app/notifications/page"));
const CallLogsPage = lazy(() => import("@/app/dashboard/call-logs-page"));
const ReportsPage = lazy(() => import("@/app/dashboard/reports-page"));
const SettingsPage = lazy(() => import("@/app/dashboard/settings-page"));
const TargetsPage = lazy(() => import("@/app/dashboard/targets-page"));
const IntegrationsPage = lazy(() => import("@/app/dashboard/integrations-page"));
const TeamPage = lazy(() => import("@/app/dashboard/team-page"));
const AcceptInvitePage = lazy(() => import("@/app/auth/accept-invite-page"));

export const router = createBrowserRouter([
    {
        Component: RootLayout,
        children: [
            { path: "*", Component: ErrorPage },
            { path: "not-found", Component: ErrorPage },
            { path: "unauthorized", Component: Unauthorized },
            {
                // Signed-in users only.
                Component: ProtectedRoute,
                children: [
                    {
                        path: "/",
                        Component: DashboardLayout,
                        children: [
                            { index: true, Component: Overview },
                            { path: "overview", Component: Overview },
                            { path: "search", Component: SearchPage },
                            { path: "campaigns", Component: CampaignsPage },
                            { path: "leads", Component: LeadsPage },
                            { path: "leads/a", Component: DestinationPage },
                            {
                                Component: withPermission("reports:read"),
                                children: [{ path: "reports", Component: ReportsPage }],
                            },
                            {
                                Component: withPermission("members:read"),
                                children: [{ path: "team", Component: TeamPage }],
                            },
                            { path: "notifications", Component: NotificationsPage },
                            { path: "settings", Component: SettingsPage },
                            {
                                Component: withPermission("org:manage"),
                                children: [{ path: "integrations", Component: IntegrationsPage }],
                            },
                            {
                                path: "activities",
                                children: [
                                    { index: true, Component: CallTransferPage },
                                    { path: "call-transfer", Component: CallTransferPage },
                                    { path: "calls", Component: CallLogsPage },
                                ],
                            },
                            {
                                path: "tasks",
                                children: [
                                    { index: true, Component: FollowUpPage },
                                    { path: "follow-ups", Component: FollowUpPage },
                                    { path: "calendar", Component: CalendarPage },
                                ],
                            },
                            {
                                path: "performance",
                                children: [
                                    { index: true, Component: TargetsPage },
                                    { path: "targets", Component: TargetsPage },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                // Signed-out users only.
                path: "auth",
                Component: GuestRoute,
                children: [
                    { index: true, Component: SignInPage },
                    { path: "sign-in", Component: SignInPage },
                    { path: "sign-up", Component: SignUpPage },
                ],
            },
            // From the invitation email. Works signed in or out (it explains what to do).
            { path: "auth/invite/:token", Component: AcceptInvitePage },
        ],
    },
]);

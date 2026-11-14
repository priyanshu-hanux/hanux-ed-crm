import { appIcons } from "@/configs/icons";
import type { NavGroup } from "@/types/app-layout";

export type Role = {
    /** Role assignment id, for signed-in roles. */
    id?: string
    name: string
    logo: React.ElementType
    plan: string
}

export const GUEST_ROLE: Role = {
    name: "Guest",
    logo: appIcons.incognito,
    plan: "Visitor"
}

/** Items with a `permission` are hidden from roles that lack it. */
export const navigation: NavGroup[] = [
    {
        groupTitle: "Workspace",
        items: [
            {
                title: "Overview",
                url: "/overview",
                icon: appIcons.dashboard,
                isActive: true,
            },
            {
                title: "Search",
                url: "/search",
                icon: appIcons.search
            },
            {
                title: "Targets",
                url: "/performance/targets",
                icon: appIcons.performnace,
            },
            // {
            //     title: "Finder",
            //     url: "/search?finder",
            //     icon: appIcons.finder,
            // },
        ],
    },
    {
        groupTitle: "Sales",
        items: [
            {
                title: "Campaigns",
                url: "/campaigns",
                icon: appIcons.send,
            },
            {
                title: "Lead Management",
                url: "/leads",
                permission: "leads:read",
                icon: appIcons.database,
                items: [
                    {
                        title: "Unassigned",
                        url: "/leads?type=unassigned",
                        // The branch's unassigned pool: for whoever assigns leads.
                        permission: "leads:assign",
                        icon: appIcons.listChevronsUpDown
                    },
                    {
                        title: "Assigned",
                        url: "/leads?type=assigned",
                        icon: appIcons.listChecks
                    },
                    {
                        title: "Claimed",
                        url: "/leads?type=claimed",
                        icon: appIcons.circleDashedCheck
                    },
                    {
                        title: "Successful",
                        url: "/leads?type=successful",
                        icon: appIcons.badgeCheck
                    },
                    {
                        title: "Unsuccessful",
                        url: "/leads?type=unsuccessful",
                        icon: appIcons.circleX
                    },
                ],
            },
            {
                title: "Call Transfer",
                url: "/activities/call-transfer",
                icon: appIcons.callTransfer,
            },
            {
                title: "Follow-ups",
                url: "/tasks/follow-ups",
                icon: appIcons.listChecks,
            },
            {
                title: "Calendar",
                url: "/tasks/calendar",
                icon: appIcons.calendar,
            },
        ],
    },
    {
        groupTitle: "Activities",
        items: [
            {
                title: "Call Logs",
                url: "/activities/calls",
                icon: appIcons.callLog,
                items: [
                    {
                        title: "All Calls",
                        url: "/activities/calls?type=all",
                        icon: appIcons.listChevronsUpDown,
                    },
                    {
                        title: "Incoming",
                        url: "/activities/calls?type=incoming",
                        icon: appIcons.phoneIncoming,
                    },
                    {
                        title: "Outgoing",
                        url: "/activities/calls?type=outgoing",
                        icon: appIcons.phoneOutgoing,
                    },
                    {
                        title: "Missed",
                        url: "/activities/calls?type=missed",
                        icon: appIcons.phoneMissed,
                    },
                    // {
                    //     title: "Answered",
                    //     url: "/activities/calls?type=answered",
                    //     icon: appIcons.phoneCall,
                    // },
                    // {
                    //     title: "Successful",
                    //     url: "/activities/calls?type=successful",
                    //     icon: appIcons.badgeCheck,
                    // },
                    // {
                    //     title: "Unsuccessful",
                    //     url: "/activities/calls?type=unsuccessful",
                    //     icon: appIcons.circleX,
                    // },
                    // {
                    //     title: "Voicemail",
                    //     url: "/activities/calls?type=voicemail",
                    //     icon: appIcons.voicemail,
                    // },
                ],
            },
            {
                title: "Reports",
                url: "/reports",
                permission: "reports:read",
                icon: appIcons.chart,
            },

        ],
    },
    {
        groupTitle: "Manage",
        items: [
            {
                title: "Team",
                url: "/team",
                permission: "members:read",
                icon: appIcons.users,
            },
            {
                title: "Integrations",
                url: "/integrations",
                permission: "org:manage",
                icon: appIcons.plug,
            },
            {
                title: "Notifications",
                url: "/notifications",
                icon: appIcons.bell,
            },
            {
                title: "Settings",
                url: "/settings",
                icon: appIcons.settings,
            },
        ],
    },
]

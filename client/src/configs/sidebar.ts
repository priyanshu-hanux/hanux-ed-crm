import { appIcons } from "@/configs/icons";
export type Role = {
    name: string
    logo: React.ElementType
    plan: string
}

export const user = {
    name: "Rakesh Kumar",
    email: "kumar@hanux.com",
    avatar: "https://github.com/shadcn.png",
}

export const GUEST_ROLE: Role = {
    name: "Guest",
    logo: appIcons.incognito,
    plan: "Visitor"
}

export const roles = [
    {
        name: "Super Admin",
        logo: appIcons.superAdmin,
        plan: "Hanux Tech Solutions",
    },
    {
        name: "Admin",
        logo: appIcons.admin,
        plan: "Hanux Tech Solutions",
    },
    {
        name: "Manager",
        logo: appIcons.manager,
        plan: "Hanux Tech Solutions",
    },
    {
        name: "Executive",
        logo: appIcons.user,
        plan: "Hanux Tech Solutions",
    },
]

export const navigation = [
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
                icon: appIcons.database,
                items: [
                    {
                        title: "Unassigned",
                        url: "/leads?type=unassigned",
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
                icon: appIcons.users,
            },
            {
                title: "Integrations",
                url: "/integrations",
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

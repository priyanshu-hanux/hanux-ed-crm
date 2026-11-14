import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { Link, useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator"
import {
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { appIcons } from "@/configs/icons";
import { NavUser } from "@/components/sidebar/nav-user";
import { DateSelector } from "@/components/site/date-selector";
import { NotificationBell } from "@/components/header/notifications";
import { FollowUpCalendar } from "@/components/header/activity-calendar/follow-up-calendar";
import { UrgentAlert } from "@/components/header/urgent-alert/urgent-alert";
import { HelpMe } from "@/components/header/help-me/help-me";

export const AppHeader = () => {
    const navigate = useNavigate();

    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const now = new Date();

        return {
            from: startOfMonth(now),
            to: endOfMonth(now),
        };
    });

    const handleViewAllFollowUps = () => {
        navigate("/tasks/follow-ups");
    }

    useEffect(() => {
        if (!dateRange?.from || !dateRange?.to) return;

        // Ready for your future API/database query.
        const filters = {
            from: dateRange.from.toISOString(),
            to: dateRange.to.toISOString(),
        };

        console.log("Dashboard date filters:", filters);

        // Later:
        // fetchDashboardMetrics(filters);
    }, [dateRange]);

    return (
        // <header className="bg-layout flex h-14 shrink-0 items-center justify-between gap-2 transition-[width,height] duration-200 ease-smooth group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 border-b border-b-border">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 transition-[width,height] duration-200 ease-smooth group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
            <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="data-[orientation=vertical]:h-4"
                />

                <Button asChild variant="ghost" size="icon" aria-label="Dashboard">
                    <Link to="/dashboard">
                        <appIcons.home className="text-muted-foreground" />
                    </Link>
                </Button>

                <Separator
                    orientation="vertical"
                    className="data-[orientation=vertical]:h-4 mr-2"
                />

                <DateSelector value={dateRange} onChange={setDateRange} />
            </div>

            <div className="flex items-center gap-3 px-4">
                <NotificationBell />
                <UrgentAlert />
                <FollowUpCalendar onViewAll={handleViewAllFollowUps} />
                <HelpMe />

                <Separator
                    orientation="vertical"
                    className="data-[orientation=vertical]:h-5 mx-1"
                />

                <NavUser />
            </div>
        </header>
    )
}

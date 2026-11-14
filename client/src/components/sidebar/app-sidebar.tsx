import * as React from "react"

import { NavLinks } from "@/components/sidebar/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { navigation, type Role } from "@/configs/sidebar";
import { appIcons } from "@/configs/icons";
import { Separator } from "@/components/ui/separator";
import { TimezoneSwitcher } from "@/components/sidebar/timezone/timezone-switcher";
import { RoleSwitcher } from "@/components/sidebar/role-switcher";
import { useAuth } from "@/hooks/use-auth";
import { assignmentLabel, type OrgRole } from "@/types/session";

const ROLE_ICONS: Record<OrgRole, React.ElementType> = {
  SUPER_ADMIN: appIcons.superAdmin,
  ADMIN: appIcons.admin,
  MANAGER: appIcons.manager,
  EXECUTIVE: appIcons.user,
};

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const { session, activeAssignment, status } = useAuth();

  // Phase 1 shows the active role; switching between roles comes with permissions.
  const roles: Role[] =
    session && activeAssignment
      ? [
          {
            name: assignmentLabel(activeAssignment, session.branches.length),
            logo: ROLE_ICONS[activeAssignment.role],
            plan: session.organization.name,
          },
        ]
      : [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 justify-center">
        <RoleSwitcher roles={roles} loading={status === "loading"} />

        <Separator orientation="horizontal" className="bg-muted h-1" />
        
        {/* <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <appIcons.thumbnail className="size-4" />
                </div>

                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    Hanux Tech Solutions
                  </span>
                  <span className="truncate text-xs">
                    Enterprise
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu> */}
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((section) => (
          <NavLinks
            key={section.groupTitle}
            groupTitle={section.groupTitle}
            items={section.items}
          />
        ))}
      </SidebarContent>

      <SidebarFooter className="flex items-center">
        <Separator orientation="horizontal" />
        <SidebarMenu>
          <SidebarMenuItem>
            <TimezoneSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

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

import { navigation, roles } from "@/configs/sidebar";
import { Separator } from "@/components/ui/separator";
import { TimezoneSwitcher } from "@/components/sidebar/timezone/timezone-switcher";
import { RoleSwitcher } from "./role-switcher";

export function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {

  // e.g. calls getCurrentUser() → /v1/me
  // const { data: user, isLoading } = useCurrentUser(); 
  // <RoleSwitcher roles={user?.roles.map(toRole)} loading={isLoading} />

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 justify-center">
        <RoleSwitcher roles={roles} />

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

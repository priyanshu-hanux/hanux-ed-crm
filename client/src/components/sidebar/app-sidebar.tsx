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

import { useNavigate } from "react-router";
import { navigation, PLATFORM_ROLE, platformNavigation, type Role } from "@/configs/sidebar";
import { appIcons } from "@/configs/icons";
import { Separator } from "@/components/ui/separator";
import { TimezoneSwitcher } from "@/components/sidebar/timezone/timezone-switcher";
import { RoleSwitcher } from "@/components/sidebar/role-switcher";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { filterNavigation } from "@/types/app-layout";
import { isApiError } from "@/types/app-error";
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
  const { session, status, can, switchRole } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = React.useState(false);

  const roles: Role[] = [
    ...(session?.assignments.map((assignment) => ({
      id: assignment.id,
      name: assignmentLabel(assignment, session.branches.length),
      logo: ROLE_ICONS[assignment.role],
      plan: session.organization?.name ?? "",
    })) ?? []),
    // Hanux staff can also work as Platform Admin.
    ...(session?.user.isPlatformAdmin ? [PLATFORM_ROLE] : []),
  ];
  const activeRoleId = session?.mode === "platform" ? PLATFORM_ROLE.id : (session?.activeAssignmentId ?? undefined);

  const handleRoleChange = async (role: Role) => {
    if (!role.id) return;
    setSwitching(true);
    try {
      await switchRole(role.id);
      toast.success(`You're now working as ${role.name}`);
      // Platform and org pages don't overlap: go to the start of the new mode.
      navigate(role.id === PLATFORM_ROLE.id ? "/platform" : "/");
    } catch (error) {
      toast.error(isApiError(error) ? error.message : "Couldn't switch role");
    } finally {
      setSwitching(false);
    }
  };

  const visibleNavigation =
    session?.mode === "platform" ? platformNavigation : filterNavigation(navigation, can);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 justify-center">
        <RoleSwitcher
          roles={roles}
          activeRoleId={activeRoleId}
          loading={status === "loading"}
          switching={switching}
          onRoleChange={handleRoleChange}
        />

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
        {visibleNavigation.map((section) => (
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

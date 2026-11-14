import { Link } from "react-router";
import { Check, LogIn } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { appIcons } from "@/configs/icons";
import { cn } from "@/lib/utils";
import { GUEST_ROLE, type Role } from "@/configs/sidebar";

const SIGN_IN_URL = "/auth/sign-in";

type RoleSwitcherProps = {
  /** The signed-in user's roles (from the API). Empty or missing = not signed in → Guest */
  roles?: Role[];
  /** id of the active role (from the session). Defaults to the first role. */
  activeRoleId?: string;
  /** True while the roles are being fetched; shows a placeholder instead of flashing "Guest" */
  loading?: boolean;
  /** True while a switch is in progress; the menu is disabled. */
  switching?: boolean;
  /** Called when the user picks a different role */
  onRoleChange?: (role: Role) => void;
};

function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground",
        className
      )}
    >
      <role.logo className="size-4" />
    </div>
  )
}

export function RoleSwitcher({
  roles = [],
  activeRoleId,
  loading = false,
  switching = false,
  onRoleChange,
}: RoleSwitcherProps) {
  const { isMobile, state } = useSidebar();

  // The active role comes from the session, so it is always what the server enforces.
  const isSignedIn = (roles.length > 0);
  const isCollapsed = state === "collapsed" && !isMobile;
  const activeRole = roles.find((role) => role.id === activeRoleId) ?? roles[0] ?? GUEST_ROLE;

  const selectRole = (role: Role) => {
    if (role.id !== activeRole.id) onRoleChange?.(role);
  }

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex h-10 items-center gap-2.5 px-1" aria-busy="true" aria-label="Loading roles">
            <Skeleton className="size-8 shrink-0 rounded-md" />
            <div className="grid flex-1 gap-1.5 group-data-[collapsible=icon]:hidden">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={switching}
              aria-busy={switching}
              aria-label={`Role: ${activeRole.name}, ${activeRole.plan}. Switch role`}
              className="h-10 gap-2.5 px-1 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <RoleBadge role={activeRole} />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{activeRole.name}</span>
                <span className="truncate text-xs text-muted-foreground">{activeRole.plan}</span>
              </div>
              <appIcons.chevronsUpDown className="ml-auto mr-1 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            // Expanded: as wide as the button. Collapsed: the button is an icon, so use a fixed width
            className={cn("min-w-56 rounded-lg", !isCollapsed && "w-(--radix-dropdown-menu-trigger-width)")}
            align="start"
            side={isMobile ? "bottom" : isCollapsed ? "right" : "bottom"}
            sideOffset={isCollapsed ? 12 : 4}
          >
            {isSignedIn ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {roles.length > 1 ? "Switch role" : "Your role"}
                </DropdownMenuLabel>
                {roles.map((role) => (
                  <RoleItem
                    key={role.id ?? role.name}
                    role={role}
                    active={role === activeRole}
                    onSelect={() => selectRole(role)}
                  />
                ))}
              </>
            ) : (
              // Not signed in: Guest is the only role, so offer the way to get real ones
              <>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  You're browsing as a guest
                </DropdownMenuLabel>
                <RoleItem role={GUEST_ROLE} active onSelect={() => {}} muted />
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer gap-2.5 px-2 py-1">
                  <Link to={SIGN_IN_URL}>
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md border">
                      <LogIn className="size-3.5" />
                    </div>
                    <div className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-sm font-medium">Sign in</span>
                      <span className="truncate text-xs text-muted-foreground">to use your roles</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function RoleItem({
  role,
  active,
  onSelect,
  muted = false,
}: {
  role: Role
  active: boolean
  onSelect: () => void
  muted?: boolean
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className="gap-2.5 px-2 py-1 cursor-pointer ">
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md border",
          active && "border-transparent bg-sidebar-primary text-sidebar-primary-foreground **:text-sidebar-primary-foreground!"
        )}
      >
        <role.logo className="size-3.5" />
      </div>
      <div className="grid min-w-0 flex-1 leading-tight">
        <span className={cn("truncate text-sm font-medium", muted && !active && "text-muted-foreground")}>{role.name}</span>
        <span className="truncate text-xs text-muted-foreground">{role.plan}</span>
      </div>
      {active && <Check className="size-4 text-foreground" aria-label="Current role" />}
    </DropdownMenuItem>
  )
}

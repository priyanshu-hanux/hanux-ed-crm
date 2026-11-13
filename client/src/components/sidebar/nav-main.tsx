import { useRef, useState } from "react"
import { Link, parsePath, useLocation, type Location } from "react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { appIcons } from "@/configs/icons"
import { cn } from "@/lib/utils"
import type { NavLinksProps } from "@/types/app-layout"

type NavItem = NavLinksProps["items"][number]

function isUrlActive(url: string, location: Location, matchSearch: boolean) {
  // "/leads?type=assigned" → pathname "/leads", search "?type=assigned"
  const { pathname = "", search = "" } = parsePath(url)
  const path = pathname.replace(/\/$/, "")
  const pathMatches = location.pathname === path || location.pathname.startsWith(`${path}/`)
  if (!pathMatches || !matchSearch) return pathMatches

  const current = new URLSearchParams(location.search)
  return [...new URLSearchParams(search)].every(([key, value]) => current.get(key) === value)
}

export function NavLinks({ groupTitle, items }: NavLinksProps) {
  const location = useLocation()
  const { state, isMobile } = useSidebar()
  // On mobile the sidebar is a full-width sheet, so it is never really "collapsed"
  const isCollapsed = state === "collapsed" && !isMobile

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{groupTitle}</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const hasSubmenu = (item.items?.length ?? 0) > 1

          if (hasSubmenu) {
            const active = isUrlActive(item.url, location, false)
            return isCollapsed ? (
              <CollapsedGroup key={item.title} item={item} active={active} location={location} />
            ) : (
              <ExpandedGroup key={item.title} item={item} active={active} location={location} />
            )
          }

          // Zero or one child: render a normal link.
          const singleLink = item.items?.[0]
          const url = singleLink?.url ?? item.url

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isUrlActive(url, location, false)} tooltip={item.title}>
                <Link to={url}>
                  {item.icon && <item.icon />}
                  <span>{singleLink ? singleLink.title : item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

type GroupProps = { item: NavItem; active: boolean; location: Location }

// Expanded sidebar: the parent toggles an inline list of sub-links 

function ExpandedGroup({ item, active, location }: GroupProps) {
  return (
    <Collapsible asChild defaultOpen={active || item.isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title} isActive={active}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <appIcons.dropdown className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up">
          <SidebarMenuSub>
            {item.items!.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild isActive={isUrlActive(subItem.url, location, true)}>
                  <Link to={subItem.url} className="flex items-center gap-3">
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

// Collapsed (icon-only) sidebar: there's no room for an inline list, so the parent opens a flyout to its right, styled like the expanded sub-list.
function CollapsedGroup({ item, active, location }: GroupProps) {
  const [open, setOpen] = useState(false)
  // Set when a link is picked, so closing the menu doesn't move focus back to the icon (that focus would re-open the icon's tooltip on top of the new page)
  const pickedLink = useRef(false)

  return (
    <SidebarMenuItem>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={{ children: item.title, hidden: open }}
            isActive={active}
            aria-label={item.title}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={12}
          className="min-w-52 rounded-lg border-sidebar-border bg-sidebar p-2 text-sidebar-foreground"
          onCloseAutoFocus={(event) => {
            if (pickedLink.current) event.preventDefault()
            pickedLink.current = false
          }}
        >
          <DropdownMenuLabel className="flex h-8 items-center gap-2 px-2 py-0 text-xs font-medium text-sidebar-foreground/70 [&>svg]:size-4">
            {item.icon && <item.icon />}
            {item.title}
          </DropdownMenuLabel>

          <div className="mx-3.5 flex flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5">
            {item.items!.map((subItem) => {
              const subActive = isUrlActive(subItem.url, location, true)
              return (
                <DropdownMenuItem
                  key={subItem.title}
                  asChild
                  onSelect={() => (pickedLink.current = true)}
                  className={cn(
                    "cursor-pointer h-7 -translate-x-px gap-2 rounded-md px-2 py-0 text-sm text-sidebar-foreground",
                    "focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
                    subActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  )}
                >
                  <Link to={subItem.url} aria-current={subActive ? "page" : undefined}>
                    {subItem.icon && <subItem.icon />}
                    <span className="truncate">{subItem.title}</span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

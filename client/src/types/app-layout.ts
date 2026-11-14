import type { LucideIcon } from "lucide-react";
import type { Permission } from "@/types/permissions";

export type NavSubItem = {
    title: string
    url: string
    icon?: LucideIcon
    /** Hidden unless the active role has this permission. */
    permission?: Permission
}

export type NavItem = {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    /** Hidden unless the active role has this permission. */
    permission?: Permission
    items?: NavSubItem[]
}

export type NavGroup = {
    groupTitle: string
    items: NavItem[]
}

export type NavLinksProps = NavGroup

/** Removes items (and empty groups) the active role can't use. */
export function filterNavigation(
    groups: NavGroup[],
    can: (permission: Permission) => boolean
): NavGroup[] {
    const allowed = <T extends { permission?: Permission }>(item: T) => !item.permission || can(item.permission);
    return groups
        .map((group) => ({
            ...group,
            items: group.items
                .filter(allowed)
                .map((item) => (item.items ? { ...item, items: item.items.filter(allowed) } : item)),
        }))
        .filter((group) => group.items.length > 0);
}

import type { LucideIcon } from "lucide-react";

type NavSubItem = {
    title: string
    url: string
    icon?: LucideIcon
}

type NavItem = {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: NavSubItem[]
}

export type NavLinksProps = {
    groupTitle: string
    items: NavItem[]
}
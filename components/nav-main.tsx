"use client"

import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onNavigate,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
  }[]
  onNavigate?: (url: string) => boolean
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navegación</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const active = pathname === item.url
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={active}
              >
                {onNavigate ? (
                  <button
                    onClick={() => onNavigate(item.url)}
                    style={{ background: "none", border: "none", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
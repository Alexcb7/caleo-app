"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  onNavigate,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
  }[]
  onNavigate?: (url: string) => boolean
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm" isActive={active}>
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
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
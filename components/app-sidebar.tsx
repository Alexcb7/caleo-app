"use client"

import * as React from "react"
import {
  HomeIcon,
  ShoppingCartIcon,
  ClipboardListIcon,
  BookmarkIcon,
  BotIcon,
  TagIcon,
  SettingsIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Home", url: "/home", icon: HomeIcon },
  { title: "La Compra", url: "/compra", icon: ShoppingCartIcon },
  { title: "Mis Compras", url: "/mis-compras", icon: ClipboardListIcon },
  { title: "Mis Listas", url: "/mis-listas", icon: BookmarkIcon },
  { title: "Chat IA", url: "/chat", icon: BotIcon },
  { title: "Ofertas", url: "/ofertas", icon: TagIcon },
  { title: "Ajustes", url: "/ajustes", icon: SettingsIcon },
]

const data = {
  user: {
    name: "Alex Cortell",
    email: "alex@email.com",
    avatar: "",
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/home">
                <Image
                  src="/images/logo_oscuro.png"
                  alt="Caleo"
                  width={32}
                  height={32}
                  style={{ borderRadius: "6px" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{
                    fontFamily: "Georgia, serif",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    color: "#3D2B1F",
                  }}>
                    Caleo
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#8C7B6B" }}>
                    Tu comparador
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} style={{ color: "#3D2B1F" }}>
                      <item.icon style={{ width: "18px", height: "18px" }} />
                      <span style={{ fontSize: "0.95rem", fontWeight: "500" }}>
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
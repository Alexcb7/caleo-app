"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Home,
  ShoppingCart,
  ClipboardList,
  List,
  Tag,
  Bot,
  Settings,
} from "lucide-react"

const data = {
  user: {
    name: "Usuario",
    email: "usuario@caleo.app",
    avatar: "",
  },
  navMain: [
    { title: "Inicio", url: "/home", icon: Home },
    { title: "La Compra", url: "/compra", icon: ShoppingCart },
    { title: "Mis Compras", url: "/mis-compras", icon: ClipboardList },
    { title: "Mis Listas", url: "/mis-listas", icon: List },
    { title: "Ofertas", url: "/ofertas", icon: Tag },
    { title: "Chat IA", url: "/chat", icon: Bot },
  ],
  navSecondary: [
    { title: "Ajustes", url: "/ajustes", icon: Settings },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <img src="/images/oscuropng.png" alt="Caleo" className="size-8 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold italic" style={{ fontFamily: "Georgia, serif", color: "#B8A06A", fontSize: "1.1rem" }}>Caleo</span>
                  <span className="truncate text-xs opacity-60">Comparador de precios</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
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
  AlertTriangle,
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
  const pathname = usePathname()
  const router = useRouter()
  const [pendingUrl, setPendingUrl] = React.useState<string | null>(null)

  // Returns true if navigation should proceed directly, false if intercepted
  const handleNavigate = (url: string): boolean => {
    if (pathname === "/compra" && url !== "/compra") {
      setPendingUrl(url)
      return false
    }
    router.push(url)
    return true
  }

  const confirmLeave = () => {
    if (pendingUrl) {
      localStorage.removeItem("caleo_prefill_list")
      router.push(pendingUrl)
      setPendingUrl(null)
    }
  }

  const cancelLeave = () => setPendingUrl(null)

  const isOnCompra = pathname === "/compra"

  return (
    <>
      <Sidebar variant="inset" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                {isOnCompra ? (
                  <button
                    onClick={() => handleNavigate("/home")}
                    style={{ background: "none", border: "none", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                      <img src="/images/oscuropng.png" alt="Caleo" className="size-8 object-contain" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold italic" style={{ fontFamily: "Georgia, serif", color: "#B8A06A", fontSize: "1.1rem" }}>Caleo</span>
                      <span className="truncate text-xs opacity-60">Comparador de precios</span>
                    </div>
                  </button>
                ) : (
                  <a href="/home">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                      <img src="/images/oscuropng.png" alt="Caleo" className="size-8 object-contain" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold italic" style={{ fontFamily: "Georgia, serif", color: "#B8A06A", fontSize: "1.1rem" }}>Caleo</span>
                      <span className="truncate text-xs opacity-60">Comparador de precios</span>
                    </div>
                  </a>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} onNavigate={isOnCompra ? handleNavigate : undefined} />
          <NavSecondary items={data.navSecondary} className="mt-auto" onNavigate={isOnCompra ? handleNavigate : undefined} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>

      {/* Modal de confirmación al salir de la compra */}
      {pendingUrl && (
        <div
          onClick={cancelLeave}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(61,43,31,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 20,
              border: "1.5px solid #E8DFD0",
              boxShadow: "0 20px 60px rgba(61,43,31,0.2)",
              padding: "32px 36px", maxWidth: 400, width: "calc(100% - 40px)",
              textAlign: "center",
            }}
          >
            {/* Icono */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(166,61,47,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <AlertTriangle size={26} color="#A63D2F" />
            </div>

            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: "0 0 10px" }}>
              ¿Abandonar la compra?
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 28px", lineHeight: 1.5 }}>
              Si sales ahora perderás el carrito y los productos añadidos. Esta acción no se puede deshacer.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={cancelLeave}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "1.5px solid #E8DFD0", background: "#F5F0E8",
                  color: "#3D2B1F", fontFamily: "system-ui", fontSize: "0.88rem",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Continuar comprando
              </button>
              <button
                onClick={confirmLeave}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 12,
                  border: "none", background: "#A63D2F",
                  color: "white", fontFamily: "system-ui", fontSize: "0.88rem",
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                Sí, abandonar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
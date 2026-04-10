"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { Settings, LogOut, ChevronUp } from "lucide-react"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const router = useRouter()
  const [userData, setUserData] = useState(user)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("user")
    if (stored) {
      const parsed = JSON.parse(stored)
      setUserData({ name: parsed.name || "Usuario", email: parsed.email || "", avatar: "" })
    }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  const initials = userData.name
    ?.split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CA"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div ref={ref} style={{ position: "relative" }}>

          {/* Popup */}
          {open && (
            <div style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: 0,
              right: 0,
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #E8DFD0",
              boxShadow: "0 8px 32px rgba(61,43,31,0.15)",
              overflow: "hidden",
              zIndex: 50,
            }}>
              {/* Cabecera perfil */}
              <div style={{ padding: "16px 18px", background: "#F5F0E8", borderBottom: "1px solid #E8DFD0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%",
                    background: "linear-gradient(135deg, #6B7A3A, #8A9B4A)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, boxShadow: "0 2px 10px rgba(107,122,58,0.35)",
                  }}>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "white", fontFamily: "system-ui" }}>{initials}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userData.name}
                    </p>
                    <p style={{ fontSize: "0.74rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userData.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ padding: "6px" }}>
                <button
                  onClick={() => { router.push("/ajustes"); setOpen(false) }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F5F0E8")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "system-ui", fontSize: "0.87rem", fontWeight: 500, color: "#3D2B1F", transition: "background 0.15s" }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Settings size={14} color="#6B7A3A" />
                  </div>
                  Ajustes
                </button>

                <div style={{ height: 1, background: "#E8DFD0", margin: "4px 6px" }} />

                <button
                  onClick={handleLogout}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(166,61,47,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "transparent", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "system-ui", fontSize: "0.87rem", fontWeight: 500, color: "#A63D2F", transition: "background 0.15s" }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(166,61,47,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <LogOut size={14} color="#A63D2F" />
                  </div>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}

          {/* Botón trigger */}
          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={e => { if (!open) e.currentTarget.style.background = "#F5F0E820" }}
            onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent" }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", cursor: "pointer",
              background: open ? "#F5F0E8" : "transparent",
              border: "1.5px solid",
              borderColor: open ? "#E8DFD0" : "transparent",
              borderRadius: 12, transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg, #6B7A3A, #8A9B4A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 1px 6px rgba(107,122,58,0.3)",
            }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "white", fontFamily: "system-ui" }}>{initials}</span>
            </div>
            <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#8A9B4A", fontFamily: "system-ui", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userData.name}
              </p>
              <p style={{ fontSize: "0.72rem", color: "#6B7A3A", fontFamily: "system-ui", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", opacity: 0.75 }}>
                {userData.email}
              </p>
            </div>
            <ChevronUp
              size={15}
              color="#6B7A3A"
              style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
            />
          </button>

        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

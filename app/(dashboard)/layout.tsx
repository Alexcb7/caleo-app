import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset style={{ minWidth: 0, overflowX: "hidden" }}>
            {/* Barra superior solo en móvil — abre el sidebar */}
            <header
              className="md:hidden flex items-center"
              style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                gap: 12,
                height: 54,
                padding: "0 16px",
                background: "white",
                borderBottom: "1px solid #E8DFD0",
              }}
            >
              <SidebarTrigger />
              <img src="/images/claropng.png" alt="Caleo" style={{ height: 32, width: "auto" }} />
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  )
}
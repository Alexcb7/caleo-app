import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset style={{ backgroundColor: "#F5F0E8", minHeight: "100vh" }}>
        <header style={{
          display: "flex",
          alignItems: "center",
          padding: "0 1.5rem",
          height: "56px",
          borderBottom: "1px solid #E8DFD0",
          backgroundColor: "#F5F0E8",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}>
          <SidebarTrigger />
        </header>
        <main style={{ padding: "2rem" }}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
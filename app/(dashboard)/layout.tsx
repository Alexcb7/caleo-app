import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset style={{ minWidth: 0, overflowX: "hidden" }}>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
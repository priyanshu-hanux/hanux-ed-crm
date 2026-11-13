import { Outlet } from "react-router";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppHeader } from "@/components/header/header";
import { AppSidebar } from "@/components/sidebar/app-sidebar"

export const DashboardLayout = () => {
  return (
    <div className="relative flex h-screen w-full bg-layout overflow-hidden">
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset className="scrollbar-thin overflow-x-hidden">
          <AppHeader />

          <main className="relative flex-1 min-h-0 w-full overflow-auto scroll-thin">
            <div className="flex w-full flex-col gap-4 p-4">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
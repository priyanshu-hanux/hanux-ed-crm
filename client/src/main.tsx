import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from 'react-router';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

import "@/index.css"

import { ThemeProvider } from "@/components/theme/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { router } from "@/routes/routes";
import { NotificationProvider } from "@/contexts/notification-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <NotificationProvider currentRole="sales" currentUserId="demo-user">
            <RouterProvider router={router} />
          </NotificationProvider>
        </TooltipProvider>
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
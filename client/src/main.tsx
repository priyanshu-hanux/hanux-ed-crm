import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from 'react-router';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

import "@/index.css"

import { ThemeProvider } from "@/components/theme/theme-provider";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth-context";
import { queryClient } from "@/lib/query-client";
import { router } from "@/routes/routes";
import { NotificationProvider } from "@/contexts/notification-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </StrictMode>
);
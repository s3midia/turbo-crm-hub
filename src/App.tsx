import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { UserProvider } from "@/contexts/UserContext";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import PipelinePage from "./pages/PipelinePage";
import ContactsPage from "./pages/ContactsPage";
import ProductsPage from "./pages/ProductsPage";
import TasksPage from "./pages/TasksPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
                      <header className="h-14 flex items-center bg-transparent px-4 shrink-0">
                        <SidebarTrigger />
                        <div className="flex-1" />
                      </header>
                      <div className="content-card mb-4 mr-4 flex flex-col min-h-0">
                        <Routes>
                          <Route path="/" element={<div className="p-6 h-full overflow-y-auto"><Index /></div>} />
                          <Route path="/pipeline" element={<div className="p-6 h-full overflow-y-auto"><PipelinePage /></div>} />
                          <Route path="/contacts" element={<div className="p-6 h-full overflow-y-auto"><ContactsPage /></div>} />
                          <Route path="/products" element={<div className="p-6 h-full overflow-y-auto"><ProductsPage /></div>} />
                          <Route path="/tasks" element={<div className="p-6 h-full overflow-y-auto"><TasksPage /></div>} />
                          <Route path="/whatsapp" element={<WhatsAppPage />} />
                          <Route path="*" element={<div className="p-6 h-full overflow-y-auto"><NotFound /></div>} />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

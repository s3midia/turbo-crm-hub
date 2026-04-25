import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { UserProvider } from "@/contexts/UserContext";
import { useFavicon } from "@/hooks/useFavicon";
import { useApplyTheme } from "@/hooks/useApplyTheme";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import PipelinePage from "./pages/PipelinePage";
import PipelineReportPage from "./pages/PipelineReportPage";
import ContactsPage from "./pages/ContactsPage";
import ProductsPage from "./pages/ProductsPage";
import TasksPage from "./pages/TasksPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import AgentsPage from "./pages/AgentsPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import AutomacaoFunilPage from "./pages/AutomacaoFunilPage";
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

const App = () => {
  useFavicon();
  useApplyTheme();

  return (
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
                  <UserProvider>
                    <div className="min-h-screen flex w-full bg-background">
                      {/* Narrow icon-only sidebar */}
                      <AppSidebar />
                      {/* Main content */}
                      <main className="flex-1 flex flex-col min-h-screen max-h-screen overflow-hidden">
                        <div className="content-card mb-4 mr-4 mt-4 flex flex-col min-h-0">
                          <Routes>
                            <Route path="/" element={<div className="p-6 h-full overflow-y-auto"><Index /></div>} />
                            <Route path="/pipeline/relatorio" element={<div className="p-6 h-full overflow-y-auto"><PipelineReportPage /></div>} />
                            <Route path="/pipeline" element={<div className="p-6 h-full overflow-y-auto"><PipelinePage /></div>} />
                            <Route path="/contacts" element={<div className="p-6 h-full overflow-y-auto"><ContactsPage /></div>} />
                            <Route path="/products" element={<div className="p-6 h-full overflow-y-auto"><ProductsPage /></div>} />
                            <Route path="/tasks" element={<div className="p-6 h-full overflow-y-auto"><TasksPage /></div>} />
                            <Route path="/whatsapp" element={<WhatsAppPage />} />
                            <Route path="/agents" element={<div className="p-6 h-full overflow-y-auto"><AgentsPage /></div>} />
                            <Route path="/automacao-funil" element={<div className="p-6 h-full overflow-y-auto"><AutomacaoFunilPage /></div>} />
                            <Route path="/financeiro" element={<div className="p-6 h-full overflow-y-auto"><FinanceiroPage /></div>} />
                            <Route path="/settings" element={<div className="p-6 h-full overflow-y-auto"><SettingsPage /></div>} />
                            <Route path="*" element={<div className="p-6 h-full overflow-y-auto"><NotFound /></div>} />
                          </Routes>
                        </div>
                      </main>
                    </div>
                  </UserProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

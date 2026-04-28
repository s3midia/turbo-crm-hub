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
import RadarLeadsPage from "./pages/RadarLeadsPage";
import CalculadoraPage from "./pages/CalculadoraPage";
import AgendaPage from "./pages/AgendaPage";
import ServicosPage from "./pages/ServicosPage";
import TreinamentoIAPage from "./pages/TreinamentoIAPage";
import AtendimentosPage from "./pages/AtendimentosPage";
import MeuPlanoPage from "./pages/MeuPlanoPage";
import PainelAfiliadoPage from "./pages/PainelAfiliadoPage";
import EquipePage from "./pages/EquipePage";
import PerfilEmpresaPage from "./pages/PerfilEmpresaPage";
import IntegracoesPage from "./pages/IntegracoesPage";
import FunilKanbanPage from "./pages/FunilKanbanPage";
import ModelosDocsPage from "./pages/ModelosDocsPage";
import GeneratorPage from "./pages/GeneratorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      console.log("Verificando sessão inicial...");
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        console.log("Sessão inicial:", currentSession ? "Encontrada" : "Não encontrada");
        
        if (mounted) {
          setSession(currentSession);
          // Only stop loading if we have a session OR there is no hash to process
          if (currentSession || !window.location.hash) {
            setLoading(false);
          } else {
            console.log("Hash detectado, aguardando processamento do Supabase...");
          }
        }
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Evento Auth:", event, currentSession ? "Sessão Ativa" : "Sem Sessão");
      
      if (mounted) {
        setSession(currentSession);
        // If we get a session or a clear sign-out event, we can stop loading
        if (currentSession || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setLoading(false);
        }
      }
    });

    checkSession();

    // Se houver um hash na URL, damos um tempo para o Supabase processar antes de desistir
    let timeoutId: NodeJS.Timeout;
    if (window.location.hash) {
      timeoutId = setTimeout(() => {
        if (mounted && loading) {
          console.log("Timeout de processamento OAuth atingido.");
          setLoading(false);
        }
      }, 10000); // Increase to 10 seconds for safety
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-primary">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <p className="text-sm font-medium">Autenticando...</p>
        </div>
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
                    <div className="h-screen flex w-full bg-background overflow-hidden">
                      {/* Narrow icon-only sidebar */}
                      <AppSidebar />
                      {/* Main content */}
                      <main className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="content-card mb-4 mr-4 mt-4 flex flex-col min-h-0 overflow-hidden">
                          <Routes>
                            {/* Pages that handle their own scrolling and padding */}
                            <Route path="/pipeline" element={<FunilKanbanPage />} />
                            <Route path="/whatsapp" element={<WhatsAppPage />} />
                            <Route path="/atendimentos" element={<WhatsAppPage />} />
                            <Route path="/radar-leads" element={<RadarLeadsPage />} />
                            <Route path="/generator" element={<GeneratorPage />} />
                            
                            {/* Standard pages with padding and scrolling */}
                            <Route path="*" element={
                              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 h-full">
                                <Routes>
                                  <Route path="/" element={<DashboardPage />} />
                                  <Route path="/pipeline/relatorio" element={<PipelineReportPage />} />
                                  <Route path="/contacts" element={<ContactsPage />} />
                                  <Route path="/products" element={<ProductsPage />} />
                                  <Route path="/tasks" element={<TasksPage />} />
                                  <Route path="/agentes-s3" element={<AgentsPage />} />
                                  <Route path="/automacao-funil" element={<AutomacaoFunilPage />} />
                                  <Route path="/calculadora" element={<CalculadoraPage />} />
                                  <Route path="/agenda" element={<AgendaPage />} />
                                  <Route path="/servicos" element={<ServicosPage />} />
                                  <Route path="/treinamento-ia" element={<TreinamentoIAPage />} />
                                  <Route path="/financeiro" element={<FinanceiroPage />} />
                                  <Route path="/meu-plano" element={<MeuPlanoPage />} />
                                  <Route path="/painel-afiliado" element={<PainelAfiliadoPage />} />
                                  <Route path="/equipe" element={<EquipePage />} />
                                  <Route path="/perfil-empresa" element={<PerfilEmpresaPage />} />
                                  <Route path="/integracoes" element={<IntegracoesPage />} />
                                  <Route path="/settings" element={<SettingsPage />} />
                                  <Route path="/modelos-docs" element={<ModelosDocsPage />} />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </div>
                            } />
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

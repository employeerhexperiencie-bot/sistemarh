import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { AuditLogProvider } from "@/contexts/AuditLogContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Lancamentos } from "@/pages/Lancamentos";
import GestaoLancamentos from "@/pages/GestaoLancamentos";
import Faltas from "@/pages/Faltas";
import Holerites from "@/pages/Holerites";
import Relatorios from "@/pages/Relatorios";
import Pendencias from "@/pages/Pendencias";
import PainelLoja from "@/pages/PainelLoja";
import PainelProfissional from "@/pages/PainelProfissional";
import HistoricoProfissional from "@/pages/HistoricoProfissional";
import { CadastroProfissionais } from "@/pages/CadastroProfissionais";
import GestaoASO from "@/pages/GestaoASO";
import GestaoFerias from "@/pages/GestaoFerias";
import GestaoEPI from "@/pages/GestaoEPI";
import GestaoAfastamentos from "@/pages/GestaoAfastamentos";
import GestaoEmprestimos from "@/pages/GestaoEmprestimos";
import GestaoBeneficios from "@/pages/GestaoBeneficios";
import GestaoBeneficiosDetalhado from "@/pages/GestaoBeneficiosDetalhado";
import ReferenciaSistema from "@/pages/ReferenciaSistema";
import SimuladorFolha from "@/pages/SimuladorFolha";
import Configuracoes from "@/pages/Configuracoes";
import { CadastroLojas } from "@/pages/CadastroLojas";
import ImportacaoDados from "@/pages/ImportacaoDados";
import Alertas from "@/pages/Alertas";
import AuditLog from "@/pages/AuditLog";
import AnalisarAtivos from "@/pages/AnalisarAtivos";
import AtualizarAtivos from "@/pages/AtualizarAtivos";
import CarregarDadosAdicionais from "@/pages/CarregarDadosAdicionais";
import ValidacaoDados from "@/pages/ValidacaoDados";
import DashboardAnalitico from "@/pages/DashboardAnalitico";
import MigrarDados from "@/pages/MigrarDados";
import ImportarDadosExcel from "@/pages/ImportarDadosExcel";
import Login from "@/pages/Login";
import SetupInicial from "@/pages/SetupInicial";
import RecuperarSenha from "@/pages/RecuperarSenha";
import RedefinirSenha from "@/pages/RedefinirSenha";
import GestaoUsuarios from "@/pages/GestaoUsuarios";
import Ajuda from "@/pages/Ajuda";
import ComoUsar from "@/pages/ComoUsar";
import Ocorrencias from "@/pages/Ocorrencias";
import NotFound from "./pages/NotFound";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Componente para redirecionar usuários autenticados da página de login
function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Login />;
}

// Componente para setup inicial
function SetupRoute() {
  const { isAuthenticated, isLoading, isFirstUser } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (!isFirstUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <SetupInicial />;
}

// Wrapper para rotas protegidas com Layout
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// Wrapper para rotas EXCLUSIVAS de super_admin
function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute superAdminOnly>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

const App = () => (
  <AuthProvider>
    <AppearanceProvider>
      <AuditLogProvider>
        <OnboardingProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <OnboardingWrapper />
                <Routes>
                  {/* Rotas Públicas */}
                  <Route path="/login" element={<LoginRoute />} />
                  <Route path="/setup" element={<SetupRoute />} />
                  <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                  <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                  
                  {/* Rotas Protegidas */}
                  <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                  <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
                  <Route path="/lancamentos" element={<ProtectedLayout><Lancamentos /></ProtectedLayout>} />
                  <Route path="/gestao-lancamentos" element={<ProtectedLayout><GestaoLancamentos /></ProtectedLayout>} />
                  <Route path="/faltas" element={<ProtectedLayout><Faltas /></ProtectedLayout>} />
                  <Route path="/holerites" element={<ProtectedLayout><Holerites /></ProtectedLayout>} />
                  <Route path="/relatorios" element={<ProtectedLayout><Relatorios /></ProtectedLayout>} />
                  <Route path="/pendencias" element={<ProtectedLayout><Pendencias /></ProtectedLayout>} />
                  <Route path="/ocorrencias" element={<ProtectedLayout><Ocorrencias /></ProtectedLayout>} />
                  <Route path="/painel-loja" element={<ProtectedLayout><PainelLoja /></ProtectedLayout>} />
                  <Route path="/painel-profissional" element={<ProtectedLayout><PainelProfissional /></ProtectedLayout>} />
                  <Route path="/painel-profissional/:id" element={<ProtectedLayout><PainelProfissional /></ProtectedLayout>} />
                  <Route path="/historico-profissional" element={<ProtectedLayout><HistoricoProfissional /></ProtectedLayout>} />
                  <Route path="/cadastro-profissionais" element={<ProtectedLayout><CadastroProfissionais /></ProtectedLayout>} />
                  <Route path="/gestao-aso" element={<ProtectedLayout><GestaoASO /></ProtectedLayout>} />
                  <Route path="/gestao-ferias" element={<ProtectedLayout><GestaoFerias /></ProtectedLayout>} />
                  <Route path="/gestao-epi" element={<ProtectedLayout><GestaoEPI /></ProtectedLayout>} />
                  <Route path="/gestao-afastamentos" element={<ProtectedLayout><GestaoAfastamentos /></ProtectedLayout>} />
                  <Route path="/gestao-emprestimos" element={<ProtectedLayout><GestaoEmprestimos /></ProtectedLayout>} />
                  <Route path="/gestao-beneficios" element={<ProtectedLayout><GestaoBeneficios /></ProtectedLayout>} />
                  <Route path="/gestao-beneficios-detalhado" element={<ProtectedLayout><GestaoBeneficiosDetalhado /></ProtectedLayout>} />
                  <Route path="/referencia-sistema" element={<SuperAdminLayout><ReferenciaSistema /></SuperAdminLayout>} />
                  <Route path="/simulador-folha" element={<ProtectedLayout><SimuladorFolha /></ProtectedLayout>} />
                  <Route path="/configuracoes" element={<ProtectedLayout><Configuracoes /></ProtectedLayout>} />
                  {/* ROTAS EXCLUSIVAS SUPER_ADMIN - Cliente NÃO pode acessar */}
                  <Route path="/gestao-usuarios" element={<SuperAdminLayout><GestaoUsuarios /></SuperAdminLayout>} />
                  <Route path="/audit-log" element={<SuperAdminLayout><AuditLog /></SuperAdminLayout>} />
                  <Route path="/validacao-dados" element={<SuperAdminLayout><ValidacaoDados /></SuperAdminLayout>} />
                  <Route path="/migrar-dados" element={<SuperAdminLayout><MigrarDados /></SuperAdminLayout>} />
                  <Route path="/importar-dados-excel" element={<SuperAdminLayout><ImportarDadosExcel /></SuperAdminLayout>} />
                  <Route path="/importacao-dados" element={<SuperAdminLayout><ImportacaoDados /></SuperAdminLayout>} />
                  <Route path="/analisar-ativos" element={<SuperAdminLayout><AnalisarAtivos /></SuperAdminLayout>} />
                  <Route path="/atualizar-ativos" element={<SuperAdminLayout><AtualizarAtivos /></SuperAdminLayout>} />
                  <Route path="/carregar-dados-adicionais" element={<SuperAdminLayout><CarregarDadosAdicionais /></SuperAdminLayout>} />
                  
                  {/* Rotas normais */}
                  <Route path="/cadastro-lojas" element={<ProtectedLayout><CadastroLojas /></ProtectedLayout>} />
                  <Route path="/alertas" element={<ProtectedLayout><Alertas /></ProtectedLayout>} />
                  <Route path="/dashboard-analitico" element={<ProtectedLayout><DashboardAnalitico /></ProtectedLayout>} />
                  <Route path="/ajuda" element={<ProtectedLayout><Ajuda /></ProtectedLayout>} />
                  <Route path="/como-usar" element={<ProtectedLayout><ComoUsar /></ProtectedLayout>} />
                  
                  {/* Catch-all - Redireciona para 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </OnboardingProvider>
      </AuditLogProvider>
    </AppearanceProvider>
  </AuthProvider>
);

export default App;

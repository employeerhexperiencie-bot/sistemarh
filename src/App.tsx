import { Suspense, lazy } from "react";
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";
import { Loader2 } from "lucide-react";

// Páginas de auth carregadas eagerly (acessadas antes do login)
import Login from "@/pages/Login";
import SetupInicial from "@/pages/SetupInicial";
import RecuperarSenha from "@/pages/RecuperarSenha";
import RedefinirSenha from "@/pages/RedefinirSenha";

// ============================================================
// CODE SPLITTING: páginas carregadas sob demanda (lazy)
// Reduz bundle inicial de ~3.2MB para ~800KB
// ============================================================
const Dashboard = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Lancamentos = lazy(() => import("@/pages/Lancamentos").then(m => ({ default: m.Lancamentos })));
const GestaoLancamentos = lazy(() => import("@/pages/GestaoLancamentos"));
const Faltas = lazy(() => import("@/pages/Faltas"));
const Holerites = lazy(() => import("@/pages/Holerites"));
const Relatorios = lazy(() => import("@/pages/Relatorios"));
const Pendencias = lazy(() => import("@/pages/Pendencias"));
const PainelLoja = lazy(() => import("@/pages/PainelLoja"));
const PainelProfissional = lazy(() => import("@/pages/PainelProfissional"));
const HistoricoProfissional = lazy(() => import("@/pages/HistoricoProfissional"));
const CadastroProfissionais = lazy(() => import("@/pages/CadastroProfissionais").then(m => ({ default: m.CadastroProfissionais })));
const UploadFotosLote = lazy(() => import("@/pages/UploadFotosLote"));
const GestaoASO = lazy(() => import("@/pages/GestaoASO"));
const GestaoFerias = lazy(() => import("@/pages/GestaoFerias"));
const GestaoEPI = lazy(() => import("@/pages/GestaoEPI"));
const GestaoAfastamentos = lazy(() => import("@/pages/GestaoAfastamentos"));
const GestaoEmprestimos = lazy(() => import("@/pages/GestaoEmprestimos"));
const GestaoBeneficios = lazy(() => import("@/pages/GestaoBeneficios"));
const GestaoBeneficiosDetalhado = lazy(() => import("@/pages/GestaoBeneficiosDetalhado"));
const ReferenciaSistema = lazy(() => import("@/pages/ReferenciaSistema"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const CadastroLojas = lazy(() => import("@/pages/CadastroLojas").then(m => ({ default: m.CadastroLojas })));
const ImportacaoDados = lazy(() => import("@/pages/ImportacaoDados"));
const Alertas = lazy(() => import("@/pages/Alertas"));
const AuditLog = lazy(() => import("@/pages/AuditLog"));
const AnalisarAtivos = lazy(() => import("@/pages/AnalisarAtivos"));
const AtualizarAtivos = lazy(() => import("@/pages/AtualizarAtivos"));
const CarregarDadosAdicionais = lazy(() => import("@/pages/CarregarDadosAdicionais"));
const ValidacaoDados = lazy(() => import("@/pages/ValidacaoDados"));
const DashboardAnalitico = lazy(() => import("@/pages/DashboardAnalitico"));
const MigrarDados = lazy(() => import("@/pages/MigrarDados"));
const ImportarDadosExcel = lazy(() => import("@/pages/ImportarDadosExcel"));
const GestaoUsuarios = lazy(() => import("@/pages/GestaoUsuarios"));
const Ajuda = lazy(() => import("@/pages/Ajuda"));
const ComoUsar = lazy(() => import("@/pages/ComoUsar"));
const Ocorrencias = lazy(() => import("@/pages/Ocorrencias"));
const MinhaEquipe = lazy(() => import("@/pages/MinhaEquipe"));
const Fechamentos = lazy(() => import("@/pages/Fechamentos"));
const PainelUso = lazy(() => import("@/pages/PainelUso"));
const CentralImportacao = lazy(() => import("@/pages/CentralImportacao"));
const GestaoPonto = lazy(() => import("@/pages/GestaoPonto"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const ModuloPage = lazy(() => import("@/pages/ModuloPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minuto de cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Fallback de carregamento exibido durante lazy load
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

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
  <ErrorBoundary>
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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Rota Pública - Landing Page */}
                    <Route path="/site" element={<LandingPage />} />
                    
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
                    <Route path="/upload-fotos-lote" element={<ProtectedLayout><UploadFotosLote /></ProtectedLayout>} />
                    <Route path="/gestao-aso" element={<ProtectedLayout><GestaoASO /></ProtectedLayout>} />
                    <Route path="/gestao-ferias" element={<ProtectedLayout><GestaoFerias /></ProtectedLayout>} />
                    <Route path="/gestao-epi" element={<ProtectedLayout><GestaoEPI /></ProtectedLayout>} />
                    <Route path="/gestao-afastamentos" element={<ProtectedLayout><GestaoAfastamentos /></ProtectedLayout>} />
                    <Route path="/gestao-emprestimos" element={<ProtectedLayout><GestaoEmprestimos /></ProtectedLayout>} />
                    <Route path="/gestao-beneficios" element={<ProtectedLayout><GestaoBeneficios /></ProtectedLayout>} />
                    <Route path="/gestao-beneficios-detalhado" element={<ProtectedLayout><GestaoBeneficiosDetalhado /></ProtectedLayout>} />
                    <Route path="/referencia-sistema" element={<SuperAdminLayout><ReferenciaSistema /></SuperAdminLayout>} />
                    <Route path="/simulador-folha" element={<ProtectedLayout><Fechamentos /></ProtectedLayout>} />
                    <Route path="/fechamentos" element={<ProtectedLayout><Fechamentos /></ProtectedLayout>} />
                    <Route path="/configuracoes" element={<ProtectedLayout><Configuracoes /></ProtectedLayout>} />
                    <Route path="/painel-uso" element={<SuperAdminLayout><PainelUso /></SuperAdminLayout>} />
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
                    <Route path="/minha-equipe" element={<ProtectedLayout><MinhaEquipe /></ProtectedLayout>} />
                    <Route path="/central-importacao" element={<ProtectedLayout><CentralImportacao /></ProtectedLayout>} />
                    <Route path="/gestao-ponto" element={<ProtectedLayout><GestaoPonto /></ProtectedLayout>} />
                    <Route path="/marketplace" element={<ProtectedLayout><Marketplace /></ProtectedLayout>} />
                    <Route path="/modulos/:slug" element={<ProtectedLayout><ModuloPage /></ProtectedLayout>} />
                    
                    {/* Catch-all - Redireciona para 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </OnboardingProvider>
      </AuditLogProvider>
    </AppearanceProvider>
  </AuthProvider>
  </ErrorBoundary>
);

export default App;

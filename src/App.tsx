import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppearanceProvider } from "@/contexts/AppearanceContext";
import { AuditLogProvider } from "@/contexts/AuditLogContext";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Lancamentos } from "@/pages/Lancamentos";
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
import GestaoBeneficios from "@/pages/GestaoBeneficios";
import ReferenciaSistema from "@/pages/ReferenciaSistema";
import SimuladorFolha from "@/pages/SimuladorFolha";
import Configuracoes from "@/pages/Configuracoes";
import { CadastroLojas } from "@/pages/CadastroLojas";
import ImportacaoDados from "@/pages/ImportacaoDados";
import Alertas from "@/pages/Alertas";
import AuditLog from "@/pages/AuditLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <AppearanceProvider>
    <AuditLogProvider>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/dashboard" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/lancamentos" element={
            <Layout>
              <Lancamentos />
            </Layout>
          } />
          <Route path="/faltas" element={
            <Layout>
              <Faltas />
            </Layout>
          } />
          <Route path="/holerites" element={
            <Layout>
              <Holerites />
            </Layout>
          } />
          <Route path="/relatorios" element={
            <Layout>
              <Relatorios />
            </Layout>
          } />
          <Route path="/pendencias" element={
            <Layout>
              <Pendencias />
            </Layout>
          } />
          <Route path="/painel-loja" element={
            <Layout>
              <PainelLoja />
            </Layout>
          } />
          <Route path="/painel-profissional" element={
            <Layout>
              <PainelProfissional />
            </Layout>
          } />
          <Route path="/historico-profissional" element={
            <Layout>
              <HistoricoProfissional />
            </Layout>
          } />
          <Route path="/cadastro-profissionais" element={
            <Layout>
              <CadastroProfissionais />
            </Layout>
          } />
          <Route path="/gestao-aso" element={
            <Layout>
              <GestaoASO />
            </Layout>
          } />
          <Route path="/gestao-ferias" element={
            <Layout>
              <GestaoFerias />
            </Layout>
          } />
          <Route path="/gestao-epi" element={
            <Layout>
              <GestaoEPI />
            </Layout>
          } />
          <Route path="/gestao-afastamentos" element={
            <Layout>
              <GestaoAfastamentos />
            </Layout>
          } />
          <Route path="/gestao-beneficios" element={
            <Layout>
              <GestaoBeneficios />
            </Layout>
          } />
          <Route path="/referencia-sistema" element={
            <Layout>
              <ReferenciaSistema />
            </Layout>
          } />
          <Route path="/simulador-folha" element={
            <Layout>
              <SimuladorFolha />
            </Layout>
          } />
          <Route path="/configuracoes" element={
            <Layout>
              <Configuracoes />
            </Layout>
          } />
          <Route path="/cadastro-lojas" element={
            <Layout>
              <CadastroLojas />
            </Layout>
          } />
          <Route path="/importacao-dados" element={
            <Layout>
              <ImportacaoDados />
            </Layout>
          } />
          <Route path="/alertas" element={
            <Layout>
              <Alertas />
            </Layout>
          } />
          <Route path="/audit-log" element={
            <Layout>
              <AuditLog />
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
     </TooltipProvider>
   </QueryClientProvider>
   </AuditLogProvider>
  </AppearanceProvider>
);

export default App;

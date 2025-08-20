import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Lancamentos } from "@/pages/Lancamentos";
import Faltas from "@/pages/Faltas";
import Holerites from "@/pages/Holerites";
import Pendencias from "@/pages/Pendencias";
import PainelLoja from "@/pages/PainelLoja";
import PainelProfissional from "@/pages/PainelProfissional";
import HistoricoProfissional from "@/pages/HistoricoProfissional";
import Configuracoes from "@/pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
          <Route path="/configuracoes" element={
            <Layout>
              <Configuracoes />
            </Layout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

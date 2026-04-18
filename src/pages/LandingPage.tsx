import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, CheckCircle2, Play, Menu, X, Zap, Clock, Shield, Bell, 
  FileText, TrendingUp, LayoutDashboard, Users, Calendar, Stethoscope, 
  Wallet, Gift, Receipt, FileSpreadsheet, ShieldCheck, ChevronDown,
  Phone, Mail, MapPin, Star, MessageCircle, Sparkles, Target, Award,
  AlertTriangle, Calculator, Database, ScanFace, BookOpen, Minus
} from 'lucide-react';

import screenshotDashboard from '@/assets/landing/screenshot-dashboard-real.jpg';
import screenshotCadastro from '@/assets/landing/screenshot-cadastro.jpg';
import screenshotFolha from '@/assets/landing/screenshot-folha.jpg';
import screenshotBeneficios from '@/assets/landing/screenshot-beneficios.jpg';
import heroTeam from '@/assets/landing/hero-team.jpg';
import heroRhPonto from '@/assets/landing/hero-rh-ponto.jpg';
import heroFacialPoint from '@/assets/landing/hero-facial-point.jpg';
import clientsTeam from '@/assets/landing/clients-team.jpg';
import problemStress from '@/assets/landing/problem-stress.jpg';
import solutionEasy from '@/assets/landing/solution-easy.jpg';
import supportCall from '@/assets/landing/support-call.jpg';
import teamSuccess from '@/assets/landing/team-success.jpg';

// ============ CONSTANTS ============
const WHATSAPP_NUMBER = '5511953340284';
const WHATSAPP_MESSAGE = encodeURIComponent('Olá! 👋 Vim pelo site do Sistema RH (eazdev.com) e quero saber como pode ajudar minha empresa.');
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const openWhatsApp = () => window.open(WHATSAPP_URL, '_blank');

// ============ HEADER ============
function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">RH</span>
            </div>
            <span className="text-foreground font-semibold text-lg">Sistema RH</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '#dores', label: 'Por que mudar' },
              { href: '#solucao', label: 'A solução' },
              { href: '#modulos', label: 'O que faz' },
              { href: '#diferencial', label: 'Diferenciais' },
              { href: '#faq', label: 'Dúvidas' },
            ].map(link => (
              <a key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/login'}>
              Entrar
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={openWhatsApp}>
              <MessageCircle className="w-4 h-4" />
              Falar com especialista
            </Button>
          </div>

          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {[
                { href: '#dores', label: 'Por que mudar' },
                { href: '#solucao', label: 'A solução' },
                { href: '#modulos', label: 'O que faz' },
                { href: '#diferencial', label: 'Diferenciais' },
                { href: '#faq', label: 'Dúvidas' },
              ].map(link => (
                <a key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground text-sm py-2"
                  onClick={() => setIsMenuOpen(false)}>
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" size="sm" className="justify-start"
                  onClick={() => window.location.href = '/login'}>
                  Entrar
                </Button>
                <Button size="sm" className="gap-2" onClick={openWhatsApp}>
                  <MessageCircle className="w-4 h-4" />
                  Falar com especialista
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// ============ HERO ============
function Hero() {
  const benefits = [
    "Ponto facial + folha + diário operacional integrados",
    "Cálculo Dia 20 e Dia 5 automático, sem erro de CLT",
    "Alertas de ASO, férias e jornada antes de virar problema"
  ];

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-foreground text-white">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroFacialPoint} alt="" className="w-full h-full object-cover opacity-25" loading="eager" decoding="async" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/95 to-foreground/70" />
      </div>

      {/* Floating orbs (Factorial style) */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-success/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary-glow" />
              <span className="text-sm text-white">
                <strong className="text-primary-glow">RH + Ponto Facial + Diário Operacional</strong> em um só sistema
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05]">
              Toda a gestão de pessoas da sua empresa{" "}
              <span className="bg-gradient-to-r from-primary-glow to-success bg-clip-text text-transparent">em um só sistema.</span>
            </h1>

            <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-xl">
              Substitua planilhas, Diário e Ponto, controle de jornada e folha por uma plataforma moderna 
              feita para o varejo brasileiro. Pague menos, ganhe mais tempo.
            </p>

            <ul className="mt-8 space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-glow shrink-0" />
                  <span className="text-white/90">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-14 text-base shadow-glow"
                onClick={openWhatsApp}>
                <MessageCircle className="w-5 h-5" />
                Quero uma demonstração
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-14 text-base border-white/30 text-white hover:bg-white/10 bg-transparent"
                onClick={openWhatsApp}>
                <Phone className="w-5 h-5" />
                Chamar no WhatsApp
              </Button>
            </div>

            {/* Mini ratings row */}
            <div className="mt-8 flex flex-wrap items-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-primary-glow text-primary-glow" />)}
                </div>
                <span><strong className="text-white">4.9/5</strong> avaliação dos clientes</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-white/20" />
              <span>🔒 Dados isolados · ⚡ Setup em 24h</span>
            </div>
          </div>

          {/* Product Mockup with floating cards */}
          <div className="relative lg:scale-105">
            <div className="bg-card rounded-2xl border border-white/20 p-2 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
              <img 
                src={screenshotDashboard} 
                alt="Dashboard do Sistema RH" 
                className="w-full h-auto rounded-xl"
                width={1280}
                height={800}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {/* Floating card 1: Ponto Facial */}
            <div className="absolute -left-6 top-12 bg-card rounded-xl border border-border px-4 py-3 shadow-2xl animate-fade-in max-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <ScanFace className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ponto facial</p>
                  <p className="text-sm font-semibold text-foreground">Maria registrou 08:02</p>
                </div>
              </div>
            </div>

            {/* Floating card 2: Folha */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-card rounded-xl border border-border px-4 py-3 shadow-2xl animate-fade-in max-w-[220px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Folha calculada</p>
                  <p className="text-sm font-semibold text-foreground">R$ 142.380 · 0 erros</p>
                </div>
              </div>
            </div>

            {/* Floating card 3: Alerta */}
            <div className="absolute -left-4 bottom-8 bg-card rounded-xl border border-border px-4 py-3 shadow-2xl animate-fade-in max-w-[200px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alerta automático</p>
                  <p className="text-sm font-semibold text-foreground">3 ASOs em 7 dias</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ SOCIAL PROOF (logos + ratings strip) ============
function SocialProof() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider">
          Empresas que pararam de perder tempo com planilhas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
          {[
            { name: 'Tennessee Steak House', initials: 'TSH' },
            { name: 'Tennessee Prime', initials: 'TP' },
            { name: 'Rede Varejo', initials: 'RV' },
            { name: 'Comércio Brasil', initials: 'CB' },
            { name: 'Lojas Unidas', initials: 'LU' },
            { name: 'Grupo Multi', initials: 'GM' },
          ].map((c, i) => (
            <div key={i} className="flex flex-col items-center justify-center px-3 py-4 rounded-lg bg-background border border-border opacity-80 hover:opacity-100 hover:border-primary/30 transition-all">
              <span className="font-bold text-foreground text-base tracking-wider">{c.initials}</span>
              <span className="mt-1 text-[10px] text-muted-foreground text-center leading-tight">{c.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { value: '4.9/5', label: 'avaliação dos clientes' },
            { value: '+278', label: 'profissionais gerenciados' },
            { value: '99.9%', label: 'uptime garantido' },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-background border border-border">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ COMPARISON TABLE (vs concorrentes) ============
function Comparison() {
  const features = [
    { label: 'Ponto facial integrado', us: true, concorrentes: 'avulso', planilha: false },
    { label: 'Folha de pagamento CLT', us: true, concorrentes: 'limitado', planilha: false },
    { label: 'Cálculo Dia 20 + Dia 5', us: true, concorrentes: false, planilha: false },
    { label: 'Diário operacional', us: true, concorrentes: 'limitado', planilha: false },
    { label: '11 tipos de benefícios', us: true, concorrentes: 'parcial', planilha: false },
    { label: 'Empréstimos CLT + Loja', us: true, concorrentes: false, planilha: false },
    { label: 'Multi-loja com isolamento', us: true, concorrentes: 'parcial', planilha: false },
    { label: 'Alertas de ASO/Férias', us: true, concorrentes: 'parcial', planilha: false },
    { label: 'Suporte humano por WhatsApp', us: true, concorrentes: false, planilha: false },
  ];

  const renderCell = (val: boolean | string) => {
    if (val === true) return <CheckCircle2 className="w-5 h-5 text-success mx-auto" />;
    if (val === false) return <X className="w-5 h-5 text-destructive mx-auto" />;
    return <span className="text-xs text-warning font-medium">{val}</span>;
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-card">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Compare e decida</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Por que escolher o Sistema RH?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Substitua 3 ferramentas diferentes (e o caos das planilhas) por uma única solução integrada.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-premium">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left px-6 py-5 text-sm font-semibold text-muted-foreground">Funcionalidade</th>
                <th className="px-4 py-5 text-center min-w-[140px]">
                  <div className="inline-flex flex-col items-center">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-2 shadow-glow">
                      <span className="text-white font-bold text-xs">RH</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">Sistema RH</span>
                    <span className="text-[10px] text-primary">RECOMENDADO</span>
                  </div>
                </th>
                <th className="px-4 py-5 text-center min-w-[120px]">
                  <span className="text-sm font-medium text-muted-foreground">Outros<br/>sistemas RH</span>
                </th>
                <th className="px-4 py-5 text-center min-w-[120px]">
                  <span className="text-sm font-medium text-muted-foreground">Planilhas<br/>Excel</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-background/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground">{f.label}</td>
                  <td className="px-4 py-4 text-center bg-primary/5">{renderCell(f.us)}</td>
                  <td className="px-4 py-4 text-center">{renderCell(f.concorrentes)}</td>
                  <td className="px-4 py-4 text-center">{renderCell(f.planilha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 text-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 gap-2 px-8 h-14" onClick={openWhatsApp}>
            <MessageCircle className="w-5 h-5" />
            Quero migrar para o Sistema RH
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============ PROBLEMS / DORES ============
function Problems() {
  const problems = [
    {
      icon: Clock,
      title: "Você perde 3 dias inteiros por mês fechando folha",
      description: "Planilhas travando, fórmulas quebrando, conferência manual. E quando termina, ainda precisa começar a do mês seguinte."
    },
    {
      icon: AlertTriangle,
      title: "Tem medo de uma multa do eSocial bater na sua porta",
      description: "Um cálculo errado de INSS, IRRF ou férias pode custar mais que um ano de sistema. E você está apostando todo mês."
    },
    {
      icon: Database,
      title: "Cada loja tem o RH de um jeito diferente",
      description: "Uma loja usa caderno, outra usa planilha, outra mensagem no WhatsApp. Quando precisa consolidar, é um inferno."
    },
    {
      icon: Bell,
      title: "Você descobre que o ASO venceu... depois que venceu",
      description: "Sem alerta, sem controle. O fiscal chega, pede o documento e você não tem. Multa garantida."
    }
  ];

  return (
    <section id="dores" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-destructive font-medium uppercase tracking-wider">A dor real do RH</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Você está perdendo dinheiro todo mês — e nem percebe
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Se você se reconhece em qualquer uma dessas situações, está na hora de parar.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img src={problemStress} alt="Profissional estressada com planilhas" className="w-full h-auto object-cover" loading="lazy" width={1280} height={800} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-4">A conta que ninguém faz</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              60 horas por mês em planilhas = <strong className="text-foreground">720 horas perdidas por ano</strong>. Sem contar o risco de multa.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-2xl font-bold text-destructive">R$ 38mil</p>
                <p className="text-xs text-muted-foreground mt-1">multa média do eSocial por erro</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-2xl font-bold text-destructive">72%</p>
                <p className="text-xs text-muted-foreground mt-1">das empresas erram em planilhas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((problem, i) => (
            <div key={i} className="p-8 rounded-2xl bg-background border border-border hover:border-destructive/30 transition-colors flex gap-5">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <problem.icon className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{problem.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{problem.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ STATS ============
function StatsImpact() {
  const stats = [
    { value: "95%", label: "menos tempo gasto com folha" },
    { value: "0", label: "erros de cálculo (motor com 145 testes)" },
    { value: "+2.000", label: "profissionais por empresa" },
    { value: "24h", label: "para começar a usar" }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-white relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroTeam} alt="" className="w-full h-full object-cover opacity-10" loading="lazy" decoding="async" aria-hidden="true" />
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl sm:text-5xl font-bold">{stat.value}</p>
              <p className="mt-2 text-sm text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FEATURES / SOLUCAO ============
function Features() {
  const features = [
    { icon: Zap, title: "Folha pronta em minutos", description: "Motor validado com 145 testes. Você só confere e aprova.", highlight: "De 3 dias para 5 minutos" },
    { icon: Bell, title: "Alertas que te salvam", description: "ASO, férias, vencimentos. Avisos antes de virar problema.", highlight: "Zero surpresa fiscal" },
    { icon: Clock, title: "Sobra tempo pra estratégia", description: "Pare de apagar incêndio. Foque em desenvolver pessoas.", highlight: "+60h livres/mês" },
    { icon: Shield, title: "Dados isolados por empresa", description: "Cada loja vê só o que precisa. Auditoria completa.", highlight: "Segurança bancária" },
    { icon: FileText, title: "Histórico de tudo", description: "Quem mudou, quando e por quê. Pronto para a Receita.", highlight: "Compliance total" },
    { icon: TrendingUp, title: "Cresce com você", description: "De 10 a 2.000+ profissionais sem travar.", highlight: "Sem limite real" },
  ];

  return (
    <section id="solucao" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
              <img src={screenshotFolha} alt="Folha de Pagamento do Sistema RH" className="w-full h-auto" loading="lazy" width={1280} height={800} />
            </div>
            <div className="absolute -bottom-4 -right-4 p-4 rounded-xl bg-primary text-white shadow-lg">
              <div className="text-center">
                <p className="text-3xl font-bold">95%</p>
                <p className="text-xs opacity-90">menos tempo gasto</p>
              </div>
            </div>
          </div>

           <div>
            <span className="text-sm text-primary font-medium uppercase tracking-wider">A solução definitiva</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
              Imagine seu RH funcionando enquanto você dorme
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              O Sistema RH executa o trabalho pesado por você: cálculos, alertas, relatórios, holerites. 
              Você só revisa, aprova e ganha tempo para o que realmente importa: as pessoas.
            </p>

            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              {[
                { icon: Shield, label: 'Dados isolados por empresa' },
                { icon: CheckCircle2, label: '145 testes automatizados' },
                { icon: Clock, label: 'Suporte humano em minutos' },
                { icon: Award, label: 'Cálculo CLT validado' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <item.icon className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {feature.highlight}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ DIFERENCIAL ============
function Differentiators() {
  const diffs = [
    {
      icon: Calculator,
      title: "Pagamento Split (Dia 20 + Dia 5)",
      description: "Único no Brasil que calcula o adiantamento Dia 20 (40%) + saldo Dia 5 (60%) nativamente.",
      market: "Concorrentes não têm"
    },
    {
      icon: Wallet,
      title: "Empréstimos CLT + Loja",
      description: "Consignados e empréstimos da loja com parcelas, saldos e auditoria.",
      market: "Concorrentes não têm"
    },
    {
      icon: Gift,
      title: "11 Tipos de Benefícios",
      description: "VT, VR, VA, Cesta, Odonto, Seguro de Vida, Vale Carne e mais — com elegibilidade automática.",
      market: "Comuns têm 3-4"
    },
    {
      icon: Award,
      title: "Motor de Cálculo Validado",
      description: "145 testes cobrindo INSS, IRRF, faltas, férias, 13º. Zero margem para erro.",
      market: "Padrão de auditoria"
    },
    {
      icon: ShieldCheck,
      title: "Multi-loja com Isolamento",
      description: "Cada filial é independente. Consolidação automática para o administrador.",
      market: "Diferencial real"
    },
    {
      icon: Target,
      title: "White-label Pronto",
      description: "Logo, cores e identidade da sua empresa. Seu time acessa com a sua marca.",
      market: "Único no segmento"
    }
  ];

  return (
    <section id="diferencial" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Diferencial de mercado</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            O que nos torna únicos no Brasil
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Construído com base nas dores reais de varejo, comércio e redes de loja.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diffs.map((d, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-premium transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <d.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {d.market}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{d.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ MODULES ============
function Modules() {
  const modules = [
    { icon: LayoutDashboard, name: "Painel Executivo", description: "KPIs em tempo real" },
    { icon: Users, name: "Cadastro 360°", description: "Tudo do colaborador" },
    { icon: Calendar, name: "Férias e Folgas", description: "Período aquisitivo automático" },
    { icon: Stethoscope, name: "Exames ASO", description: "Alertas antes de vencer" },
    { icon: Wallet, name: "Empréstimos", description: "CLT e direto da loja" },
    { icon: Gift, name: "11 Benefícios", description: "VT, VR, cesta e mais" },
    { icon: Receipt, name: "Holerites PDF", description: "Em lote ou individual" },
    { icon: FileSpreadsheet, name: "Relatórios", description: "Prontos para auditoria" },
    { icon: Bell, name: "Central de Alertas", description: "Você sabe antes" },
    { icon: ShieldCheck, name: "Auditoria Total", description: "Quem fez o quê" },
  ];

  return (
    <section id="modulos" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Tudo em um só sistema</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Pare de pular de planilha em planilha
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Mais de 40 módulos integrados. Tudo que seu RH precisa, em um só lugar.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {modules.map((mod, index) => (
            <div key={index} className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all text-center group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <mod.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">{mod.name}</h3>
              <p className="text-xs text-muted-foreground">{mod.description}</p>
            </div>
          ))}
        </div>

        {/* Screenshots Gallery */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <div className="rounded-2xl overflow-hidden border border-border shadow-premium">
            <img src={screenshotCadastro} alt="Cadastro de Profissionais" className="w-full h-auto" loading="lazy" width={1280} height={800} />
            <div className="p-4 bg-card">
              <p className="font-medium text-foreground">Cadastro 360° do Colaborador</p>
              <p className="text-sm text-muted-foreground">10 abas integradas: dados, documentos, benefícios, ASO, EPI e mais.</p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border shadow-premium">
            <img src={screenshotBeneficios} alt="Gestão de Benefícios" className="w-full h-auto" loading="lazy" width={1280} height={800} />
            <div className="p-4 bg-card">
              <p className="font-medium text-foreground">Gestão de 11 Benefícios</p>
              <p className="text-sm text-muted-foreground">Elegibilidade automática, descontos e relatórios consolidados.</p>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-muted-foreground">
          E muito mais: EPI, pensão alimentícia, vales, 13º, importação Excel...
        </p>
      </div>
    </section>
  );
}

// ============ COMMITMENTS (substitui depoimentos por compromissos reais) ============
function Commitments() {
  const commitments = [
    {
      icon: Shield,
      title: "Seus dados, blindados",
      description: "Cada empresa em ambiente isolado. Ninguém vê o que é seu — nem nossa equipe.",
      proof: "Isolamento RLS em 38 tabelas",
    },
    {
      icon: CheckCircle2,
      title: "Cálculo conferido",
      description: "Motor CLT auditado: INSS, IRRF, FGTS, 13º e férias dentro da legislação.",
      proof: "145/145 testes aprovados",
    },
    {
      icon: MessageCircle,
      title: "Atendimento humano",
      description: "Você fala com gente que entende de RH. WhatsApp direto, resposta em minutos.",
      proof: "Sem bot · Sem fila",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Nossos compromissos com você</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Confiança não se promete. Se entrega.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Em vez de depoimentos, mostramos o que você pode esperar — e cobrar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commitments.map((c, i) => (
            <div key={i} className="p-7 rounded-2xl bg-background border border-border hover:border-primary/40 hover:shadow-card-hover transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <c.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{c.description}</p>
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{c.proof}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 text-center">
          <p className="text-lg text-foreground leading-relaxed">
            <strong className="text-primary">Garantia de 30 dias:</strong> se não fizer sentido pra sua operação, devolvemos seu investimento. Simples assim.
          </p>
          <Button size="lg" className="mt-6 gap-2 bg-primary hover:bg-primary/90" onClick={openWhatsApp}>
            <MessageCircle className="w-5 h-5" />
            Conversar sem compromisso
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============ HOW IT WORKS ============
function HowItWorks() {
  const steps = [
    { step: "1", title: "Você nos chama no WhatsApp", description: "Conta seu cenário em 10 minutos." },
    { step: "2", title: "Importamos seus dados", description: "Suas planilhas viram sistema. Sem trabalho pra você." },
    { step: "3", title: "Em 24h você está rodando", description: "Treinamento incluso e suporte por WhatsApp." },
  ];

  return (
    <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <span className="text-sm text-primary font-medium uppercase tracking-wider">Simples assim</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
              Três passos e pronto
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Sem migração complicada. A gente cuida de tudo pra você começar amanhã.
            </p>
            <Button size="lg" className="mt-6 gap-2 bg-primary hover:bg-primary/90"
              onClick={openWhatsApp}>
              <MessageCircle className="w-5 h-5" />
              Começar agora pelo WhatsApp
            </Button>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img src={supportCall} alt="Suporte dedicado" className="w-full h-auto object-cover" loading="lazy" width={1280} height={800} />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-glow">
                {s.step}
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FAQ ============
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "Quanto custa o sistema?", a: "Depende do tamanho da sua operação. Chame no WhatsApp e em 10 minutos montamos uma proposta sob medida." },
    { q: "Meus dados ficam seguros?", a: "Sim. Criptografia de nível bancário, isolamento total entre empresas e auditoria completa." },
    { q: "Como vocês importam meus dados?", a: "Você envia suas planilhas e nossa equipe técnica faz toda a importação e validação." },
    { q: "Posso cancelar quando quiser?", a: "Sim, sem multa, sem fidelidade. Garantia de 30 dias com devolução do investimento." },
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Dúvidas frequentes</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Perguntas que sempre nos fazem
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-colors"
              >
                <span className="font-medium text-foreground">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center">
          <p className="text-foreground font-medium mb-3">Ficou com alguma outra dúvida?</p>
          <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" onClick={openWhatsApp}>
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============ CTA ============
function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={teamSuccess} alt="" className="w-full h-full object-cover opacity-15" loading="lazy" decoding="async" aria-hidden="true" />
      </div>
      <div className="max-w-3xl mx-auto text-center relative">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Chega de perder tempo e dinheiro com planilha
        </h2>
        <p className="text-white/90 text-lg mb-8 leading-relaxed">
          Em 10 minutos no WhatsApp você descobre se o sistema resolve a sua dor. Sem compromisso.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 px-8 h-14 text-base font-semibold"
            onClick={openWhatsApp}>
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp agora
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 text-base bg-transparent gap-2"
            onClick={openWhatsApp}>
            <Phone className="w-5 h-5" />
            Falar com especialista
          </Button>
        </div>
        <p className="text-white/70 text-sm mt-6">
          📱 Atendimento direto no WhatsApp · ⚡ Resposta em minutos · 🔒 Sigilo garantido
        </p>
      </div>
    </section>
  );
}

// ============ FLOATING WHATSAPP BUTTON ============
function FloatingWhatsApp() {
  return (
    <button
      onClick={openWhatsApp}
      className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-success hover:bg-success/90 shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
      aria-label="Falar no WhatsApp"
    >
      <MessageCircle className="w-7 h-7 text-white" />
      <span className="absolute right-full mr-3 bg-foreground text-background text-sm px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Fale conosco
      </span>
    </button>
  );
}

// ============ FOOTER ============
function LandingFooter() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-foreground text-white/70">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">RH</span>
              </div>
              <span className="text-white font-semibold text-lg">Sistema RH</span>
            </div>
            <p className="text-sm leading-relaxed">
              Sistema completo de gestão de RH, folha de pagamento, benefícios e compliance. Feito para o varejo brasileiro.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Sistema</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#solucao" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">Módulos</a></li>
              <li><a href="#diferencial" className="hover:text-white transition-colors">Diferenciais</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Suporte</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tutoriais</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Fale conosco</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button onClick={openWhatsApp} className="flex items-center gap-2 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                </button>
              </li>
              <li>
                <button onClick={openWhatsApp} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" /> Solicitar contato
                </button>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Atendimento em todo o Brasil
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm">
          <p>© {new Date().getFullYear()} Sistema RH. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

// ============ MAIN PAGE ============
export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingHeader />
      <Hero />
      <SocialProof />
      <Problems />
      <StatsImpact />
      <Features />
      <Comparison />
      <Differentiators />
      <Modules />
      <Commitments />
      <HowItWorks />
      <FAQ />
      <CTA />
      <LandingFooter />
      <FloatingWhatsApp />
    </main>
  );
}

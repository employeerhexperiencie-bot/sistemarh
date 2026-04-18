import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, CheckCircle2, Menu, X, Zap, Shield, Bell,
  ChevronDown, MessageCircle, Sparkles, Calculator, ScanFace,
  Users, Calendar, Stethoscope, Wallet, Gift, Receipt,
  FileSpreadsheet, LayoutDashboard, ShieldCheck, TrendingUp,
  Clock, Phone, MapPin, Layers, Workflow, Database,
} from 'lucide-react';

import {
  DashboardMockup, FolhaMockup, CadastroMockup, BeneficiosMockup,
} from '@/components/landing/SystemMockup';

import gestoraRH from '@/assets/landing-gestora-rh.jpg';
import equipeVarejo from '@/assets/landing-equipe-varejo.jpg';
import suporteHumano from '@/assets/landing-suporte-humano.jpg';
import empresariaAliviada from '@/assets/landing-empresaria-aliviada.jpg';

// ============ CONSTANTS ============
const WHATSAPP_NUMBER = '5511953340284';
const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! 👋 Vim pelo site do Sistema RH (eazdev.com) e quero saber como pode ajudar minha empresa.'
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;
const openWhatsApp = () => window.open(WHATSAPP_URL, '_blank');

const NAV_LINKS = [
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#diferencial', label: 'Diferenciais' },
  { href: '#como', label: 'Como funciona' },
  { href: '#faq', label: 'FAQ' },
];

// ============ HEADER ============
function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/70 backdrop-blur-xl border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">RH</span>
              </div>
              <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md -z-10" />
            </div>
            <span className="text-foreground font-semibold text-[15px] tracking-tight">
              Sistema RH
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted text-sm"
              onClick={() => (window.location.href = '/login')}
            >
              Entrar
            </Button>
            <Button
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90 gap-2 h-9 text-sm font-medium"
              onClick={openWhatsApp}
            >
              Falar com vendas
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <button
            className="md:hidden text-foreground p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-sm py-2 px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-border">
                <Button variant="ghost" size="sm" className="justify-start"
                  onClick={() => (window.location.href = '/login')}>
                  Entrar
                </Button>
                <Button size="sm" className="gap-2 bg-foreground text-background" onClick={openWhatsApp}>
                  Falar com vendas <ArrowRight className="w-3.5 h-3.5" />
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
  return (
    <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 landing-grid-bg pointer-events-none" />
      {/* Top glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[90vw] sm:w-[80vw] h-[400px] sm:h-[600px] bg-primary/20 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Announcement pill */}
        <div className="flex justify-center mb-6 sm:mb-8 landing-rise px-2">
          <a
            href="#plataforma"
            className="group inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full landing-glass text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors max-w-full"
          >
            <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium shrink-0">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Novo
            </span>
            <span className="truncate">Ponto facial + Folha + Diário em uma plataforma</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </a>
        </div>

        {/* Headline */}
        <h1 className="text-center text-[2.25rem] leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight sm:leading-[1.02] landing-rise px-2" style={{ animationDelay: '60ms' }}>
          Toda a gestão de RH<br />
          <span className="landing-text-gradient">em um único sistema.</span>
        </h1>

        <p className="mt-5 sm:mt-7 text-center text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed landing-rise px-2" style={{ animationDelay: '120ms' }}>
          Pare de orquestrar 5 ferramentas diferentes. Folha, ponto facial,
          benefícios, ASO, férias e diário operacional —{' '}
          <span className="text-foreground">conversando entre si, em tempo real.</span>
        </p>

        {/* CTAs */}
        <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row gap-3 justify-center landing-rise px-2" style={{ animationDelay: '180ms' }}>
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 gap-2 h-12 px-6 text-[15px] font-medium w-full sm:w-auto"
            onClick={openWhatsApp}
          >
            <MessageCircle className="w-4 h-4" />
            Agendar demonstração
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 h-12 px-6 text-[15px] border-border bg-card hover:bg-muted text-foreground w-full sm:w-auto"
            onClick={() => document.getElementById('plataforma')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver a plataforma
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Trust line */}
        <p className="mt-5 sm:mt-6 text-center text-[11px] sm:text-xs text-muted-foreground landing-rise px-2" style={{ animationDelay: '240ms' }}>
          Setup em 24h · Sem cartão · Suporte humano no WhatsApp
        </p>

        {/* Live mockup */}
        <div className="mt-10 sm:mt-16 relative landing-rise" style={{ animationDelay: '320ms' }}>
          <LiveMockupCarousel />
        </div>
      </div>
    </section>
  );
}

// ============ LIVE MOCKUP (cross-fading screens, "system in use") ============
function LiveMockupCarousel() {
  const screens = [DashboardMockup, FolhaMockup, CadastroMockup, BeneficiosMockup];
  const labels = ['Painel', 'Folha', 'Cadastro', 'Benefícios'];

  return (
    <div className="relative">
      {/* Outer glow */}
      <div className="absolute inset-x-10 -top-6 h-40 bg-primary/30 blur-[80px] pointer-events-none" />

      {/* Browser-style frame */}
      <div className="relative landing-border-gradient rounded-2xl overflow-hidden bg-card">
        {/* Browser chrome */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card/80">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-destructive/70" />
            <span className="w-3 h-3 rounded-full bg-warning/70" />
            <span className="w-3 h-3 rounded-full bg-success/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-[11px] text-muted-foreground">
              <Shield className="w-3 h-3 text-success" />
              app.eazdev.com
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            ao vivo
          </div>
        </div>

        {/* Stack of mockups, cross-fading */}
        <div className="relative aspect-[4/3] sm:aspect-[16/10]" style={{ background: 'hsl(220 16% 96%)' }}>
          {screens.map((Screen, i) => (
            <div
              key={i}
              className="landing-mockup-frame"
              style={{ animationDelay: `${i * 4}s`, animationDuration: '16s' }}
            >
              <div className="absolute inset-0 p-2 sm:p-4">
                <div className="w-full h-full rounded-lg sm:rounded-xl overflow-hidden">
                  <Screen />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating stat cards */}
      <FloatingStat
        className="absolute -left-2 sm:-left-8 top-24 hidden sm:flex"
        icon={ScanFace}
        accent="success"
        title="Ponto facial"
        value="Maria registrou 08:02"
      />
      <FloatingStat
        className="absolute -right-2 sm:-right-8 top-1/2 -translate-y-1/2 hidden sm:flex"
        icon={Calculator}
        accent="primary"
        title="Folha calculada"
        value="R$ 142.380 · 0 erros"
      />
      <FloatingStat
        className="absolute -left-2 sm:-left-8 bottom-12 hidden sm:flex"
        icon={Bell}
        accent="warning"
        title="Alerta automático"
        value="3 ASOs em 7 dias"
      />

      {/* Screen indicator */}
      <div className="mt-6 flex justify-center gap-2">
        {labels.map((l, i) => (
          <span
            key={l}
            className="text-[11px] text-muted-foreground/70 px-2.5 py-1 rounded-full border border-border bg-card/50"
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function FloatingStat({
  className = '',
  icon: Icon,
  accent,
  title,
  value,
}: {
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'primary' | 'success' | 'warning';
  title: string;
  value: string;
}) {
  const accentMap = {
    primary: 'text-primary bg-primary/15',
    success: 'text-success bg-success/15',
    warning: 'text-warning bg-warning/15',
  };
  return (
    <div className={`landing-glass rounded-xl px-3.5 py-2.5 max-w-[210px] landing-float ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accentMap[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-xs font-medium text-foreground truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============ LOGO TICKER ============
function LogoTicker() {
  const items = [
    'Folha CLT', 'Ponto Facial', 'eSocial', 'Benefícios',
    '13º + Férias', 'ASO', 'Holerites PDF', 'Empréstimos',
    'Multi-loja', 'Auditoria', 'Importação Excel', 'White-label',
  ];
  // duplicate for seamless loop
  const loop = [...items, ...items];
  return (
    <section className="relative py-12 border-y border-border overflow-hidden">
      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-7">
        Uma plataforma. Tudo conectado.
      </p>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex landing-marquee gap-3 w-max">
          {loop.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm text-muted-foreground"
            >
              <span className="w-1 h-1 rounded-full bg-primary" /> {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ PLATAFORMA (3 grandes pilares com mockups) ============
function Plataforma() {
  return (
    <section id="plataforma" className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="A plataforma"
          title={<>Pare de costurar 5 sistemas.<br /><span className="text-muted-foreground">Use um só.</span></>}
          subtitle="Cada módulo conversa com o próximo. O ponto vira folha, a folha vira holerite, o holerite vira diário operacional. Sem exportar, sem colar, sem retrabalho."
        />

        <div className="mt-16 grid lg:grid-cols-12 gap-6">
          {/* Big card 1 */}
          <PillarCard
            className="lg:col-span-7"
            eyebrow="Painel executivo"
            title="Tudo que importa, em uma tela."
            description="KPIs, folha do mês, alertas críticos e próximos vencimentos. Sem precisar abrir relatório nenhum."
            mockup={<DashboardMockup />}
          />
          {/* Big card 2 */}
          <PillarCard
            className="lg:col-span-5"
            eyebrow="Folha CLT"
            title="Pronta em minutos."
            description="Motor com 145+ testes automatizados. Dia 20 + Dia 5, INSS, IRRF, FGTS, 13º — calculados sem você tocar."
            mockup={<FolhaMockup />}
          />
          {/* Big card 3 */}
          <PillarCard
            className="lg:col-span-5"
            eyebrow="Cadastro 360°"
            title="O colaborador inteiro em 10 abas."
            description="Documentos, contrato, benefícios, ASO, EPI, férias, empréstimos e histórico. Tudo num lugar só."
            mockup={<CadastroMockup />}
          />
          <PillarCard
            className="lg:col-span-7"
            eyebrow="Benefícios"
            title="11 tipos com elegibilidade automática."
            description="VT, VR, VA, Cesta, Odonto, Seguro de Vida, Vale Carne… cada um com sua regra, calculados mensalmente."
            mockup={<BeneficiosMockup />}
          />
        </div>
      </div>
    </section>
  );
}

function PillarCard({
  className = '',
  eyebrow,
  title,
  description,
  mockup,
}: {
  className?: string;
  eyebrow: string;
  title: string;
  description: string;
  mockup: React.ReactNode;
}) {
  return (
    <div className={`landing-glass landing-border-gradient rounded-2xl p-6 sm:p-8 group hover:translate-y-[-2px] transition-transform ${className}`}>
      <p className="text-[11px] uppercase tracking-[0.16em] text-primary mb-3">{eyebrow}</p>
      <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xl">{description}</p>
      <div className="mt-6 rounded-xl overflow-hidden border border-border" style={{ background: 'hsl(220 16% 96%)' }}>
        <div className="aspect-[16/10] relative">
          <div className="absolute inset-0">{mockup}</div>
        </div>
      </div>
    </div>
  );
}

// ============ FEATURES BENTO ============
function FeaturesBento() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Por que escolher"
          title={<>Construído para quem precisa <br /> de <span className="landing-text-gradient">precisão e velocidade.</span></>}
        />

        <div className="mt-14 grid md:grid-cols-6 gap-4">
          <BentoCard
            className="md:col-span-3"
            icon={Zap}
            title="Folha em minutos, não em dias"
            text="O motor calcula tudo (Dia 20 + Dia 5, INSS, IRRF, FGTS, 13º, férias). Você só revisa, aprova e exporta."
          />
          <BentoCard
            className="md:col-span-3"
            icon={ShieldCheck}
            title="Conformidade que não dorme"
            text="Alertas de ASO, férias e documentos vencendo. O fiscal não pega você de surpresa."
          />
          <BentoCard
            className="md:col-span-2"
            icon={Layers}
            title="Multi-loja com isolamento"
            text="Cada filial é uma ilha. Só o admin enxerga tudo."
          />
          <BentoCard
            className="md:col-span-2"
            icon={Workflow}
            title="Importa do Excel"
            text="Suas planilhas viram sistema em horas. Sem retrabalho."
          />
          <BentoCard
            className="md:col-span-2"
            icon={Database}
            title="Auditoria completa"
            text="Quem mudou, quando e por quê. Pronto para a Receita."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  className = '',
  icon: Icon,
  title,
  text,
}: {
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className={`relative landing-glass rounded-2xl p-6 sm:p-7 hover:border-primary/40 transition-colors group ${className}`}>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
           style={{ background: 'radial-gradient(400px circle at 30% 0%, hsl(var(--primary) / 0.08), transparent 60%)' }} />
      <div className="relative">
        <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

// ============ DIFERENCIAIS ============
function Differentiators() {
  const diffs = [
    { icon: Calculator, title: 'Pagamento Split (Dia 20 + Dia 5)', desc: 'Único no Brasil que calcula adiantamento Dia 20 (40%) + saldo Dia 5 (60%) nativo.', tag: 'Exclusivo' },
    { icon: Wallet, title: 'Empréstimos CLT + Loja', desc: 'Consignados e empréstimos da loja com parcelas, saldos e auditoria automática.', tag: 'Exclusivo' },
    { icon: Gift, title: '11 Tipos de Benefícios', desc: 'Cada um com sua regra de elegibilidade, recalculada todo mês.', tag: 'Mercado tem 3-4' },
    { icon: ScanFace, title: 'Ponto Facial integrado', desc: 'Reconhecimento + folha sem exportar planilha. EzPoint nativo.', tag: 'Nativo' },
    { icon: ShieldCheck, title: 'Multi-tenant blindado', desc: 'RLS em 50+ tabelas. Cada empresa vê só o que é dela.', tag: 'Bancário' },
    { icon: TrendingUp, title: 'Escala até 2.000+ profissionais', desc: 'Índices compostos e otimizações para alta volumetria. Sem travar.', tag: 'Performance' },
  ];

  return (
    <section id="diferencial" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Diferenciais"
          title={<>O que <span className="landing-text-gradient">ninguém mais faz</span> no Brasil.</>}
          subtitle="Construído com base nas dores reais de redes de varejo, comércio e franquias."
        />

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diffs.map((d, i) => (
            <div key={i} className="landing-glass rounded-2xl p-6 hover:border-primary/40 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 text-primary flex items-center justify-center">
                  <d.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-primary/80 px-2 py-1 rounded-full bg-primary/10 border border-primary/20">
                  {d.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold">{d.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ MODULES GRID (compacto, dark) ============
function Modules() {
  const modules = [
    { icon: LayoutDashboard, name: 'Painel Executivo' },
    { icon: Users, name: 'Cadastro 360°' },
    { icon: Calculator, name: 'Folha CLT' },
    { icon: ScanFace, name: 'Ponto Facial' },
    { icon: Calendar, name: 'Férias' },
    { icon: Stethoscope, name: 'ASO' },
    { icon: Wallet, name: 'Empréstimos' },
    { icon: Gift, name: 'Benefícios' },
    { icon: Receipt, name: 'Holerites' },
    { icon: FileSpreadsheet, name: 'Relatórios' },
    { icon: Bell, name: 'Alertas' },
    { icon: ShieldCheck, name: 'Auditoria' },
  ];

  return (
    <section id="modulos" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Módulos"
          title={<>40+ módulos.<br/><span className="text-muted-foreground">Uma única plataforma.</span></>}
        />

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {modules.map((m, i) => (
            <div key={i} className="landing-glass rounded-xl p-5 text-center hover:border-primary/40 hover:translate-y-[-2px] transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mx-auto mb-3">
                <m.icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-foreground">{m.name}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">
          E mais: EPI, pensão alimentícia, vales, 13º, importação Excel, white-label…
        </p>
      </div>
    </section>
  );
}

// ============ HUMAN STORIES (relacionamento + identidade) ============
function HumanStories() {
  const stories = [
    {
      img: gestoraRH,
      eyebrow: 'Gestores de RH',
      title: 'Mais tempo com gente. Menos com planilha.',
      desc: 'Quem cuida do RH não foi contratado para fechar 14 abas do Excel. Devolvemos as horas — e a tranquilidade — para quem realmente importa.',
      stat: '–95%',
      statLabel: 'tempo gasto com folha',
    },
    {
      img: equipeVarejo,
      eyebrow: 'Equipes de loja',
      title: 'Ponto, holerite e benefícios na palma da mão.',
      desc: 'O colaborador da ponta não precisa ligar para o RH. Bate o ponto facial, recebe o holerite no app e acompanha tudo com clareza.',
      stat: '0',
      statLabel: 'fila no RH no dia 5',
    },
    {
      img: empresariaAliviada,
      eyebrow: 'Donos & sócios',
      title: 'Folha sob controle. Dorme em paz.',
      desc: 'Você sabe, em tempo real, quanto vai sair, para quem, quando — e o que pode pegar fogo na conformidade. Sem surpresa no dia 30.',
      stat: '24h',
      statLabel: 'pra começar a usar',
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border relative overflow-hidden">
      <div className="absolute -top-20 right-0 w-[40vw] h-[400px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <SectionHeader
          eyebrow="Feito para gente"
          title={<>Por trás de cada folha,<br/><span className="landing-text-gradient">pessoas reais.</span></>}
          subtitle="Não vendemos software. Devolvemos tempo, tranquilidade e clareza para quem cuida de pessoas todos os dias."
        />

        <div className="mt-16 space-y-10">
          {stories.map((s, i) => (
            <div
              key={i}
              className={`grid lg:grid-cols-12 gap-8 items-center ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              {/* Image */}
              <div className="lg:col-span-6">
                <div className="relative landing-border-gradient rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent z-10 pointer-events-none" />
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={1280}
                    height={1280}
                    className="w-full h-[360px] sm:h-[440px] object-cover"
                  />
                  {/* Floating stat */}
                  <div className="absolute bottom-4 left-4 landing-glass rounded-xl px-4 py-3 z-20">
                    <p className="text-2xl font-semibold text-foreground tracking-tight">{s.stat}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.statLabel}</p>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="lg:col-span-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary mb-3">{s.eyebrow}</p>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">{s.title}</h3>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">{s.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Validado com clientes do varejo brasileiro
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ HOW IT WORKS ============
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Conversa de 10 minutos', desc: 'Conta seu cenário no WhatsApp. Sem formulário, sem demo agendada com 7 dias.' },
    { n: '02', title: 'Importamos seus dados', desc: 'Suas planilhas viram sistema. Nossa equipe cuida da migração — você só valida.' },
    { n: '03', title: 'Em 24h você opera', desc: 'Treinamento incluso. Suporte humano por WhatsApp respondendo em minutos.' },
  ];

  return (
    <section id="como" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          eyebrow="Como funciona"
          title={<>De planilha para sistema <br /> em <span className="landing-text-gradient">24 horas.</span></>}
        />

        <div className="mt-14 grid lg:grid-cols-12 gap-8 items-center">
          {/* Steps */}
          <div className="lg:col-span-7 grid sm:grid-cols-1 gap-3">
            {steps.map((s, i) => (
              <div key={i} className="relative landing-glass rounded-2xl p-6 flex gap-5 items-start">
                <div className="text-4xl font-semibold text-primary/30 tracking-tight shrink-0 w-14">{s.n}</div>
                <div>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Human support image */}
          <div className="lg:col-span-5">
            <div className="relative landing-border-gradient rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent z-10 pointer-events-none" />
              <img
                src={suporteHumano}
                alt="Suporte humano por WhatsApp respondendo em minutos"
                loading="lazy"
                width={1280}
                height={1280}
                className="w-full h-[420px] object-cover"
              />
              <div className="absolute bottom-5 left-5 right-5 z-20">
                <div className="landing-glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <p className="text-[10px] uppercase tracking-wider text-success">Online agora</p>
                  </div>
                  <p className="text-sm font-medium text-foreground">Gente de verdade no WhatsApp.</p>
                  <p className="text-xs text-muted-foreground mt-1">Sem bot, sem URA, sem ticket que some.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 gap-2 h-12 px-6 text-[15px]"
            onClick={openWhatsApp}
          >
            <MessageCircle className="w-4 h-4" />
            Começar agora pelo WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============ STATS BAR ============
function StatsBar() {
  const stats = [
    { value: '95%', label: 'menos tempo gasto com folha' },
    { value: '0', label: 'erros (motor com 145 testes)' },
    { value: '+2.000', label: 'profissionais por empresa' },
    { value: '24h', label: 'para começar a usar' },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 landing-grid-bg opacity-50 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">{s.value}</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ FAQ ============
function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const faqs = [
    { q: 'Quanto custa o sistema?', a: 'O preço varia conforme o tamanho da operação (número de profissionais e lojas). Em 10 minutos no WhatsApp montamos uma proposta sob medida — sem rodeio.' },
    { q: 'Meus dados ficam seguros?', a: 'Sim. Cada empresa opera em ambiente isolado (RLS em 50+ tabelas), criptografia em trânsito e em repouso, auditoria completa de todas as ações.' },
    { q: 'Como vocês importam meus dados atuais?', a: 'Você nos envia suas planilhas e nossa equipe técnica faz a importação, validação e correção de divergências. Você só aprova.' },
    { q: 'Posso cancelar quando quiser?', a: 'Sim, sem multa, sem fidelidade. Garantia de 30 dias com devolução do investimento se não fizer sentido para você.' },
    { q: 'Funciona com ponto facial?', a: 'Sim. Integração nativa com EzPoint — o ponto registrado vira automaticamente folha, sem exportar planilha.' },
    { q: 'Tem suporte?', a: 'WhatsApp humano respondendo em minutos no horário comercial, e plantão para emergências de fechamento.' },
  ];

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-3xl mx-auto">
        <SectionHeader
          eyebrow="Perguntas frequentes"
          title={<>Tudo que você quer <br/> saber antes de falar com a gente.</>}
        />

        <div className="mt-12 space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="landing-glass rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
              >
                <span className="text-[15px] font-medium text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============ CTA FINAL ============
function CTA() {
  return (
    <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-t border-border">
      <div className="absolute inset-0 landing-grid-bg pointer-events-none opacity-50" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[60vw] h-[400px] bg-primary/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
          Tudo que seu RH precisa.<br />
          <span className="landing-text-gradient">Em um único lugar.</span>
        </h2>
        <p className="mt-6 text-base text-muted-foreground max-w-xl mx-auto">
          10 minutos no WhatsApp. Sem compromisso. Você decide se faz sentido para sua empresa.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="bg-foreground text-background hover:bg-foreground/90 gap-2 h-12 px-7 text-[15px] font-medium"
            onClick={openWhatsApp}
          >
            <MessageCircle className="w-4 h-4" />
            Falar com a gente agora
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 h-12 px-7 text-[15px] border-border bg-card hover:bg-muted text-foreground"
            onClick={() => (window.location.href = '/login')}
          >
            Já sou cliente, entrar
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Resposta em minutos · Sigilo garantido · Sem cartão de crédito
        </p>
      </div>
    </section>
  );
}

// ============ FLOATING WHATSAPP ============
function FloatingWhatsApp() {
  return (
    <button
      onClick={openWhatsApp}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-success hover:bg-success/90 shadow-2xl flex items-center justify-center transition-transform hover:scale-110 group"
      aria-label="Falar no WhatsApp"
    >
      <span className="absolute inset-0 rounded-full landing-pulse-ring" />
      <MessageCircle className="w-6 h-6 text-success-foreground relative" />
    </button>
  );
}

// ============ FOOTER ============
function LandingFooter() {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">RH</span>
              </div>
              <span className="text-foreground font-semibold tracking-tight">Sistema RH</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Plataforma completa de gestão de RH, folha CLT, benefícios e
              compliance — feita para o varejo brasileiro.
            </p>
          </div>

          <div>
            <h4 className="text-foreground text-sm font-medium mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><a href="#plataforma" className="hover:text-foreground transition-colors">Visão geral</a></li>
              <li><a href="#modulos" className="hover:text-foreground transition-colors">Módulos</a></li>
              <li><a href="#diferencial" className="hover:text-foreground transition-colors">Diferenciais</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground text-sm font-medium mb-4">Contato</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <button onClick={openWhatsApp} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </button>
              </li>
              <li>
                <button onClick={openWhatsApp} className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="w-4 h-4" /> Solicitar contato
                </button>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Atendimento em todo o Brasil
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Sistema RH · eazdev.com</p>
          <p>Feito com cuidado para quem cuida de pessoas.</p>
        </div>
      </div>
    </footer>
  );
}

// ============ SHARED ============
function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <p className="text-[11px] uppercase tracking-[0.18em] text-primary mb-4">{eyebrow}</p>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-base text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ============ MAIN ============
export default function LandingPage() {
  return (
    <div className="landing-theme min-h-screen">
      <LandingHeader />
      <main>
        <Hero />
        <LogoTicker />
        <Plataforma />
        <FeaturesBento />
        <Differentiators />
        <HumanStories />
        <Modules />
        <HowItWorks />
        <StatsBar />
        <FAQ />
        <CTA />
      </main>
      <LandingFooter />
      <FloatingWhatsApp />
    </div>
  );
}

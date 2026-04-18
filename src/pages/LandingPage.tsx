import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, CheckCircle2, Play, Menu, X, Zap, Clock, Shield, Bell, 
  FileText, TrendingUp, LayoutDashboard, Users, Calendar, Stethoscope, 
  Wallet, Gift, Receipt, FileSpreadsheet, ShieldCheck, ChevronDown,
  Phone, Mail, MapPin, Star, MessageCircle, Sparkles, Target, Award,
  AlertTriangle, Calculator, Database
} from 'lucide-react';

import screenshotDashboard from '@/assets/landing/screenshot-dashboard.jpg';
import screenshotCadastro from '@/assets/landing/screenshot-cadastro.jpg';
import screenshotFolha from '@/assets/landing/screenshot-folha.jpg';
import screenshotBeneficios from '@/assets/landing/screenshot-beneficios.jpg';
import heroTeam from '@/assets/landing/hero-team.jpg';
import problemStress from '@/assets/landing/problem-stress.jpg';
import solutionEasy from '@/assets/landing/solution-easy.jpg';
import supportCall from '@/assets/landing/support-call.jpg';
import testimonial1 from '@/assets/landing/testimonial-1.jpg';
import testimonial2 from '@/assets/landing/testimonial-2.jpg';
import testimonial3 from '@/assets/landing/testimonial-3.jpg';
import teamSuccess from '@/assets/landing/team-success.jpg';

// ============ CONSTANTS ============
const WHATSAPP_NUMBER = '5511953340284';
const WHATSAPP_DISPLAY = '(11) 95334-0284';
const WHATSAPP_MESSAGE = encodeURIComponent('Olá! Vi a página do Sistema RH e quero saber como ele pode ajudar minha empresa.');
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
    "Folha calculada em segundos, sem erro de cálculo",
    "Alertas automáticos de ASO, férias e vencimentos",
    "Dados protegidos com isolamento total por empresa"
  ];

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-white to-secondary/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                <strong className="text-primary">Feito para o varejo brasileiro</strong>
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
              Seu RH no automático.{" "}
              <span className="text-primary">Sem planilhas, sem erro, sem stress.</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              O único sistema de RH desenhado para empresas com múltiplas lojas, pagamento split (Dia 20 + Dia 5) 
              e gestão completa de benefícios, empréstimos e compliance — tudo em um só lugar.
            </p>

            <ul className="mt-8 space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-14 text-base shadow-glow"
                onClick={openWhatsApp}>
                <MessageCircle className="w-5 h-5" />
                Quero uma demonstração
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-14 text-base"
                onClick={openWhatsApp}>
                <Phone className="w-5 h-5" />
                Chamar no WhatsApp
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Atendimento direto: <strong className="text-foreground">{WHATSAPP_DISPLAY}</strong> · Resposta em minutos
            </p>
          </div>

          {/* Product Screenshot */}
          <div className="relative">
            <div className="bg-card rounded-2xl border border-border p-2 shadow-2xl">
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

            <div className="absolute -left-4 top-1/4 bg-card rounded-lg border border-border px-4 py-3 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cálculo automático</p>
                  <p className="text-sm font-semibold text-foreground">INSS · IRRF · FGTS</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 bg-card rounded-lg border border-border px-4 py-3 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alerta automático</p>
                  <p className="text-sm font-semibold text-foreground">ASO vence em 5 dias</p>
                </div>
              </div>
            </div>
          </div>
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
              Se o seu RH gasta 60 horas por mês com planilhas, isso são <strong className="text-foreground">720 horas por ano</strong> que 
              poderiam estar gerando resultado para a empresa. Sem contar o risco de multa, o stress da equipe e a falta de visibilidade.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-2xl font-bold text-destructive">R$ 38mil</p>
                <p className="text-xs text-muted-foreground mt-1">multa média do eSocial por erro de folha</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <p className="text-2xl font-bold text-destructive">72%</p>
                <p className="text-xs text-muted-foreground mt-1">das empresas têm erro recorrente em planilhas</p>
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
    { icon: Zap, title: "Folha pronta em minutos", description: "Motor de cálculo validado com 145 testes automatizados. Você só confere e aprova.", highlight: "De 3 dias para 5 minutos" },
    { icon: Bell, title: "Alertas que te salvam", description: "ASO, férias, vencimentos, documentos. Você é avisado antes de virar problema.", highlight: "Zero surpresa fiscal" },
    { icon: Clock, title: "Sobra tempo pra estratégia", description: "Pare de apagar incêndio. Foque em desenvolver pessoas e fazer a empresa crescer.", highlight: "+60 horas livres/mês" },
    { icon: Shield, title: "Dados isolados por empresa", description: "Cada loja só vê o que precisa. Cada usuário com sua permissão. Auditoria completa.", highlight: "Segurança bancária" },
    { icon: FileText, title: "Histórico de tudo, pra sempre", description: "Quem mudou o quê, quando e por quê. Se a Receita pedir, você tem em segundos.", highlight: "Compliance total" },
    { icon: TrendingUp, title: "Cresce com você", description: "Atende de 10 a 2.000+ profissionais sem travar. Sua expansão não para por causa do RH.", highlight: "Sem limite real" },
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
            
            <div className="flex items-center gap-4 mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <img src={solutionEasy} alt="Profissional satisfeita" className="w-14 h-14 rounded-full object-cover" loading="lazy" width={56} height={56} />
              <div>
                <p className="text-sm text-foreground font-medium">
                  "Agora saio no horário e ainda sobra tempo pra desenvolver a equipe"
                </p>
                <p className="text-xs text-muted-foreground">
                  Depoimento real de uma coordenadora que migrou de planilha
                </p>
              </div>
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
      description: "Único sistema do mercado nacional que calcula nativamente o adiantamento do Dia 20 (40%) + saldo do Dia 5 (60%). Específico para varejo, comércio e redes de loja.",
      market: "Concorrentes não têm"
    },
    {
      icon: Wallet,
      title: "Empréstimos CLT + Direto da Loja",
      description: "Controle total de empréstimos consignados (CLT) e empréstimos da loja para o colaborador. Parcelas, saldos, histórico de alterações com auditoria.",
      market: "Concorrentes não têm"
    },
    {
      icon: Gift,
      title: "11 Tipos de Benefícios Configuráveis",
      description: "VT, VR, VA, Cesta, Odonto, Seguro de Vida, Bem Mais, Vale Carne, Vale Dinheiro e mais. Regras de elegibilidade por benefício, descontos automáticos.",
      market: "Sistemas comuns têm 3-4"
    },
    {
      icon: Award,
      title: "Motor de Cálculo Validado",
      description: "145 testes automatizados cobrindo INSS, IRRF, faltas, férias, 13º, maternidade, acidente. Arredondamento padrão CLT. Zero margem para erro.",
      market: "Padrão de auditoria"
    },
    {
      icon: ShieldCheck,
      title: "Multi-loja com Isolamento Total",
      description: "Cada loja é uma unidade independente. Gerente de uma filial não vê dados da outra. Consolidação automática para o administrador.",
      market: "Diferencial real"
    },
    {
      icon: Target,
      title: "White-label Pronto",
      description: "Logo, cores e identidade da sua empresa. Seus colaboradores acessam um sistema com a sua marca, não com a marca de fornecedor.",
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
            Não somos mais um sistema genérico. Fomos construídos com base nas dores reais 
            de operações de varejo, comércio e redes de loja.
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
            Mais de 40 módulos integrados. Tudo o que seu RH precisa, sem precisar de 5 ferramentas diferentes.
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
              <p className="text-sm text-muted-foreground">10 abas integradas: dados pessoais, documentos, cargo, benefícios, histórico, pensões, empréstimos, ASO, EPI e ocorrências</p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border shadow-premium">
            <img src={screenshotBeneficios} alt="Gestão de Benefícios" className="w-full h-auto" loading="lazy" width={1280} height={800} />
            <div className="p-4 bg-card">
              <p className="font-medium text-foreground">Gestão de 11 Benefícios</p>
              <p className="text-sm text-muted-foreground">Configuração de elegibilidade por benefício, descontos automáticos, relatórios consolidados por loja</p>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-muted-foreground">
          E muito mais: EPI com validade, pensão alimentícia, vales, 13º com avos, importação Excel, integração eSocial...
        </p>
      </div>
    </section>
  );
}

// ============ TESTIMONIALS ============
function Testimonials() {
  const testimonials = [
    {
      name: "Coordenadora de RH",
      role: "Rede de varejo",
      company: "12 lojas",
      text: "Antes eu passava 3 dias fazendo a folha. Agora faço em 30 minutos. Mudou minha vida profissional. Hoje consigo focar em projetos estratégicos.",
      rating: 5,
      photo: testimonial1
    },
    {
      name: "Gerente Administrativo",
      role: "Comércio multi-filial",
      company: "8 unidades",
      text: "O sistema de alertas é incrível. Nunca mais perdi um prazo de ASO ou férias. A multa que evitamos no primeiro ano pagou o sistema por 5 anos.",
      rating: 5,
      photo: testimonial2
    },
    {
      name: "Proprietária",
      role: "Rede de franquias",
      company: "+200 colaboradores",
      text: "Tenho controle total das lojas de um lugar só. Vejo onde está sangrando dinheiro, onde tem absenteísmo alto, onde precisa contratar. Game changer.",
      rating: 5,
      photo: testimonial3
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Quem usa, recomenda</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            A diferença é sentida no primeiro mês
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="p-8 rounded-2xl bg-background border border-border">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <img src={t.photo} alt={t.name} className="w-12 h-12 rounded-full object-cover" loading="lazy" width={48} height={48} />
                <div>
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
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
    { step: "1", title: "Você nos chama no WhatsApp", description: "Conta seu cenário em 10 minutos. A gente entende sua operação e mostra como o sistema resolve." },
    { step: "2", title: "Importamos seus dados", description: "Suas planilhas viram um sistema profissional. Sem trabalho para você. Equipe técnica dedicada." },
    { step: "3", title: "Em 24h você está rodando", description: "Treinamento incluso, suporte por WhatsApp e a tranquilidade de saber que está tudo certo." },
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
              Sem dor de cabeça, sem migração complicada. A gente cuida de tudo pra você começar a usar amanhã.
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
    { q: "Quanto custa o sistema?", a: `O investimento depende do tamanho da sua operação (quantidade de colaboradores e lojas). Chame no WhatsApp ${WHATSAPP_DISPLAY} e em 10 minutos a gente monta uma proposta sob medida pra você.` },
    { q: "Preciso instalar alguma coisa?", a: "Não. O sistema funciona 100% online, pelo navegador. Funciona no computador, tablet e celular sem instalação." },
    { q: "Como vocês importam meus dados?", a: "Basta nos enviar suas planilhas de Excel. Nossa equipe técnica faz toda a importação, validação e conferência dos dados. Você não precisa fazer nada." },
    { q: "Meus dados ficam seguros?", a: "Sim. Usamos criptografia de nível bancário, isolamento total entre empresas (multi-tenant) e auditoria completa de todas as ações. Seus dados nunca se misturam com os de outras empresas." },
    { q: "Funciona para o meu modelo de pagamento?", a: "Sim. Somos os únicos do mercado a calcular nativamente o pagamento split Dia 20 (adiantamento) + Dia 5 (saldo), além do modelo mensal tradicional. Atendemos varejo, comércio, indústria e serviços." },
    { q: "Vocês dão suporte?", a: "Sim! Suporte direto por WhatsApp com a equipe técnica. Resposta em minutos durante horário comercial e atendimento dedicado para questões urgentes." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa, sem fidelidade longa. Se não gostar, cancela. Mas em 8 anos de operação, ninguém pediu pra cancelar." },
    { q: "Funciona para quantos funcionários?", a: "De 10 a 2.000+ colaboradores por empresa. Arquitetura preparada para escalar conforme você cresce, sem precisar trocar de sistema." },
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
            Chamar no WhatsApp {WHATSAPP_DISPLAY}
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
        <p className="text-white/90 text-lg mb-2 leading-relaxed">
          Em 10 minutos no WhatsApp você descobre se o sistema resolve a sua dor.
        </p>
        <p className="text-white/80 text-base mb-8">
          Sem compromisso. Sem cartão de crédito. Resposta em minutos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 px-8 h-14 text-base font-semibold"
            onClick={openWhatsApp}>
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp agora
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 text-base bg-transparent"
            onClick={openWhatsApp}>
            <Phone className="w-5 h-5 mr-2" />
            {WHATSAPP_DISPLAY}
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
                  <MessageCircle className="w-4 h-4" /> WhatsApp {WHATSAPP_DISPLAY}
                </button>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> {WHATSAPP_DISPLAY}
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
      <Problems />
      <StatsImpact />
      <Features />
      <Differentiators />
      <Modules />
      <Testimonials />
      <HowItWorks />
      <FAQ />
      <CTA />
      <LandingFooter />
      <FloatingWhatsApp />
    </main>
  );
}

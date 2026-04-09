import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, CheckCircle2, Play, Menu, X, Zap, Clock, Shield, Bell, 
  FileText, TrendingUp, LayoutDashboard, Users, Calendar, Stethoscope, 
  Wallet, Gift, Receipt, FileSpreadsheet, ShieldCheck, ChevronDown,
  Phone, Mail, MapPin, Star, MessageCircle
} from 'lucide-react';

import screenshotDashboard from '@/assets/landing/screenshot-dashboard.jpg';
import screenshotCadastro from '@/assets/landing/screenshot-cadastro.jpg';
import screenshotFolha from '@/assets/landing/screenshot-folha.jpg';
import screenshotBeneficios from '@/assets/landing/screenshot-beneficios.jpg';

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
              { href: '#beneficios', label: 'Por que usar' },
              { href: '#modulos', label: 'O que faz' },
              { href: '#como-funciona', label: 'Como funciona' },
              { href: '#precos', label: 'Preços' },
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
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Ver demonstração
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
              {['Por que usar', 'O que faz', 'Como funciona', 'Preços', 'Dúvidas'].map(label => (
                <a key={label} href="#" className="text-muted-foreground hover:text-foreground text-sm py-2"
                  onClick={() => setIsMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" size="sm" className="justify-start"
                  onClick={() => window.location.href = '/login'}>
                  Entrar
                </Button>
                <Button size="sm">Ver demonstração</Button>
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
    "Folha de pagamento calculada em segundos",
    "Alertas automáticos de vencimentos",
    "Dados protegidos e isolados por empresa"
  ];

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-white to-secondary/30">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm text-foreground">
                <strong className="text-primary">+320 profissionais</strong> gerenciados
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
              Pare de perder horas com{" "}
              <span className="text-primary">planilhas de RH</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              Calcule folha de pagamento, férias, 13º e benefícios em minutos. 
              Tudo automático, sem erros e com segurança de banco.
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
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-14 text-base shadow-glow">
                Quero uma demonstração gratuita
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 h-14 text-base">
                <Play className="w-5 h-5" />
                Ver o sistema em 2 minutos
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Sem cartão de crédito. Configuração em 24 horas.
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
              />
            </div>

            <div className="absolute -left-4 top-1/4 bg-card rounded-lg border border-border px-4 py-3 shadow-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cálculo automático</p>
                  <p className="text-sm font-semibold text-foreground">INSS e IRRF</p>
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

// ============ PROBLEMS ============
function Problems() {
  const problems = [
    {
      emoji: "😰",
      title: "Horas perdidas em planilhas",
      description: "Você passa o mês inteiro fazendo conta, copiando célula, rezando pra não ter erro."
    },
    {
      emoji: "😱",
      title: "Medo de errar o cálculo",
      description: "Um número errado e vem multa. INSS, IRRF, férias... qualquer erro custa caro."
    },
    {
      emoji: "😤",
      title: "Informação espalhada",
      description: "Um pouco no caderno, outro na planilha, outro no WhatsApp. Quando precisa, não acha."
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-destructive font-medium uppercase tracking-wider">O problema</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Você se reconhece em alguma dessas situações?
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, i) => (
            <div key={i} className="p-8 rounded-2xl bg-background border border-border hover:border-destructive/30 transition-colors">
              <span className="text-4xl mb-4 block">{problem.emoji}</span>
              <h3 className="text-xl font-semibold text-foreground mb-3">{problem.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
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
    { value: "0", label: "erros de cálculo" },
    { value: "+320", label: "profissionais gerenciados" },
    { value: "24h", label: "para começar a usar" }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-primary text-white">
      <div className="max-w-7xl mx-auto">
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

// ============ FEATURES ============
function Features() {
  const features = [
    { icon: Zap, title: "Folha pronta em minutos", description: "O sistema faz todos os cálculos automaticamente. Você só confere e aprova.", highlight: "De 3 dias para 5 minutos" },
    { icon: Bell, title: "Alertas que te salvam", description: "Você recebe avisos antes de qualquer vencimento. Nunca mais perde prazo.", highlight: "Zero surpresas" },
    { icon: Clock, title: "Sobra tempo pra você", description: "O que levava horas agora leva minutos. Você pode focar no que realmente importa.", highlight: "+20 horas livres por mês" },
    { icon: Shield, title: "Informações protegidas", description: "Cada pessoa só vê o que precisa ver. Seus dados ficam seguros e organizados.", highlight: "Privacidade total" },
    { icon: FileText, title: "Tudo documentado", description: "Histórico completo, relatórios prontos. Qualquer dúvida se resolve em segundos.", highlight: "Tudo organizado" },
    { icon: TrendingUp, title: "Cresce junto com você", description: "De 10 a 2.000 funcionários, o sistema acompanha. Sem complicação.", highlight: "Sem limites" },
  ];

  return (
    <section id="beneficios" className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
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
            <span className="text-sm text-primary font-medium uppercase tracking-wider">A solução</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
              Imagine seu RH funcionando no automático
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              O Sistema RH faz o trabalho pesado para você. Menos estresse, menos erros, mais tempo para o que importa.
            </p>
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

// ============ MODULES ============
function Modules() {
  const modules = [
    { icon: LayoutDashboard, name: "Painel de Controle", description: "Veja tudo num só lugar" },
    { icon: Users, name: "Cadastro de Pessoas", description: "Todas as informações organizadas" },
    { icon: Calendar, name: "Férias e Folgas", description: "Controle sem esquecer nada" },
    { icon: Stethoscope, name: "Exames Médicos", description: "Alertas antes de vencer" },
    { icon: Wallet, name: "Empréstimos", description: "Parcelas e saldos na mão" },
    { icon: Gift, name: "Benefícios", description: "VT, VR, cesta e muito mais" },
    { icon: Receipt, name: "Holerites", description: "Gera sozinho, um ou todos" },
    { icon: FileSpreadsheet, name: "Relatórios", description: "Prontos para imprimir" },
    { icon: Bell, name: "Alertas", description: "Você sabe antes do problema" },
    { icon: ShieldCheck, name: "Histórico", description: "Tudo registrado" },
  ];

  return (
    <section id="modulos" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Tudo em um lugar</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Um sistema que resolve tudo
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Pare de pular de planilha em planilha. Aqui você encontra tudo o que precisa para cuidar das pessoas da empresa.
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
              <p className="font-medium text-foreground">Cadastro Completo</p>
              <p className="text-sm text-muted-foreground">Todas as informações do profissional em um só lugar</p>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border shadow-premium">
            <img src={screenshotBeneficios} alt="Gestão de Benefícios" className="w-full h-auto" loading="lazy" width={1280} height={800} />
            <div className="p-4 bg-card">
              <p className="font-medium text-foreground">Gestão de Benefícios</p>
              <p className="text-sm text-muted-foreground">VT, VR, cesta básica, seguro de vida e muito mais</p>
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-muted-foreground">
          E muito mais: equipamentos de segurança, pensão alimentícia, vales diversos, 13º salário, importação de dados...
        </p>
      </div>
    </section>
  );
}

// ============ TESTIMONIALS ============
function Testimonials() {
  const testimonials = [
    {
      name: "Maria Silva",
      role: "Coordenadora de RH",
      company: "Rede de Lojas",
      text: "Antes eu passava 3 dias fazendo a folha. Agora faço em 30 minutos. Mudou minha vida profissional.",
      rating: 5
    },
    {
      name: "Carlos Santos",
      role: "Gerente Administrativo",
      company: "Grupo Empresarial",
      text: "O sistema de alertas é incrível. Nunca mais perdi um prazo de ASO ou férias. Recomendo demais.",
      rating: 5
    },
    {
      name: "Ana Costa",
      role: "Proprietária",
      company: "Rede de Franquias",
      text: "Tenho 14 lojas e consigo gerenciar tudo de um lugar só. O investimento se pagou no primeiro mês.",
      rating: 5
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Depoimentos</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Quem usa, recomenda
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
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">{t.name.charAt(0)}</span>
                </div>
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
    { step: "1", title: "Conte o que precisa", description: "A gente entende seu negócio e configura tudo para você." },
    { step: "2", title: "Importamos seus dados", description: "Pegamos suas planilhas e colocamos tudo no sistema. Sem trabalho para você." },
    { step: "3", title: "Comece a usar", description: "Em 24 horas você já está rodando. Com suporte para qualquer dúvida." },
  ];

  return (
    <section id="como-funciona" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Simples assim</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Três passos e pronto
          </h2>
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

// ============ PRICING ============
function Pricing() {
  const plans = [
    {
      name: "Essencial",
      description: "Para empresas que estão começando a organizar o RH.",
      price: "R$ 497",
      period: "/mês",
      priceNote: "ou R$ 4.970/ano (economize 2 meses)",
      features: ["Até 50 pessoas", "3 lojas ou filiais", "Folha de pagamento completa", "Férias e afastamentos", "Benefícios básicos", "Relatórios para impressão", "Suporte por mensagem"],
      highlighted: false
    },
    {
      name: "Completo",
      description: "Para empresas que precisam de controle total.",
      price: "R$ 997",
      period: "/mês",
      priceNote: "ou R$ 9.970/ano (economize 2 meses)",
      features: ["Até 200 pessoas", "15 lojas ou filiais", "Tudo do Essencial, mais:", "13º salário automático", "Empréstimos e vales", "Exames médicos com alertas", "Histórico completo", "Suporte prioritário", "Importação de planilhas"],
      highlighted: true
    },
    {
      name: "Sob Medida",
      description: "Para grandes operações com necessidades específicas.",
      price: "Vamos conversar",
      period: "",
      priceNote: "Montamos o plano ideal para você",
      features: ["Pessoas ilimitadas", "Lojas ilimitadas", "Tudo do Completo, mais:", "Ajustes exclusivos", "Conexão com outros sistemas", "Pessoa dedicada para você", "Atendimento garantido", "Treinamento presencial"],
      highlighted: false
    }
  ];

  return (
    <section id="precos" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm text-primary font-medium uppercase tracking-wider">Investimento</span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Escolha o que faz sentido para você
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Todos os planos incluem 14 dias grátis. Sem compromisso, sem cartão de crédito.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`p-8 rounded-2xl border ${plan.highlighted ? 'border-primary bg-card shadow-glow relative' : 'border-border bg-card'}`}>
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-medium">
                  Mais popular
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <div className="mt-6 mb-2">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">{plan.priceNote}</p>
              <Button className={`w-full mb-6 ${plan.highlighted ? 'bg-primary text-white hover:bg-primary/90' : ''}`} variant={plan.highlighted ? 'default' : 'outline'}>
                {plan.name === 'Sob Medida' ? 'Falar com a gente' : 'Começar teste grátis'}
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
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
    { q: "Preciso instalar alguma coisa?", a: "Não. O sistema funciona 100% online, pelo navegador. Funciona no computador, tablet e celular." },
    { q: "Como vocês importam meus dados?", a: "Basta nos enviar suas planilhas de Excel. Nós fazemos toda a importação e validação dos dados para você." },
    { q: "Meus dados ficam seguros?", a: "Sim. Usamos criptografia de nível bancário e cada empresa tem seus dados completamente isolados." },
    { q: "Posso cancelar quando quiser?", a: "Sim. Sem multa, sem fidelidade. Se não gostar, cancele a qualquer momento." },
    { q: "Vocês dão suporte?", a: "Sim! Suporte por WhatsApp, e-mail e telefone. No plano Completo, o atendimento é prioritário." },
    { q: "Funciona para quantos funcionários?", a: "De 1 a 2.000+. O sistema se adapta ao tamanho da sua empresa." },
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
      </div>
    </section>
  );
}

// ============ CTA ============
function CTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Pronto para simplificar seu RH?
        </h2>
        <p className="text-white/80 text-lg mb-8 leading-relaxed">
          Agende uma demonstração gratuita e veja como o sistema pode transformar sua rotina em minutos.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 px-8 h-14 text-base font-semibold">
            <MessageCircle className="w-5 h-5" />
            Agendar demonstração
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 text-base">
            <Phone className="w-5 h-5 mr-2" />
            Falar por WhatsApp
          </Button>
        </div>
      </div>
    </section>
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
              Sistema completo de gestão de RH, folha de pagamento, benefícios e compliance.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Sistema</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#beneficios" className="hover:text-white transition-colors">Funcionalidades</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">Módulos</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors">Preços</a></li>
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
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> (11) 99999-9999
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> contato@sistemahr.com.br
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> São Paulo, SP
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
      <Modules />
      <Testimonials />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTA />
      <LandingFooter />
    </main>
  );
}

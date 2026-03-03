import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Search, 
  BookOpen, 
  Video, 
  HelpCircle, 
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  FileText,
  AlertTriangle,
  Settings,
  Package,
  Heart,
  Banknote,
  Gift,
  Play,
  Clock,
  ExternalLink,
  MessageCircle,
  Lightbulb
} from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';

// FAQ Categories
const faqCategories = [
  {
    id: 'geral',
    label: 'Geral',
    icon: HelpCircle,
    questions: [
      {
        question: 'Como começar a usar o sistema?',
        answer: 'Recomendamos iniciar pelo tour de onboarding que apresenta as principais funcionalidades. Você pode acessá-lo clicando no botão "Iniciar Tour" abaixo ou através das Configurações do sistema.'
      },
      {
        question: 'Como importar dados existentes?',
        answer: 'Acesse o menu Sistema > Importar Excel para fazer upload de planilhas com dados de profissionais, lojas, benefícios e empréstimos. O sistema aceita arquivos .xlsx e .xls.'
      },
      {
        question: 'O sistema funciona offline?',
        answer: 'Não. O sistema requer conexão com a internet para acessar o banco de dados e sincronizar informações em tempo real.'
      },
      {
        question: 'Como exportar relatórios?',
        answer: 'A maioria das telas possui botões de exportação para PDF e Excel. Acesse a tela desejada e procure pelo ícone de download ou botão "Exportar".'
      }
    ]
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: Users,
    questions: [
      {
        question: 'Como cadastrar um novo profissional?',
        answer: 'Acesse Cadastros > Profissionais e clique em "Novo Profissional". Preencha os dados obrigatórios como nome, matrícula, CPF e loja de trabalho.'
      },
      {
        question: 'Posso vincular um profissional a múltiplas lojas?',
        answer: 'Sim! O sistema permite definir a "Loja de Trabalho" (onde atua) e a "Loja de Registro" (onde está registrado). Isso é útil para profissionais transferidos.'
      },
      {
        question: 'Como inativar um profissional demitido?',
        answer: 'No cadastro do profissional, preencha a "Data de Demissão". O status será automaticamente alterado para "Demitido" e o profissional não aparecerá mais nas listagens ativas.'
      }
    ]
  },
  {
    id: 'folha',
    label: 'Folha de Pagamento',
    icon: CreditCard,
    questions: [
      {
        question: 'Qual a diferença entre dia 20 e dia 5?',
        answer: 'Dia 20: Pagamento de adiantamento (40% do salário) para profissionais elegíveis. Dia 5: Pagamento do restante (60%) com todos os descontos aplicados.'
      },
      {
        question: 'Como são calculados os descontos de INSS e IR?',
        answer: 'O sistema aplica automaticamente as alíquotas vigentes com base na faixa salarial. INSS é progressivo até o teto, e IR segue a tabela da Receita Federal.'
      },
      {
        question: 'Onde vejo o histórico de alterações salariais?',
        answer: 'Acesse o painel do profissional e clique na aba "Histórico Salarial". Lá você encontra todas as alterações com data, valor anterior e novo valor.'
      },
      {
        question: 'Como lançar horas extras?',
        answer: 'Acesse Folha > Lançamentos, selecione o profissional e adicione um lançamento do tipo "Provento" com a descrição "Horas Extras" e o valor correspondente.'
      }
    ]
  },
  {
    id: 'beneficios',
    label: 'Benefícios',
    icon: Gift,
    questions: [
      {
        question: 'Como é calculado o Vale Transporte?',
        answer: 'VT = (Valor diário × Dias trabalhados) - Desconto de 6% do salário. O valor diário é definido por profissional com base na rota utilizada.'
      },
      {
        question: 'Quem tem direito à Cesta Básica?',
        answer: 'Por padrão, profissionais ativos com mais de 90 dias de empresa. Você pode configurar as regras em Configurações > Benefícios.'
      },
      {
        question: 'Como descontar VR de profissional em férias?',
        answer: 'O sistema desconta automaticamente os dias de férias do cálculo. Basta registrar as férias em Gestão > Férias que os benefícios serão ajustados.'
      }
    ]
  },
  {
    id: 'emprestimos',
    label: 'Empréstimos',
    icon: Banknote,
    questions: [
      {
        question: 'Quais tipos de empréstimos o sistema suporta?',
        answer: 'Empréstimos Consignados (descontados em folha) e Empréstimos via CTPS (contratos formais). Ambos são controlados com parcelas e saldo devedor.'
      },
      {
        question: 'Como registrar o pagamento de uma parcela?',
        answer: 'Na tela de Gestão de Empréstimos, localize o empréstimo e clique em "Registrar Pagamento". O sistema atualiza automaticamente as parcelas pagas e o saldo devedor.'
      },
      {
        question: 'O desconto é automático na folha?',
        answer: 'Sim! Para empréstimos consignados ativos, o valor da parcela é automaticamente incluído nos descontos da folha de pagamento.'
      }
    ]
  },
  {
    id: 'gestao',
    label: 'Gestão de Pessoas',
    icon: Heart,
    questions: [
      {
        question: 'Como programar férias?',
        answer: 'Acesse Gestão > Férias, localize o profissional e clique em "Programar Férias". Defina o período de gozo e se haverá abono pecuniário (venda de 10 dias).'
      },
      {
        question: 'O que fazer quando um funcionário se afasta?',
        answer: 'Registre o afastamento em Gestão > Afastamentos com o tipo (médico, maternidade, etc.), data de início e previsão de retorno. O sistema ajustará os cálculos automaticamente.'
      },
      {
        question: 'Como controlar os ASOs?',
        answer: 'Em Gestão > Exames (ASO), você visualiza todos os exames com status de vencimento. O sistema alerta automaticamente 30 dias antes do vencimento.'
      },
      {
        question: 'Como registrar entrega de EPI?',
        answer: 'Acesse Gestão > EPIs, selecione o profissional e registre o equipamento entregue com número do CA e data de validade.'
      }
    ]
  },
  {
    id: 'alertas',
    label: 'Alertas',
    icon: AlertTriangle,
    questions: [
      {
        question: 'Como funcionam os alertas automáticos?',
        answer: 'O sistema monitora continuamente vencimentos de ASOs, EPIs, férias, CNHs e documentos. Alertas são gerados automaticamente com base nas datas cadastradas.'
      },
      {
        question: 'Posso desativar determinados alertas?',
        answer: 'Sim. Acesse Configurações > Alertas e defina quais tipos de notificações deseja receber e com quantos dias de antecedência.'
      },
      {
        question: 'Os alertas são enviados por e-mail?',
        answer: 'Atualmente os alertas são exibidos apenas no sistema. A funcionalidade de envio por e-mail está em desenvolvimento.'
      }
    ]
  }
];

// Video tutorials data
const videoTutorials = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos no Sistema',
    description: 'Aprenda a navegar pelo sistema e entender as principais funcionalidades',
    duration: '5:30',
    category: 'Básico',
    icon: LayoutDashboard,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 'cadastro-profissionais',
    title: 'Cadastrando Profissionais',
    description: 'Passo a passo para cadastrar e gerenciar funcionários',
    duration: '8:15',
    category: 'Cadastros',
    icon: Users,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 'fechamentos',
    title: 'Central de Fechamentos',
    description: 'Como visualizar, editar e fechar a folha de pagamento',
    duration: '6:45',
    category: 'Folha',
    icon: CreditCard,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 'gestao-ferias',
    title: 'Gestão de Férias',
    description: 'Programando e controlando férias dos colaboradores',
    duration: '7:20',
    category: 'Gestão',
    icon: Calendar,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 'emprestimos-consignados',
    title: 'Empréstimos Consignados',
    description: 'Registrando e acompanhando empréstimos em folha',
    duration: '5:00',
    category: 'Folha',
    icon: Banknote,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 'importacao-dados',
    title: 'Importando Dados do Excel',
    description: 'Como migrar dados existentes para o sistema',
    duration: '10:30',
    category: 'Sistema',
    icon: FileText,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 'alertas-automaticos',
    title: 'Configurando Alertas',
    description: 'Personalizando notificações e alertas do sistema',
    duration: '4:15',
    category: 'Sistema',
    icon: AlertTriangle,
    thumbnail: '/placeholder.svg'
  },
  {
    id: 'relatorios-exportacao',
    title: 'Gerando Relatórios',
    description: 'Exportando dados e criando relatórios personalizados',
    duration: '6:00',
    category: 'Relatórios',
    icon: FileText,
    thumbnail: '/placeholder.svg'
  }
];

// Quick tips
const quickTips = [
  {
    icon: Lightbulb,
    title: 'Atalho de Busca',
    description: 'Use a barra de busca no header para encontrar rapidamente qualquer profissional por nome, matrícula ou CPF.'
  },
  {
    icon: Lightbulb,
    title: 'Clique nos Cards',
    description: 'Todos os cards do Dashboard são clicáveis e levam diretamente para a tela detalhada.'
  },
  {
    icon: Lightbulb,
    title: 'Filtros Persistentes',
    description: 'Os filtros aplicados são mantidos enquanto você navega. Clique em "Limpar Filtros" para resetar.'
  },
  {
    icon: Lightbulb,
    title: 'Exportação Rápida',
    description: 'Segure Ctrl e clique em "Exportar" para download direto sem diálogo de confirmação.'
  }
];

export default function Ajuda() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('geral');
  const { resetTour } = useOnboarding();
  const navigate = useNavigate();

  // Filter FAQs based on search
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0 || searchQuery === '');

  const handleStartTour = () => {
    resetTour();
    navigate('/');
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              Central de Ajuda
            </h1>
            <p className="text-muted-foreground mt-1">
              Encontre respostas, tutoriais e dicas para usar o sistema
            </p>
          </div>

          <Button onClick={handleStartTour} className="gap-2">
            <Play className="h-4 w-4" />
            Iniciar Tour Guiado
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por dúvidas, tutoriais, funcionalidades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-background"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickTips.map((tip, index) => (
            <Card key={index} className="bg-accent/5 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <tip.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{tip.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="faq" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Video className="h-4 w-4" />
              Tutoriais
            </TabsTrigger>
            <TabsTrigger value="contato" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Contato
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Category Sidebar */}
              <Card className="lg:col-span-1 h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Categorias</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1">
                    {faqCategories.map((category) => {
                      const Icon = category.icon;
                      const isActive = activeCategory === category.id;
                      const matchCount = filteredCategories.find(c => c.id === category.id)?.questions.length || 0;
                      
                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive 
                              ? 'bg-primary/10 text-primary font-medium' 
                              : 'text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {category.label}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {matchCount}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Content */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const category = faqCategories.find(c => c.id === activeCategory);
                      if (category) {
                        const Icon = category.icon;
                        return (
                          <>
                            <Icon className="h-5 w-5 text-primary" />
                            {category.label}
                          </>
                        );
                      }
                      return null;
                    })()}
                  </CardTitle>
                  <CardDescription>
                    Perguntas frequentes sobre {faqCategories.find(c => c.id === activeCategory)?.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const category = filteredCategories.find(c => c.id === activeCategory);
                    if (!category || category.questions.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma pergunta encontrada para "{searchQuery}"</p>
                        </div>
                      );
                    }
                    
                    return (
                      <Accordion type="single" collapsible className="space-y-2">
                        {category.questions.map((faq, index) => (
                          <AccordionItem 
                            key={index} 
                            value={`item-${index}`}
                            className="border rounded-lg px-4"
                          >
                            <AccordionTrigger className="text-left hover:no-underline">
                              <span className="font-medium">{faq.question}</span>
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground pb-4">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videoTutorials.map((video) => {
                const Icon = video.icon;
                return (
                  <Card 
                    key={video.id} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                        <Icon className="h-12 w-12 text-primary/30" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                        <div className="p-3 rounded-full bg-primary text-primary-foreground">
                          <Play className="h-6 w-6" />
                        </div>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-black/60">
                        <Clock className="h-3 w-3 mr-1" />
                        {video.duration}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {video.category}
                      </Badge>
                      <h3 className="font-semibold text-sm line-clamp-1">{video.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {video.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold mb-2">Mais tutoriais em breve!</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Estamos preparando novos vídeos tutoriais para ajudá-lo a aproveitar ao máximo o sistema.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contato" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Suporte
                  </CardTitle>
                  <CardDescription>
                    Entre em contato com nossa equipe de suporte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email de Suporte</label>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <span className="text-sm">suporte@sistema-rh.com.br</span>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Horário de Atendimento</label>
                    <p className="text-sm text-muted-foreground">
                      Segunda a Sexta, das 9h às 18h
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Documentação
                  </CardTitle>
                  <CardDescription>
                    Acesse a documentação técnica completa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/referencia-sistema')}>
                    <FileText className="h-4 w-4" />
                    Referência do Sistema
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate('/configuracoes')}>
                    <Settings className="h-4 w-4" />
                    Configurações Avançadas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  UserX, 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Building2,
  User,
  Users,
  Heart,
  Plane,
  Package,
  LineChart,
  Store,
  FileSpreadsheet,
  UserMinus,
  Gift,
  BookOpen,
  Calculator,
  ChevronRight,
  ChevronDown,
  Bell,
  History,
  Banknote,
  HelpCircle,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// Navigation structure organized by sections
const navSections = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { title: 'Visão Geral', url: '/', icon: LayoutDashboard },
      { title: 'Alertas', url: '/alertas', icon: Bell },
      { title: 'Simulador Folha', url: '/simulador-folha', icon: Calculator },
    ],
  },
  {
    label: 'Cadastros',
    icon: Users,
    defaultOpen: true,
    items: [
      { title: 'Lojas', url: '/cadastro-lojas', icon: Store },
      { title: 'Profissionais', url: '/cadastro-profissionais', icon: Users },
      { title: 'Importação', url: '/importacao-dados', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Gestão',
    icon: Heart,
    defaultOpen: false,
    items: [
      { title: 'Férias', url: '/gestao-ferias', icon: Plane },
      { title: 'Afastamentos', url: '/gestao-afastamentos', icon: UserMinus },
      { title: 'Exames (ASO)', url: '/gestao-aso', icon: Heart },
      { title: 'EPIs', url: '/gestao-epi', icon: Package },
      { title: 'Benefícios', url: '/gestao-beneficios-detalhado', icon: Gift },
    ],
  },
  {
    label: 'Folha',
    icon: CreditCard,
    defaultOpen: false,
    items: [
      { title: 'Lançamentos', url: '/lancamentos', icon: CreditCard },
      { title: 'Faltas', url: '/faltas', icon: UserX },
      { title: 'Empréstimos', url: '/gestao-emprestimos', icon: Banknote },
      { title: 'Holerites', url: '/holerites', icon: FileText },
      { title: 'Pendências', url: '/pendencias', icon: AlertTriangle },
    ],
  },
  {
    label: 'Painéis',
    icon: Building2,
    defaultOpen: false,
    items: [
      { title: 'Por Loja', url: '/painel-loja', icon: Building2 },
      { title: 'Por Profissional', url: '/painel-profissional', icon: User },
    ],
  },
  {
    label: 'Relatórios',
    icon: LineChart,
    defaultOpen: false,
    items: [
      { title: 'Dashboard Analítico', url: '/dashboard-analitico', icon: BarChart3 },
      { title: 'Relatórios', url: '/relatorios', icon: LineChart },
    ],
  },
  {
    label: 'Sistema',
    icon: Settings,
    defaultOpen: false,
    items: [
      { title: 'Gestão de Usuários', url: '/gestao-usuarios', icon: Shield },
      { title: 'Validação de Dados', url: '/validacao-dados', icon: AlertTriangle },
      { title: 'Histórico Alterações', url: '/audit-log', icon: History },
      { title: 'Configurações', url: '/configuracoes', icon: Settings },
      { title: 'Referência', url: '/referencia-sistema', icon: BookOpen },
      { title: 'Ajuda', url: '/ajuda', icon: HelpCircle },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  
  // Check if any item in section is active
  const isSectionActive = (items: { url: string }[]) => 
    items.some(item => isActive(item.url));

  // Initialize open state based on active routes
  const getInitialOpenState = () => {
    const state: Record<string, boolean> = {};
    navSections.forEach(section => {
      state[section.label] = section.defaultOpen || isSectionActive(section.items);
    });
    return state;
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(getInitialOpenState);

  const toggleSection = (label: string) => {
    setOpenSections(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <Sidebar
      className="border-r border-border/40 bg-card transition-all duration-300"
      collapsible="icon"
    >
      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className={cn(
            "transition-all duration-300 overflow-hidden",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <h2 className="font-semibold text-sm text-foreground whitespace-nowrap">Sistema RH</h2>
            <p className="text-2xs text-muted-foreground whitespace-nowrap">Gestão de Pessoas</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4 scrollbar-thin">
        {navSections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = openSections[section.label];
          const hasActiveItem = isSectionActive(section.items);

          return (
            <SidebarGroup key={section.label} className="mb-1">
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.label)}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider",
                      "transition-all duration-200 hover:bg-muted/50",
                      hasActiveItem ? "text-primary" : "text-muted-foreground/70",
                      collapsed && "justify-center"
                    )}
                  >
                    <SectionIcon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      hasActiveItem ? "text-primary" : "text-muted-foreground"
                    )} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{section.label}</span>
                        {isOpen ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                      </>
                    )}
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className={cn(
                  "transition-all duration-200",
                  collapsed && "hidden"
                )}>
                  <SidebarGroupContent className="mt-1">
                    <SidebarMenu>
                      {section.items.map((item) => {
                        const active = isActive(item.url);
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild>
                              <NavLink
                                to={item.url}
                                className={cn(
                                  "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ml-2",
                                  "transition-all duration-200 group",
                                  active
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                )}
                              >
                                {/* Active indicator */}
                                {active && (
                                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary" />
                                )}
                                
                                <item.icon className={cn(
                                  "h-4 w-4 flex-shrink-0 transition-colors duration-200",
                                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                
                                <span className="whitespace-nowrap">
                                  {item.title}
                                </span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

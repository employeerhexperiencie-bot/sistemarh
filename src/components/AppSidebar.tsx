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
  Bell,
  History,
  FileBox,
  Database
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

// Navigation structure organized by sections
const navSections = [
  {
    label: 'Dashboard',
    items: [
      { title: 'Visão Geral', url: '/', icon: LayoutDashboard },
      { title: 'Alertas', url: '/alertas', icon: Bell },
      { title: 'Simulador Folha', url: '/simulador-folha', icon: Calculator },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { title: 'Lojas', url: '/cadastro-lojas', icon: Store },
      { title: 'Profissionais', url: '/cadastro-profissionais', icon: Users },
      { title: 'Importação', url: '/importacao-dados', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Férias', url: '/gestao-ferias', icon: Plane },
      { title: 'Afastamentos', url: '/gestao-afastamentos', icon: UserMinus },
      { title: 'Exames (ASO)', url: '/gestao-aso', icon: Heart },
      { title: 'EPIs', url: '/gestao-epi', icon: Package },
      { title: 'Benefícios', url: '/gestao-beneficios', icon: Gift },
    ],
  },
  {
    label: 'Folha',
    items: [
      { title: 'Lançamentos', url: '/lancamentos', icon: CreditCard },
      { title: 'Faltas', url: '/faltas', icon: UserX },
      { title: 'Holerites', url: '/holerites', icon: FileText },
      { title: 'Pendências', url: '/pendencias', icon: AlertTriangle },
    ],
  },
  {
    label: 'Painéis',
    items: [
      { title: 'Por Loja', url: '/painel-loja', icon: Building2 },
      { title: 'Por Profissional', url: '/painel-profissional', icon: User },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { title: 'Dashboard Analítico', url: '/dashboard-analitico', icon: BarChart3 },
      { title: 'Relatórios', url: '/relatorios', icon: LineChart },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Análise Ativos', url: '/analisar-ativos', icon: FileBox },
      { title: 'Dados Adicionais', url: '/carregar-dados-adicionais', icon: FileSpreadsheet },
      { title: 'Migrar para BD', url: '/migrar-dados', icon: Database },
      { title: 'Validação de Dados', url: '/validacao-dados', icon: AlertTriangle },
      { title: 'Histórico Alterações', url: '/audit-log', icon: History },
      { title: 'Configurações', url: '/configuracoes', icon: Settings },
      { title: 'Referência', url: '/referencia-sistema', icon: BookOpen },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;

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
        {navSections.map((section) => (
          <SidebarGroup key={section.label} className="mb-2">
            <SidebarGroupLabel className={cn(
              "px-3 mb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/70",
              "transition-opacity duration-300",
              collapsed && "opacity-0"
            )}>
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={cn(
                            "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
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
                          
                          <span className={cn(
                            "transition-all duration-300 overflow-hidden whitespace-nowrap",
                            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                          )}>
                            {item.title}
                          </span>
                          
                          {/* Hover chevron */}
                          {!collapsed && !active && (
                            <ChevronRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
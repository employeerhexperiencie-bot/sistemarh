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
  Calculator
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

const mainItems = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Simulador Folha', url: '/simulador-folha', icon: Calculator },
  { title: 'Lançamentos', url: '/lancamentos', icon: CreditCard },
  { title: 'Faltas', url: '/faltas', icon: UserX },
  { title: 'Holerites', url: '/holerites', icon: FileText },
  { title: 'Relatórios', url: '/relatorios', icon: LineChart },
  { title: 'Pendências', url: '/pendencias', icon: AlertTriangle },
];

const pessoasItems = [
  { title: 'Cadastro de Lojas', url: '/cadastro-lojas', icon: Store },
  { title: 'Cadastro Profissionais', url: '/cadastro-profissionais', icon: Users },
  { title: 'Importação de Dados', url: '/importacao-dados', icon: FileSpreadsheet },
  { title: 'Gestão de Exames', url: '/gestao-asus', icon: Heart },
  { title: 'Gestão Férias', url: '/gestao-ferias', icon: Plane },
  { title: 'Gestão Afastamentos', url: '/gestao-afastamentos', icon: UserMinus },
  { title: 'Gestão EPI', url: '/gestao-epi', icon: Package },
  { title: 'Gestão Benefícios', url: '/gestao-beneficios', icon: Gift },
];

const painelItems = [
  { title: 'Por Loja', url: '/painel-loja', icon: Building2 },
  { title: 'Por Profissional', url: '/painel-profissional', icon: User },
];

const configItems = [
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
  { title: 'Referência Sistema', url: '/referencia-sistema', icon: BookOpen },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary/10 text-primary border-l-4 border-primary font-medium shadow-sm' 
      : 'hover:bg-muted/50 hover:border-l-4 hover:border-muted transition-all duration-200';

  return (
    <Sidebar
      className="border-r border-border/50 smooth-transition group/sidebar bg-card/30 backdrop-blur-sm"
      collapsible="icon"
    >
      <div className="p-4 border-b border-border/50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0 shadow-lg">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-300 overflow-hidden min-w-0">
            <h2 className="font-bold text-base truncate whitespace-nowrap bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Sistema RH</h2>
            <p className="text-xs text-muted-foreground truncate whitespace-nowrap">Gestão de Pessoas</p>
          </div>
        </div>
      </div>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0 transition-opacity duration-300">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-300 overflow-hidden whitespace-nowrap">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0 transition-opacity duration-300">Gestão de Pessoas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pessoasItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-300 overflow-hidden whitespace-nowrap">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0 transition-opacity duration-300">Painéis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {painelItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-300 overflow-hidden whitespace-nowrap">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0 transition-opacity duration-300">Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-300 overflow-hidden whitespace-nowrap">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
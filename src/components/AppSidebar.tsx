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
  Package
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
  { title: 'Lançamentos', url: '/lancamentos', icon: CreditCard },
  { title: 'Faltas', url: '/faltas', icon: UserX },
  { title: 'Holerites', url: '/holerites', icon: FileText },
  { title: 'Pendências', url: '/pendencias', icon: AlertTriangle },
];

const pessoasItems = [
  { title: 'Cadastro Profissionais', url: '/cadastro-profissionais', icon: Users },
  { title: 'Gestão ASUS', url: '/gestao-asus', icon: Heart },
  { title: 'Gestão Férias', url: '/gestao-ferias', icon: Plane },
  { title: 'Gestão EPI', url: '/gestao-epi', icon: Package },
];

const painelItems = [
  { title: 'Por Loja', url: '/painel-loja', icon: Building2 },
  { title: 'Por Profissional', url: '/painel-profissional', icon: User },
];

const configItems = [
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-primary/10 text-primary border-r-2 border-primary font-medium' 
      : 'hover:bg-muted/50 smooth-transition';

  return (
    <Sidebar
      className="border-r border-border smooth-transition group/sidebar"
      collapsible="icon"
    >
      <div className="p-4 border-b border-border transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 transition-all duration-300 overflow-hidden min-w-0">
            <h2 className="font-semibold text-sm truncate whitespace-nowrap">Sistema RH</h2>
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
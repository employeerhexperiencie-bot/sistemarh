import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Mapeamento de rotas para breadcrumbs
const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/alertas': 'Alertas',
  '/simulador-folha': 'Simulador de Folha',
  '/cadastro-lojas': 'Lojas',
  '/cadastro-profissionais': 'Profissionais',
  '/importacao-dados': 'Importação',
  '/gestao-ferias': 'Férias',
  '/gestao-afastamentos': 'Afastamentos',
  '/gestao-aso': 'Exames (ASO)',
  '/gestao-epi': 'EPIs',
  '/gestao-beneficios-detalhado': 'Benefícios',
  '/lancamentos': 'Lançamentos',
  '/faltas': 'Faltas',
  '/gestao-emprestimos': 'Empréstimos',
  '/holerites': 'Holerites',
  '/pendencias': 'Pendências',
  '/painel-loja': 'Painel por Loja',
  '/painel-profissional': 'Painel do Profissional',
  '/historico-profissional': 'Histórico',
  '/dashboard-analitico': 'Dashboard Analítico',
  '/relatorios': 'Relatórios',
  '/importar-dados-excel': 'Importar Excel',
  '/analisar-ativos': 'Análise de Ativos',
  '/carregar-dados-adicionais': 'Dados Adicionais',
  '/migrar-dados': 'Migrar para BD',
  '/validacao-dados': 'Validação de Dados',
  '/audit-log': 'Histórico de Alterações',
  '/configuracoes': 'Configurações',
  '/referencia-sistema': 'Referência',
  '/ajuda': 'Ajuda',
};

// Mapeamento de seções (grupos de navegação)
const sectionLabels: Record<string, { label: string; href: string }> = {
  '/cadastro-lojas': { label: 'Cadastros', href: '/cadastro-lojas' },
  '/cadastro-profissionais': { label: 'Cadastros', href: '/cadastro-lojas' },
  '/importacao-dados': { label: 'Cadastros', href: '/cadastro-lojas' },
  '/gestao-ferias': { label: 'Gestão', href: '/gestao-ferias' },
  '/gestao-afastamentos': { label: 'Gestão', href: '/gestao-ferias' },
  '/gestao-aso': { label: 'Gestão', href: '/gestao-ferias' },
  '/gestao-epi': { label: 'Gestão', href: '/gestao-ferias' },
  '/gestao-beneficios-detalhado': { label: 'Gestão', href: '/gestao-ferias' },
  '/lancamentos': { label: 'Folha', href: '/lancamentos' },
  '/faltas': { label: 'Folha', href: '/lancamentos' },
  '/gestao-emprestimos': { label: 'Folha', href: '/lancamentos' },
  '/holerites': { label: 'Folha', href: '/lancamentos' },
  '/pendencias': { label: 'Folha', href: '/lancamentos' },
  '/painel-loja': { label: 'Painéis', href: '/painel-loja' },
  '/painel-profissional': { label: 'Painéis', href: '/painel-loja' },
  '/historico-profissional': { label: 'Painéis', href: '/painel-loja' },
  '/dashboard-analitico': { label: 'Relatórios', href: '/dashboard-analitico' },
  '/relatorios': { label: 'Relatórios', href: '/dashboard-analitico' },
};

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ customItems, className }: BreadcrumbsProps) {
  const location = useLocation();
  const pathname = location.pathname;

  // Se customItems for fornecido, usar ele
  if (customItems && customItems.length > 0) {
    return (
      <nav className={cn("flex items-center text-sm", className)}>
        <Link 
          to="/" 
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
        </Link>
        {customItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
            {item.href ? (
              <Link
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // Gerar breadcrumbs automaticamente
  const items: BreadcrumbItem[] = [];

  // Verificar se é uma rota com ID (ex: /painel-profissional/123)
  const pathParts = pathname.split('/').filter(Boolean);
  const basePath = '/' + pathParts[0];
  const hasId = pathParts.length > 1 && pathParts[1].length > 10; // UUIDs são longos

  // Adicionar seção se existir
  const section = sectionLabels[basePath];
  if (section && basePath !== section.href) {
    items.push({ label: section.label, href: section.href });
  }

  // Adicionar rota atual
  const currentLabel = routeLabels[basePath] || pathParts[0];
  if (hasId) {
    items.push({ label: currentLabel, href: basePath });
    items.push({ label: 'Detalhes' }); // Último item sem link
  } else {
    items.push({ label: currentLabel });
  }

  // Não mostrar breadcrumbs na home
  if (pathname === '/' || pathname === '/dashboard') {
    return null;
  }

  return (
    <nav className={cn("flex items-center text-sm mb-4", className)}>
      <Link 
        to="/" 
        className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
          {item.href ? (
            <Link
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Building2, 
  FileText, 
  Stethoscope,
  Gift,
  ChevronRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChecklistItem {
  id: string;
  label: string;
  descricao: string;
  carregado: boolean;
  quantidade?: number;
  rota: string;
  icone: React.ElementType;
  obrigatorio: boolean;
}

interface Props {
  profissionais: number;
  lojas: number;
  ativosCarregados: boolean;
  asoCarregados: boolean;
  beneficiosCarregados: boolean;
}

export function ChecklistDados({ 
  profissionais, 
  lojas, 
  ativosCarregados, 
  asoCarregados, 
  beneficiosCarregados 
}: Props) {
  const items: ChecklistItem[] = [
    {
      id: 'profissionais',
      label: 'Profissionais',
      descricao: 'Cadastro de funcionários',
      carregado: profissionais > 0,
      quantidade: profissionais,
      rota: '/cadastro-profissionais',
      icone: Users,
      obrigatorio: true,
    },
    {
      id: 'lojas',
      label: 'Lojas',
      descricao: 'Cadastro de unidades',
      carregado: lojas > 0,
      quantidade: lojas,
      rota: '/cadastro-lojas',
      icone: Building2,
      obrigatorio: true,
    },
    {
      id: 'aso',
      label: 'ASO',
      descricao: 'Exames ocupacionais',
      carregado: asoCarregados,
      rota: '/gestao-aso',
      icone: Stethoscope,
      obrigatorio: false,
    },
    {
      id: 'beneficios',
      label: 'Benefícios',
      descricao: 'VT, VR, Cesta',
      carregado: beneficiosCarregados,
      rota: '/gestao-beneficios',
      icone: Gift,
      obrigatorio: false,
    },
  ];

  const itensObrigatoriosOk = items.filter(i => i.obrigatorio).every(i => i.carregado);
  const todosOk = items.every(i => i.carregado);

  if (todosOk) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <span className="text-sm font-medium text-success">
          Dados validados • {profissionais} profissionais • {lojas} lojas
        </span>
      </div>
    );
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <span className="text-sm font-medium text-warning">
            {itensObrigatoriosOk ? 'Alguns dados opcionais pendentes' : 'Configure os dados para simular a folha'}
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {items.map((item) => {
            const Icon = item.icone;
            
            return (
              <Link 
                key={item.id} 
                to={item.rota}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border transition-all
                  ${item.carregado 
                    ? 'bg-success/5 border-success/20 hover:bg-success/10' 
                    : item.obrigatorio
                    ? 'bg-destructive/5 border-destructive/20 hover:bg-destructive/10'
                    : 'bg-muted/50 border-border hover:bg-muted'
                  }
                `}
              >
                <div className={`
                  p-1.5 rounded-md
                  ${item.carregado 
                    ? 'bg-success/10 text-success' 
                    : item.obrigatorio
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium truncate">{item.label}</span>
                    {item.quantidade !== undefined && item.carregado && (
                      <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                        {item.quantidade}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{item.descricao}</p>
                </div>
                
                {item.carregado ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

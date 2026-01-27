import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, Circle, ArrowRight, 
  Users, AlertTriangle, Calculator, FileText, 
  Play
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Step {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  rota: string;
  verificar: () => Promise<boolean>;
  icone: React.ElementType;
}

export function FluxoGuiadoChecklist() {
  const navigate = useNavigate();
  const [stepsStatus, setStepsStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [competenciaAtual, setCompetenciaAtual] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const steps: Step[] = [
    {
      id: 'revisar-dados',
      numero: 1,
      titulo: 'Revisar dados importados',
      descricao: 'Verifique se todos os profissionais têm CPF, salário e data de admissão',
      rota: '/cadastro-profissionais',
      icone: Users,
      verificar: async () => {
        const { data } = await supabase
          .from('profissionais')
          .select('id, cpf, data_admissao, salario_nominal, ultimo_salario, primeiro_salario')
          .eq('status', 'ativo');
        
        if (!data || data.length === 0) return false;
        
        const semDados = data.filter(p => 
          !p.cpf || 
          !p.data_admissao || 
          ((!p.salario_nominal || p.salario_nominal === 0) && 
           (!p.ultimo_salario || p.ultimo_salario === 0) && 
           (!p.primeiro_salario || p.primeiro_salario === 0))
        );
        
        return semDados.length === 0;
      }
    },
    {
      id: 'resolver-pendencias',
      numero: 2,
      titulo: 'Resolver pendências críticas',
      descricao: 'ASO vencidos, férias pendentes e outros alertas críticos',
      rota: '/alertas',
      icone: AlertTriangle,
      verificar: async () => {
        const hoje = new Date().toISOString().split('T')[0];
        
        // Verificar ASO vencidos
        const { data: aso } = await supabase
          .from('exames_aso')
          .select('id')
          .lt('data_proximo_exame', hoje)
          .limit(1);
        
        if (aso && aso.length > 0) return false;
        
        // Verificar férias vencidas
        const { data: ferias } = await supabase
          .from('ferias')
          .select('id')
          .eq('status', 'pendente')
          .lt('periodo_aquisitivo_fim', hoje)
          .limit(1);
        
        return !ferias || ferias.length === 0;
      }
    },
    {
      id: 'simular-folha',
      numero: 3,
      titulo: 'Simular folha',
      descricao: 'Visualize os valores antes de fechar (não gera descontos)',
      rota: '/simulador-folha',
      icone: Calculator,
      verificar: async () => {
        // Consideramos concluído se visitou o simulador
        // Na prática, verificamos se há folha para a competência atual
        const { data } = await supabase
          .from('folha_pagamento')
          .select('id')
          .eq('competencia', competenciaAtual)
          .limit(1);
        
        // Se já tem folha fechada, este passo foi concluído
        return data && data.length > 0;
      }
    },
    {
      id: 'fechar-folha',
      numero: 4,
      titulo: 'Fechar folha',
      descricao: 'Confirme os valores e gere os registros definitivos',
      rota: '/simulador-folha',
      icone: FileText,
      verificar: async () => {
        const { data } = await supabase
          .from('folha_pagamento')
          .select('id')
          .eq('competencia', competenciaAtual)
          .eq('status', 'fechada')
          .limit(1);
        
        return data && data.length > 0;
      }
    },
  ];

  useEffect(() => {
    verificarTodosSteps();
  }, []);

  const verificarTodosSteps = async () => {
    setLoading(true);
    const status: Record<string, boolean> = {};
    
    for (const step of steps) {
      try {
        status[step.id] = await step.verificar();
      } catch (error) {
        console.error(`Erro ao verificar step ${step.id}:`, error);
        status[step.id] = false;
      }
    }
    
    setStepsStatus(status);
    setLoading(false);
  };

  const completados = Object.values(stepsStatus).filter(Boolean).length;
  const progresso = (completados / steps.length) * 100;

  // Encontrar próximo passo
  const proximoPasso = steps.find(s => !stepsStatus[s.id]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Play className="h-4 w-4 text-primary" />
            Seu Progresso Mensal
          </CardTitle>
          <Badge variant="secondary">
            {completados}/{steps.length} concluídos
          </Badge>
        </div>
        <Progress value={progresso} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icone;
          const concluido = stepsStatus[step.id];
          const isProximo = proximoPasso?.id === step.id;
          
          return (
            <div 
              key={step.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all
                ${concluido 
                  ? 'bg-success/5 border-success/30' 
                  : isProximo
                  ? 'bg-primary/5 border-primary/30 ring-2 ring-primary/20'
                  : 'bg-muted/30 border-border'
                }
              `}
            >
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
                ${concluido 
                  ? 'bg-success text-success-foreground' 
                  : isProximo
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {concluido ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  step.numero
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${concluido ? 'text-success' : ''}`}>
                  {step.titulo}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.descricao}
                </p>
              </div>
              
              {isProximo && !concluido && (
                <Button size="sm" onClick={() => navigate(step.rota)}>
                  Ir
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              
              {concluido && (
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              )}
            </div>
          );
        })}
        
        {/* Mensagem quando tudo concluído */}
        {completados === steps.length && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/30 text-center">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="font-medium text-success">Parabéns! Folha do mês concluída.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você pode gerar os holerites em <Link to="/holerites" className="text-primary underline">Holerites</Link>.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

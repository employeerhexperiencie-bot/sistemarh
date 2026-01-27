import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, AlertTriangle, XCircle, 
  Users, ChevronRight, Calculator, 
  Stethoscope, Calendar, CreditCard, FileText,
  ArrowRight, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface StatusData {
  // Contadores
  profissionaisAtivos: number;
  profissionaisSemCPF: number;
  profissionaisSemAdmissao: number;
  profissionaisSemSalario: number;
  asoVencidos: number;
  asoProximosVencer: number;
  feriasVencidas: number;
  feriasProximasVencer: number;
  emprestimosAtivos: number;
  lojas: number;
}

interface Pendencia {
  id: string;
  tipo: 'critico' | 'atencao' | 'info';
  titulo: string;
  descricao: string;
  quantidade: number;
  rota: string;
  icone: React.ElementType;
}

export function StatusOperacao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusData>({
    profissionaisAtivos: 0,
    profissionaisSemCPF: 0,
    profissionaisSemAdmissao: 0,
    profissionaisSemSalario: 0,
    asoVencidos: 0,
    asoProximosVencer: 0,
    feriasVencidas: 0,
    feriasProximasVencer: 0,
    emprestimosAtivos: 0,
    lojas: 0,
  });

  useEffect(() => {
    carregarStatus();
  }, []);

  const carregarStatus = async () => {
    try {
      const hoje = new Date();
      const em30Dias = new Date();
      em30Dias.setDate(em30Dias.getDate() + 30);

      const [
        profissionaisRes,
        asoRes,
        feriasRes,
        emprestimosRes,
        lojasRes
      ] = await Promise.all([
        supabase
          .from('profissionais')
          .select('id, cpf, data_admissao, salario_nominal, ultimo_salario, primeiro_salario')
          .eq('status', 'ativo'),
        supabase
          .from('exames_aso')
          .select('id, data_proximo_exame, profissional_id'),
        supabase
          .from('ferias')
          .select('id, periodo_aquisitivo_fim, status')
          .eq('status', 'pendente'),
        supabase
          .from('emprestimos')
          .select('id')
          .eq('status', 'ativo'),
        supabase
          .from('lojas')
          .select('id')
      ]);

      const profissionais = profissionaisRes.data || [];
      const aso = asoRes.data || [];
      const ferias = feriasRes.data || [];
      const emprestimos = emprestimosRes.data || [];
      const lojas = lojasRes.data || [];

      // Calcular métricas
      const semCPF = profissionais.filter(p => !p.cpf || p.cpf === '').length;
      const semAdmissao = profissionais.filter(p => !p.data_admissao).length;
      const semSalario = profissionais.filter(p => 
        (!p.salario_nominal || p.salario_nominal === 0) && 
        (!p.ultimo_salario || p.ultimo_salario === 0) && 
        (!p.primeiro_salario || p.primeiro_salario === 0)
      ).length;

      // ASO vencidos e próximos a vencer
      const asoVencidos = aso.filter(a => 
        a.data_proximo_exame && new Date(a.data_proximo_exame) < hoje
      ).length;
      const asoProximos = aso.filter(a => 
        a.data_proximo_exame && 
        new Date(a.data_proximo_exame) >= hoje && 
        new Date(a.data_proximo_exame) <= em30Dias
      ).length;

      // Férias vencidas (período aquisitivo já passou)
      const feriasVencidas = ferias.filter(f => 
        f.periodo_aquisitivo_fim && new Date(f.periodo_aquisitivo_fim) < hoje
      ).length;
      const feriasProximas = ferias.filter(f => 
        f.periodo_aquisitivo_fim && 
        new Date(f.periodo_aquisitivo_fim) >= hoje && 
        new Date(f.periodo_aquisitivo_fim) <= em30Dias
      ).length;

      setStatus({
        profissionaisAtivos: profissionais.length,
        profissionaisSemCPF: semCPF,
        profissionaisSemAdmissao: semAdmissao,
        profissionaisSemSalario: semSalario,
        asoVencidos,
        asoProximosVencer: asoProximos,
        feriasVencidas,
        feriasProximasVencer: feriasProximas,
        emprestimosAtivos: emprestimos.length,
        lojas: lojas.length,
      });
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gerar lista de pendências
  const pendencias: Pendencia[] = [];

  // Críticos (🔴)
  if (status.profissionaisSemCPF > 0) {
    pendencias.push({
      id: 'sem-cpf',
      tipo: 'critico',
      titulo: 'Profissionais sem CPF',
      descricao: 'CPF é obrigatório para folha de pagamento',
      quantidade: status.profissionaisSemCPF,
      rota: '/cadastro-profissionais',
      icone: Users,
    });
  }
  if (status.profissionaisSemAdmissao > 0) {
    pendencias.push({
      id: 'sem-admissao',
      tipo: 'critico',
      titulo: 'Profissionais sem data de admissão',
      descricao: 'Data de admissão é necessária para cálculos',
      quantidade: status.profissionaisSemAdmissao,
      rota: '/cadastro-profissionais',
      icone: Users,
    });
  }
  if (status.profissionaisSemSalario > 0) {
    pendencias.push({
      id: 'sem-salario',
      tipo: 'critico',
      titulo: 'Profissionais sem salário',
      descricao: 'Salário é obrigatório para cálculo de folha',
      quantidade: status.profissionaisSemSalario,
      rota: '/cadastro-profissionais',
      icone: CreditCard,
    });
  }
  if (status.asoVencidos > 0) {
    pendencias.push({
      id: 'aso-vencido',
      tipo: 'critico',
      titulo: 'Exames ASO vencidos',
      descricao: 'Risco trabalhista: exames obrigatórios vencidos',
      quantidade: status.asoVencidos,
      rota: '/gestao-aso',
      icone: Stethoscope,
    });
  }
  if (status.feriasVencidas > 0) {
    pendencias.push({
      id: 'ferias-vencidas',
      tipo: 'critico',
      titulo: 'Férias vencidas',
      descricao: 'Período aquisitivo já expirou',
      quantidade: status.feriasVencidas,
      rota: '/gestao-ferias',
      icone: Calendar,
    });
  }

  // Atenção (🟡)
  if (status.asoProximosVencer > 0) {
    pendencias.push({
      id: 'aso-proximo',
      tipo: 'atencao',
      titulo: 'ASO próximos a vencer',
      descricao: 'Vencem nos próximos 30 dias',
      quantidade: status.asoProximosVencer,
      rota: '/gestao-aso',
      icone: Stethoscope,
    });
  }
  if (status.feriasProximasVencer > 0) {
    pendencias.push({
      id: 'ferias-proximas',
      tipo: 'atencao',
      titulo: 'Férias próximas a vencer',
      descricao: 'Período aquisitivo vence em 30 dias',
      quantidade: status.feriasProximasVencer,
      rota: '/gestao-ferias',
      icone: Calendar,
    });
  }

  const criticos = pendencias.filter(p => p.tipo === 'critico');
  const atencao = pendencias.filter(p => p.tipo === 'atencao');

  const tudoOk = pendencias.length === 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Status da Operação
          </div>
          <div className="flex items-center gap-2">
            {tudoOk ? (
              <Badge className="bg-success text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Tudo OK
              </Badge>
            ) : (
              <>
                {criticos.length > 0 && (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    {criticos.length} crítico(s)
                  </Badge>
                )}
                {atencao.length > 0 && (
                  <Badge className="bg-warning text-warning-foreground">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {atencao.length} atenção
                  </Badge>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold text-foreground">{status.profissionaisAtivos}</p>
            <p className="text-xs text-muted-foreground">Profissionais</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold text-foreground">{status.lojas}</p>
            <p className="text-xs text-muted-foreground">Lojas</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-2xl font-bold text-foreground">{status.emprestimosAtivos}</p>
            <p className="text-xs text-muted-foreground">Empréstimos</p>
          </div>
          <div className="p-3 rounded-lg bg-success/10 text-center">
            <p className="text-2xl font-bold text-success">
              {status.profissionaisAtivos - status.profissionaisSemCPF - status.profissionaisSemSalario}
            </p>
            <p className="text-xs text-success">Prontos p/ Folha</p>
          </div>
        </div>

        {/* Lista de pendências */}
        {pendencias.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pendências que precisam de ação:</p>
              {pendencias.map((p) => {
                const Icon = p.icone;
                return (
                  <Link 
                    key={p.id} 
                    to={p.rota}
                    className={`
                      flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm
                      ${p.tipo === 'critico' 
                        ? 'border-destructive/50 bg-destructive/5 hover:bg-destructive/10' 
                        : 'border-warning/50 bg-warning/5 hover:bg-warning/10'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-2 rounded-lg
                        ${p.tipo === 'critico' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}
                      `}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground">{p.descricao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={p.tipo === 'critico' ? 'destructive' : 'secondary'}>
                        {p.quantidade}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Tudo OK */}
        {tudoOk && (
          <Alert className="border-success/50 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">Sistema pronto para uso</AlertTitle>
            <AlertDescription>
              Todos os dados estão completos. Você pode simular e fechar a folha de pagamento.
            </AlertDescription>
          </Alert>
        )}

        {/* CTA Principal */}
        <div className="pt-2">
          <Button 
            className="w-full h-12 text-base gap-2"
            size="lg"
            onClick={() => navigate('/simulador-folha')}
          >
            <Calculator className="h-5 w-5" />
            Simular Folha
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Calendar, 
  Users, 
  FileX, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Info,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { buildEditCampoUrl } from '@/lib/profissionalDeepLink';

interface ProfRef { id: string; nome: string; matricula: string }
interface DadosFaltantes {
  ferias: { total: number; pendentes: number };
  faltas: { total: number; mesAtual: number };
  aso: { total: number; vencidos: number; semExame: number };
  profissionais: {
    total: number;
    semLoja: number;
    semCargo: number;
    semDataAdmissao: number;
    semCpf: number;
    semSalario: number;
    listas: {
      semCpf: ProfRef[];
      semDataAdmissao: ProfRef[];
      semSalario: ProfRef[];
      semCargo: ProfRef[];
      semLoja: ProfRef[];
    };
  };
}

export function DadosFaltantesAlert({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const [dados, setDados] = useState<DadosFaltantes | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [
        profissionaisRes,
        feriasRes,
        faltasRes,
        asoRes
      ] = await Promise.all([
        supabase
          .from('profissionais')
          .select('id, nome, matricula, loja_id, cargo, data_admissao, cpf, salario_nominal, ultimo_salario, primeiro_salario')
          .eq('status', 'ativo'),
        supabase
          .from('ferias')
          .select('id, status'),
        supabase
          .from('faltas')
          .select('id, data_falta'),
        supabase
          .from('exames_aso')
          .select('id, data_proximo_exame, profissional_id')
      ]);

      const profissionais = profissionaisRes.data || [];
      const ferias = feriasRes.data || [];
      const faltas = faltasRes.data || [];
      const aso = asoRes.data || [];

      const hoje = new Date();
      const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

      // Profissionais sem exame ASO
      const profissionaisComASO = new Set(aso.map(a => a.profissional_id));
      const profissionaisSemASO = profissionais.filter(p => !profissionaisComASO.has(p.id)).length;

      const semCpfList = profissionais.filter(p => !p.cpf || p.cpf === '');
      const semDataAdmissaoList = profissionais.filter(p => !p.data_admissao);
      const semSalarioList = profissionais.filter(p =>
        (!p.salario_nominal || p.salario_nominal === 0) &&
        (!p.ultimo_salario || p.ultimo_salario === 0) &&
        (!p.primeiro_salario || p.primeiro_salario === 0)
      );
      const semCargoList = profissionais.filter(p => !p.cargo);
      const semLojaList = profissionais.filter(p => !p.loja_id);

      const toRef = (p: any): ProfRef => ({ id: p.id, nome: p.nome, matricula: p.matricula });

      setDados({
        profissionais: {
          total: profissionais.length,
          semLoja: semLojaList.length,
          semCargo: semCargoList.length,
          semDataAdmissao: semDataAdmissaoList.length,
          semCpf: semCpfList.length,
          semSalario: semSalarioList.length,
          listas: {
            semCpf: semCpfList.slice(0, 20).map(toRef),
            semDataAdmissao: semDataAdmissaoList.slice(0, 20).map(toRef),
            semSalario: semSalarioList.slice(0, 20).map(toRef),
            semCargo: semCargoList.slice(0, 20).map(toRef),
            semLoja: semLojaList.slice(0, 20).map(toRef),
          },
        },
        ferias: {
          total: ferias.length,
          pendentes: ferias.filter(f => f.status === 'pendente').length
        },
        faltas: {
          total: faltas.length,
          mesAtual: faltas.filter(f => f.data_falta?.startsWith(mesAtual)).length
        },
        aso: {
          total: aso.length,
          vencidos: aso.filter(a => a.data_proximo_exame && new Date(a.data_proximo_exame) < hoje).length,
          semExame: profissionaisSemASO
        }
      });
    } catch (error) {
      console.error('Erro ao carregar dados faltantes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dados) return null;

  const alertas = [
    {
      tipo: 'ferias',
      titulo: 'Férias não cadastradas',
      descricao: `${dados.ferias.total === 0 ? 'Nenhum registro de férias encontrado' : `${dados.ferias.pendentes} períodos pendentes de agendamento`}`,
      icone: Calendar,
      rota: '/gestao-ferias',
      acao: 'Cadastrar Férias',
      quantidade: dados.ferias.total === 0 ? dados.profissionais.total : dados.ferias.pendentes,
      critico: dados.ferias.total === 0
    },
    {
      tipo: 'faltas',
      titulo: 'Faltas do mês',
      descricao: dados.faltas.total === 0 
        ? 'Nenhuma falta lançada — presume-se presença completa. Lance manualmente, importe planilha ou solicite atualização.'
        : `${dados.faltas.mesAtual} faltas registradas este mês`,
      icone: FileX,
      rota: '/faltas',
      acao: dados.faltas.total === 0 ? 'Lançar / Importar Faltas' : 'Ver Faltas',
      quantidade: dados.faltas.mesAtual,
      critico: false,
      info: dados.faltas.total === 0
    },
    {
      tipo: 'aso',
      titulo: 'Exames ASO pendentes',
      descricao: `${dados.aso.vencidos} vencidos, ${dados.aso.semExame} profissionais sem exame`,
      icone: AlertTriangle,
      rota: '/gestao-aso',
      acao: 'Gerenciar ASO',
      quantidade: dados.aso.vencidos + dados.aso.semExame,
      critico: dados.aso.vencidos > 0 || dados.aso.semExame > 10
    },
    {
      tipo: 'profissionais',
      titulo: 'Dados incompletos',
      descricao: `${dados.profissionais.semDataAdmissao} sem data admissão, ${dados.profissionais.semCpf} sem CPF`,
      icone: Users,
      rota: '/cadastro-profissionais',
      acao: 'Completar Dados',
      quantidade: dados.profissionais.semDataAdmissao + dados.profissionais.semCpf + dados.profissionais.semSalario,
      critico: dados.profissionais.semDataAdmissao > 0 || dados.profissionais.semCpf > 0 || dados.profissionais.semSalario > 0
    }
  ].filter(a => a.quantidade > 0 || a.info);

  if (alertas.length === 0) {
    if (variant === 'compact') return null;
    return (
      <Alert className="border-success/50 bg-success/5">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Dados Completos</AlertTitle>
        <AlertDescription>
          Todos os dados necessários estão cadastrados no sistema.
        </AlertDescription>
      </Alert>
    );
  }

  const alertasCriticos = alertas.filter(a => a.critico);
  const alertasInfo = alertas.filter(a => !a.critico);

  if (variant === 'compact') {
    return (
      <Alert className="border-warning/50 bg-warning/5">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle className="flex items-center justify-between">
          <span className="text-warning">
            {alertasCriticos.length > 0 
              ? `${alertasCriticos.length} pendência(s) crítica(s)` 
              : `${alertas.length} item(s) para verificar`}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="h-6 px-2"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </AlertTitle>
        {expanded && (
          <AlertDescription className="mt-3 space-y-2">
            {alertas.map((alerta) => (
              <div key={alerta.tipo} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <alerta.icone className={`h-4 w-4 ${alerta.critico ? 'text-destructive' : 'text-warning'}`} />
                  <span className="text-sm">{alerta.titulo}</span>
                  {alerta.quantidade > 0 && (
                    <Badge variant={alerta.critico ? 'destructive' : 'secondary'} className="text-xs">
                      {alerta.quantidade}
                    </Badge>
                  )}
                </div>
                <Link to={alerta.rota}>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    {alerta.acao}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </AlertDescription>
        )}
      </Alert>
    );
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-warning">
          <Info className="h-5 w-5" />
          Dados que Precisam de Atenção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alertas.map((alerta) => (
          <div 
            key={alerta.tipo} 
            className={`flex items-center justify-between p-3 rounded-lg border ${
              alerta.critico 
                ? 'border-destructive/30 bg-destructive/5' 
                : 'border-muted'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${alerta.critico ? 'bg-destructive/10' : 'bg-muted'}`}>
                <alerta.icone className={`h-4 w-4 ${alerta.critico ? 'text-destructive' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-medium text-sm">{alerta.titulo}</p>
                <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {alerta.quantidade > 0 && (
                <Badge variant={alerta.critico ? 'destructive' : 'secondary'}>
                  {alerta.quantidade}
                </Badge>
              )}
              <Link to={alerta.rota}>
                <Button variant="outline" size="sm">
                  {alerta.acao}
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {/* Lista expandida: profissionais individuais com cada pendência,
            cada um com link direto para o campo no modal de edição. */}
        {(dados.profissionais.semCpf > 0 ||
          dados.profissionais.semDataAdmissao > 0 ||
          dados.profissionais.semSalario > 0 ||
          dados.profissionais.semCargo > 0 ||
          dados.profissionais.semLoja > 0) && (
          <div className="pt-2">
            <ProfissionaisPendenciasList listas={dados.profissionais.listas} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Lista profissionais com cadastro incompleto, agrupados por campo.
 * Cada item leva direto ao input no modal de edição via deep-link.
 */
function ProfissionaisPendenciasList({
  listas,
}: {
  listas: NonNullable<DadosFaltantes['profissionais']>['listas'];
}) {
  const grupos: { campo: string; titulo: string; itens: ProfRef[] }[] = [
    { campo: 'cpf', titulo: 'Sem CPF', itens: listas.semCpf },
    { campo: 'data_admissao', titulo: 'Sem data de admissão', itens: listas.semDataAdmissao },
    { campo: 'salario_nominal', titulo: 'Sem salário', itens: listas.semSalario },
    { campo: 'cargo', titulo: 'Sem cargo', itens: listas.semCargo },
    { campo: 'loja_id', titulo: 'Sem loja', itens: listas.semLoja },
  ].filter(g => g.itens.length > 0);

  if (grupos.length === 0) return null;

  return (
    <div className="space-y-3 border-t border-warning/20 pt-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Resolver pendência por profissional
      </p>
      {grupos.map(g => (
        <div key={g.campo} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{g.titulo}</Badge>
            <span className="text-xs text-muted-foreground">{g.itens.length} profissional(is)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {g.itens.map(p => (
              <Link key={p.id} to={buildEditCampoUrl(p.matricula, g.campo)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs border border-border hover:bg-warning/10 hover:border-warning/50"
                >
                  {p.nome}
                  <ExternalLink className="h-3 w-3 ml-1.5" />
                </Button>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

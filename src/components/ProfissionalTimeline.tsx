import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Clock, UserPlus, AlertTriangle, Stethoscope, Package, 
  Banknote, Calendar, FileText, ChevronDown, ChevronUp,
  Briefcase, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  tipo: 'admissao' | 'advertencia' | 'atestado' | 'emprestimo' | 'epi' | 'ferias' | 'afastamento' | 'salario' | 'transferencia';
  titulo: string;
  descricao: string;
  data: string;
  icone: React.ElementType;
  cor: string;
}

interface Props {
  profissionalId: string;
  profissionalNome?: string;
  dataAdmissao?: string | null;
  compact?: boolean;
}

const tipoConfig = {
  admissao: { icone: UserPlus, cor: 'bg-success/10 text-success border-success/20' },
  advertencia: { icone: AlertTriangle, cor: 'bg-destructive/10 text-destructive border-destructive/20' },
  atestado: { icone: FileText, cor: 'bg-warning/10 text-warning border-warning/20' },
  emprestimo: { icone: Banknote, cor: 'bg-primary/10 text-primary border-primary/20' },
  epi: { icone: Package, cor: 'bg-info/10 text-info border-info/20' },
  ferias: { icone: Calendar, cor: 'bg-accent/10 text-accent border-accent/20' },
  afastamento: { icone: Clock, cor: 'bg-muted text-muted-foreground border-muted' },
  salario: { icone: Briefcase, cor: 'bg-success/10 text-success border-success/20' },
  transferencia: { icone: MapPin, cor: 'bg-info/10 text-info border-info/20' },
  aso: { icone: Stethoscope, cor: 'bg-success/10 text-success border-success/20' }
};

export function ProfissionalTimeline({ profissionalId, profissionalNome, dataAdmissao, compact = false }: Props) {
  const [eventos, setEventos] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    carregarEventos();
  }, [profissionalId]);

  const carregarEventos = async () => {
    setLoading(true);
    const eventosTemp: TimelineEvent[] = [];

    try {
      // Evento de admissão
      if (dataAdmissao) {
        eventosTemp.push({
          id: 'admissao',
          tipo: 'admissao',
          titulo: 'Admissão',
          descricao: `${profissionalNome || 'Profissional'} foi admitido(a)`,
          data: dataAdmissao,
          icone: UserPlus,
          cor: tipoConfig.admissao.cor
        });
      }

      // Buscar dados em paralelo
      const [advertenciasRes, emprestimosRes, episRes, feriasRes, afastamentosRes, historicoRes, asoRes] = await Promise.all([
        supabase.from('advertencias').select('id, tipo, data_ocorrencia, motivo, descricao, created_at').eq('profissional_id', profissionalId),
        supabase.from('emprestimos').select('id, tipo, valor_total, valor_parcela, numero_parcelas, parcelas_pagas, saldo_devedor, status, data_inicio, data_previsao_termino, observacoes').eq('profissional_id', profissionalId),
        supabase.from('epis').select('id, nome_epi, numero_ca, categoria, data_entrega, data_validade, status').eq('profissional_id', profissionalId),
        supabase.from('ferias').select('id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim, periodo_gozo_inicio, periodo_gozo_fim, dias_direito, dias_gozados, status').eq('profissional_id', profissionalId),
        supabase.from('afastamentos').select('id, tipo, motivo, data_inicio, data_prevista_retorno, data_retorno_efetivo, status').eq('profissional_id', profissionalId),
        supabase.from('historico_salarios').select('id, salario_anterior, salario_novo, data_alteracao, motivo, tipo_alteracao, percentual_alteracao').eq('profissional_id', profissionalId),
        supabase.from('exames_aso').select('id, tipo_exame, data_ultimo_exame, data_proximo_exame, status, observacoes, clinica').eq('profissional_id', profissionalId)
      ]);

      // Advertências
      (advertenciasRes.data || []).forEach(adv => {
        eventosTemp.push({
          id: `adv-${adv.id}`,
          tipo: 'advertencia',
          titulo: `Advertência: ${adv.tipo}`,
          descricao: adv.motivo || 'Sem descrição',
          data: adv.data_ocorrencia,
          icone: AlertTriangle,
          cor: tipoConfig.advertencia.cor
        });
      });

      // Empréstimos
      (emprestimosRes.data || []).forEach(emp => {
        eventosTemp.push({
          id: `emp-${emp.id}`,
          tipo: 'emprestimo',
          titulo: `Empréstimo ${emp.tipo}`,
          descricao: `Valor: R$ ${Number(emp.valor_total || emp.valor_parcela * (emp.numero_parcelas || 1)).toLocaleString('pt-BR')}`,
          data: emp.data_inicio,
          icone: Banknote,
          cor: tipoConfig.emprestimo.cor
        });
      });

      // EPIs
      (episRes.data || []).forEach(epi => {
        eventosTemp.push({
          id: `epi-${epi.id}`,
          tipo: 'epi',
          titulo: `EPI: ${epi.nome_epi}`,
          descricao: epi.categoria || 'Entrega de equipamento',
          data: epi.data_entrega,
          icone: Package,
          cor: tipoConfig.epi.cor
        });
      });

      // Férias
      (feriasRes.data || []).forEach(fer => {
        if (fer.periodo_gozo_inicio) {
          eventosTemp.push({
            id: `fer-${fer.id}`,
            tipo: 'ferias',
            titulo: 'Férias',
            descricao: `${fer.dias_gozados || 30} dias`,
            data: fer.periodo_gozo_inicio,
            icone: Calendar,
            cor: tipoConfig.ferias.cor
          });
        }
      });

      // Afastamentos
      (afastamentosRes.data || []).forEach(af => {
        eventosTemp.push({
          id: `af-${af.id}`,
          tipo: 'afastamento',
          titulo: `Afastamento: ${af.tipo}`,
          descricao: af.motivo || 'Sem descrição',
          data: af.data_inicio,
          icone: Clock,
          cor: tipoConfig.afastamento.cor
        });
      });

      // Histórico de salários
      const tipoLabel: Record<string, string> = {
        ajuste_combinado: 'Salário Combinado',
        ajuste_ctps: 'Salário CTPS',
        ajuste_cadastro: 'Ajuste Cadastro',
        reajuste: 'Reajuste',
        dissidio: 'Dissídio',
        promocao: 'Promoção',
        merito: 'Mérito',
      };
      (historicoRes.data || []).forEach(hist => {
        const label = tipoLabel[hist.tipo_alteracao] || hist.tipo_alteracao;
        const pct = hist.percentual_alteracao ? ` (${hist.percentual_alteracao > 0 ? '+' : ''}${hist.percentual_alteracao}%)` : '';
        eventosTemp.push({
          id: `sal-${hist.id}`,
          tipo: 'salario',
          titulo: `${label}${pct}`,
          descricao: `R$ ${Number(hist.salario_anterior || 0).toLocaleString('pt-BR')} → R$ ${Number(hist.salario_novo).toLocaleString('pt-BR')}${hist.motivo ? ` — ${hist.motivo}` : ''}`,
          data: hist.data_alteracao,
          icone: Briefcase,
          cor: tipoConfig.salario.cor
        });
      });

      // ASO
      (asoRes.data || []).forEach(aso => {
        if (aso.data_ultimo_exame) {
          eventosTemp.push({
            id: `aso-${aso.id}`,
            tipo: 'admissao', // usando mesmo estilo
            titulo: `Exame ASO: ${aso.tipo_exame}`,
            descricao: aso.clinica || 'Exame ocupacional realizado',
            data: aso.data_ultimo_exame,
            icone: Stethoscope,
            cor: tipoConfig.admissao.cor
          });
        }
      });

      // Ordenar por data decrescente
      eventosTemp.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      setEventos(eventosTemp);

    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd MMM yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact && !expanded) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Linha do Tempo
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            {eventos.length} evento(s) registrado(s)
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Linha do Tempo
          </CardTitle>
          {compact && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum evento registrado
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Linha vertical */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-4">
                {eventos.map((evento, index) => {
                  const Icon = evento.icone;
                  return (
                    <div key={evento.id} className="relative flex gap-4 pl-2">
                      {/* Ícone */}
                      <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${evento.cor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{evento.titulo}</p>
                            <p className="text-xs text-muted-foreground">{evento.descricao}</p>
                          </div>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {formatarData(evento.data)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

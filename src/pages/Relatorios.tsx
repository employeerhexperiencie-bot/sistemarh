import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Download, Filter, Users, Building2, Calendar,
  AlertTriangle, CheckCircle, Clock, DollarSign, Loader2, ShoppingBasket, Bus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getCompetenciaAtual, getCompetenciasDisponiveis, formatCompetencia } from '@/lib/competencia';
import { calcularFolhaProfissional, formatCurrency } from '@/lib/payrollCalculator';
import { carregarDadosCompetenciaFromDB, buildProfissionalInput, getDefaultConfig } from '@/lib/buildProfissionalInput';
import {
  gerarRelatorioDia20,
  gerarRelatorioDia5,
  gerarRelatorioVT,
  gerarRelatorioCesta,
  gerarRelatorioAlelo,
  gerarRecibos3PorPagina,
  exportarCSV,
  type ProfissionalRelatorio,
  type ConfigRelatorio,
} from '@/lib/relatoriosPDF';

type TipoRelatorio = 'dia_20' | 'dia_5' | 'vt' | 'cesta' | 'alelo' | 'recibos';

const TIPOS_RELATORIO: { id: TipoRelatorio; nome: string; descricao: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }[] = [
  { id: 'dia_20', nome: 'Adiantamento Dia 20', descricao: 'Relatório de adiantamento salarial (40%) por loja', icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/5', borderColor: 'border-primary/20' },
  { id: 'dia_5', nome: 'Folha Pagamento Dia 5', descricao: 'Folha completa com descontos e líquido por profissional', icon: FileText, color: 'text-accent', bgColor: 'bg-accent/5', borderColor: 'border-accent/20' },
  { id: 'vt', nome: 'Vale Transporte', descricao: 'Relatório de VT por profissional com dias trabalhados', icon: Bus, color: 'text-info', bgColor: 'bg-info/5', borderColor: 'border-info/20' },
  { id: 'cesta', nome: 'Cesta Básica', descricao: 'Relatório de cesta básica com campo de assinatura', icon: ShoppingBasket, color: 'text-warning', bgColor: 'bg-warning/5', borderColor: 'border-warning/20' },
  { id: 'alelo', nome: 'VA Alelo', descricao: 'Vale Alimentação Alelo com CPF e nome da mãe', icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/5', borderColor: 'border-destructive/20' },
  { id: 'recibos', nome: 'Recibos (3/página)', descricao: 'Recibos de pagamento, 3 por página A4 com assinatura', icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/5', borderColor: 'border-success/20' },
];

export default function Relatorios() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [competencia, setCompetencia] = useState(getCompetenciaAtual());
  const [loja, setLoja] = useState('TODAS');
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('dia_20');
  const [lojas, setLojas] = useState<{ id: string; nome: string; cnpj?: string }[]>([]);
  const [stats, setStats] = useState({ totalLojas: 0, totalProfissionais: 0, feriasAgendadas: 0, alertasAtivos: 0 });

  const competencias = getCompetenciasDisponiveis(6, 1);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lojasRes, profRes, feriasRes, alertasRes] = await Promise.all([
        supabase.from('lojas').select('id, nome, cnpj'),
        supabase.from('profissionais').select('id').eq('status', 'ativo'),
        supabase.from('ferias').select('id').eq('status', 'agendada'),
        supabase.from('alertas_sistema').select('id').eq('lido', false),
      ]);
      setLojas(lojasRes.data || []);
      setStats({
        totalLojas: lojasRes.data?.length || 0,
        totalProfissionais: profRes.data?.length || 0,
        feriasAgendadas: feriasRes.data?.length || 0,
        alertasAtivos: alertasRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDadosRelatorio = useCallback(async (): Promise<ProfissionalRelatorio[]> => {
    // Buscar profissionais
    let query = supabase.from('profissionais').select('*, lojas!profissionais_loja_id_fkey(nome, cnpj)').eq('status', 'ativo');
    if (loja !== 'TODAS') {
      const lojaObj = lojas.find(l => l.nome === loja);
      if (lojaObj) query = query.eq('loja_id', lojaObj.id);
    }
    const { data: profissionais } = await query;
    if (!profissionais?.length) return [];

    // Carregar dados da competência e calcular
    const dadosComp = await carregarDadosCompetenciaFromDB(competencia);
    const config = getDefaultConfig(competencia);

    return profissionais.map((p: any) => {
      const input = buildProfissionalInput(p, dadosComp);
      const resultado = calcularFolhaProfissional(input, config);
      return {
        nome: p.nome,
        matricula: p.matricula,
        cpf: p.cpf || '',
        cargo: p.cargo || '',
        loja: p.lojas?.nome || 'Sem loja',
        salarioBase: input.salario,
        dataAdmissao: p.data_admissao,
        nomeMae: (p as any).nome_mae || '',
        valorDia20: resultado.valorDia20,
        valorDia5: resultado.salarioLiquido,
        valorVT: resultado.valorVT,
        valorVR: resultado.valorVR,
        valorCesta: resultado.valorCesta,
        valorAlelo: p.valor_vale_alimentacao || 0,
        diasTrabalhados: resultado.diasTrabalhados,
        diasUteis: resultado.diasUteis,
        faltas: input.faltas,
        descontoFaltas: resultado.descontoFaltas,
        emprestimo: input.emprestimos || 0,
        vales: input.vales || 0,
        totalDescontos: resultado.totalDescontos,
        insalubridade: resultado.valorInsalubridade,
      };
    });
  }, [competencia, loja, lojas]);

  const getConfig = (): ConfigRelatorio => {
    const lojaObj = loja !== 'TODAS' ? lojas.find(l => l.nome === loja) : null;
    return {
      empresaNome: 'Tennessee Prime',
      empresaCNPJ: lojaObj?.cnpj || '00.000.000/0001-00',
      competencia: formatCompetencia(competencia),
      loja: loja !== 'TODAS' ? loja : undefined,
      geradoPor: user?.email || 'Sistema',
    };
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const profs = await carregarDadosRelatorio();
      if (!profs.length) { toast.error('Nenhum profissional encontrado para os filtros selecionados'); return; }

      const config = getConfig();
      let doc;

      switch (tipoRelatorio) {
        case 'dia_20': doc = gerarRelatorioDia20(profs, config); break;
        case 'dia_5': doc = gerarRelatorioDia5(profs, config); break;
        case 'vt': doc = gerarRelatorioVT(profs, config); break;
        case 'cesta': doc = gerarRelatorioCesta(profs, config); break;
        case 'alelo': doc = gerarRelatorioAlelo(profs, config); break;
        case 'recibos': doc = gerarRecibos3PorPagina(profs, config); break;
      }

      doc.save(`relatorio_${tipoRelatorio}_${competencia}${loja !== 'TODAS' ? `_${loja.replace(/\s+/g, '_')}` : ''}.pdf`);
      toast.success(`Relatório ${TIPOS_RELATORIO.find(t => t.id === tipoRelatorio)?.nome} gerado!`);

      // Registrar no histórico
      await supabase.from('historico_acoes').insert({
        usuario: user?.email || 'Sistema',
        acao: 'exportacao_relatorio',
        modulo: 'relatorios',
        entidade_tipo: 'relatorio',
        entidade_id: tipoRelatorio,
        descricao: `Relatório ${tipoRelatorio} exportado em PDF - ${formatCompetencia(competencia)} - ${profs.length} profissionais`,
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast.error(error.message || 'Erro ao gerar relatório');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const profs = await carregarDadosRelatorio();
      if (!profs.length) { toast.error('Nenhum profissional encontrado'); return; }
      exportarCSV(profs, tipoRelatorio, getConfig());
      toast.success('CSV exportado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const relatorioAtivo = TIPOS_RELATORIO.find(t => t.id === tipoRelatorio);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios e Exportações</h1>
        <p className="text-muted-foreground">Gere relatórios PDF com dados reais do sistema</p>
      </div>

      {/* Filtros */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Competência</Label>
              <Select value={competencia} onValueChange={setCompetencia}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {competencias.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Loja</Label>
              <Select value={loja} onValueChange={setLoja}>
                <SelectTrigger><SelectValue placeholder="Todas as lojas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as lojas</SelectItem>
                  {lojas.map(l => (
                    <SelectItem key={l.id} value={l.nome}>{l.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="text-sm text-muted-foreground">
                {stats.totalProfissionais} profissionais • {stats.totalLojas} lojas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipos de Relatório */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TIPOS_RELATORIO.map(rel => (
          <Card
            key={rel.id}
            className={`transition-all cursor-pointer hover:shadow-md ${rel.bgColor} ${rel.borderColor} ${tipoRelatorio === rel.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
            onClick={() => setTipoRelatorio(rel.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <rel.icon className={`h-10 w-10 ${rel.color}`} />
                {tipoRelatorio === rel.id && <Badge className="bg-primary">Selecionado</Badge>}
              </div>
              <CardTitle className="text-base mt-4">{rel.nome}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{rel.descricao}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exportar */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar: {relatorioAtivo?.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Configuração:</p>
              <p className="text-sm text-muted-foreground">
                {relatorioAtivo?.nome} • {formatCompetencia(competencia)} • {loja === 'TODAS' ? 'Todas as lojas' : loja}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleExportPDF} disabled={exporting} className="flex-1 min-w-[150px]">
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                Exportar PDF
              </Button>
              <Button onClick={handleExportCSV} disabled={exporting} variant="outline" className="flex-1 min-w-[150px]">
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{stats.totalLojas}</p>
                <p className="text-sm text-muted-foreground">Lojas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{stats.totalProfissionais}</p>
                <p className="text-sm text-muted-foreground">Profissionais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{stats.feriasAgendadas}</p>
                <p className="text-sm text-muted-foreground">Férias Agendadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{stats.alertasAtivos}</p>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

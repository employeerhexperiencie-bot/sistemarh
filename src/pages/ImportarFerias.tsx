import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Loader2, 
  Play,
  Info,
  Clock,
  Plane
} from 'lucide-react';

interface ProfissionalFerias {
  id: string;
  nome: string;
  matricula: string;
  loja: string;
  dataAdmissao: string | null;
  temFeriasRegistradas: boolean;
  periodosCalculados: {
    inicio: string;
    fim: string;
    vencido: boolean;
    diasParaVencer: number;
  }[];
}

export default function ImportarFerias() {
  const [profissionais, setProfissionais] = useState<ProfissionalFerias[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Buscar profissionais ativos com suas férias
      const [profRes, feriasRes] = await Promise.all([
        supabase
          .from('profissionais')
          .select(`
            id, nome, matricula, data_admissao,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          `)
          .eq('status', 'ativo')
          .order('nome'),
        supabase
          .from('ferias')
          .select('profissional_id')
      ]);

      if (profRes.error) throw profRes.error;

      const profissionaisComFerias = new Set((feriasRes.data || []).map(f => f.profissional_id));
      const hoje = new Date();

      const dados: ProfissionalFerias[] = (profRes.data || []).map((p: any) => {
        const periodos: ProfissionalFerias['periodosCalculados'] = [];
        
        if (p.data_admissao) {
          const dataAdm = new Date(p.data_admissao);
          let periodoInicio = new Date(dataAdm);
          
          // Calcular todos os períodos aquisitivos desde a admissão
          while (periodoInicio < hoje) {
            const periodoFim = new Date(periodoInicio);
            periodoFim.setFullYear(periodoFim.getFullYear() + 1);
            periodoFim.setDate(periodoFim.getDate() - 1);

            // Limite para gozo das férias (1 ano após término do período aquisitivo)
            const limiteGozo = new Date(periodoFim);
            limiteGozo.setFullYear(limiteGozo.getFullYear() + 1);

            const diasParaVencer = Math.ceil((limiteGozo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

            periodos.push({
              inicio: periodoInicio.toISOString().split('T')[0],
              fim: periodoFim.toISOString().split('T')[0],
              vencido: diasParaVencer < 0,
              diasParaVencer: diasParaVencer
            });

            // Próximo período
            periodoInicio = new Date(periodoFim);
            periodoInicio.setDate(periodoInicio.getDate() + 1);
          }
        }

        return {
          id: p.id,
          nome: p.nome,
          matricula: p.matricula,
          loja: p.lojas?.nome || 'Sem loja',
          dataAdmissao: p.data_admissao,
          temFeriasRegistradas: profissionaisComFerias.has(p.id),
          periodosCalculados: periodos
        };
      });

      setProfissionais(dados);
      
      // Selecionar automaticamente quem não tem férias e tem data de admissão
      const paraSelecionar = dados
        .filter(p => !p.temFeriasRegistradas && p.dataAdmissao)
        .map(p => p.id);
      setSelecionados(new Set(paraSelecionar));

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelecionado = (id: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  };

  const selecionarTodos = () => {
    const todos = profissionais
      .filter(p => !p.temFeriasRegistradas && p.dataAdmissao)
      .map(p => p.id);
    setSelecionados(new Set(todos));
  };

  const deselecionarTodos = () => {
    setSelecionados(new Set());
  };

  const gerarFerias = async () => {
    const profissionaisSelecionados = profissionais.filter(p => selecionados.has(p.id));
    
    if (profissionaisSelecionados.length === 0) {
      toast.error('Selecione ao menos um profissional');
      return;
    }

    setProcessando(true);
    setProgresso(0);

    try {
      let processados = 0;
      let erros = 0;

      for (const prof of profissionaisSelecionados) {
        // Inserir cada período aquisitivo
        for (const periodo of prof.periodosCalculados) {
          const { error } = await supabase
            .from('ferias')
            .insert({
              profissional_id: prof.id,
              periodo_aquisitivo_inicio: periodo.inicio,
              periodo_aquisitivo_fim: periodo.fim,
              dias_direito: 30,
              dias_gozados: 0,
              status: periodo.vencido ? 'vencida' : 'pendente'
            });

          if (error) {
            console.error('Erro ao inserir férias:', error);
            erros++;
          }
        }
        
        processados++;
        setProgresso(Math.round((processados / profissionaisSelecionados.length) * 100));
      }

      if (erros > 0) {
        toast.warning(`Processamento concluído com ${erros} erros`);
      } else {
        toast.success(`Férias geradas para ${processados} profissionais`);
      }

      // Recarregar dados
      await carregarDados();
      setSelecionados(new Set());

    } catch (error) {
      console.error('Erro ao gerar férias:', error);
      toast.error('Erro ao processar férias');
    } finally {
      setProcessando(false);
      setProgresso(0);
    }
  };

  const semFerias = profissionais.filter(p => !p.temFeriasRegistradas);
  const semDataAdmissao = profissionais.filter(p => !p.dataAdmissao);
  const comFeriasVencidas = profissionais.filter(p => 
    p.periodosCalculados.some(periodo => periodo.vencido && !p.temFeriasRegistradas)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerar Férias Automaticamente</h1>
        <p className="text-muted-foreground">
          Gere os períodos aquisitivos de férias baseado na data de admissão de cada profissional
        </p>
      </div>

      {/* Alertas */}
      {semDataAdmissao.length > 0 && (
        <Alert className="border-warning/50 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Profissionais sem data de admissão</AlertTitle>
          <AlertDescription>
            {semDataAdmissao.length} profissionais não têm data de admissão cadastrada. 
            Complete os dados em "Cadastro de Profissionais" para gerar as férias.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{profissionais.length}</p>
                <p className="text-sm text-muted-foreground">Total de Profissionais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Calendar className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{semFerias.length}</p>
                <p className="text-sm text-muted-foreground">Sem Férias Cadastradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{comFeriasVencidas.length}</p>
                <p className="text-sm text-muted-foreground">Com Períodos Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{selecionados.size}</p>
                <p className="text-sm text-muted-foreground">Selecionados para Gerar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={selecionarTodos}>
                Selecionar Pendentes
              </Button>
              <Button variant="ghost" size="sm" onClick={deselecionarTodos}>
                Limpar Seleção
              </Button>
              <span className="text-sm text-muted-foreground">
                {selecionados.size} profissionais selecionados
              </span>
            </div>
            
            <Button 
              onClick={gerarFerias} 
              disabled={selecionados.size === 0 || processando}
              className="gap-2"
            >
              {processando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Gerar Férias ({selecionados.size})
                </>
              )}
            </Button>
          </div>
          
          {processando && (
            <div className="mt-4">
              <Progress value={progresso} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">{progresso}% concluído</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Como funciona</AlertTitle>
        <AlertDescription>
          O sistema calcula automaticamente os períodos aquisitivos baseado na data de admissão. 
          Cada período de 12 meses trabalhados gera direito a 30 dias de férias. 
          O limite para gozo é de 12 meses após o fim do período aquisitivo.
        </AlertDescription>
      </Alert>

      {/* Tabela de Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Profissionais e Períodos Aquisitivos
          </CardTitle>
          <CardDescription>
            Selecione os profissionais para gerar automaticamente os registros de férias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Data Admissão</TableHead>
                <TableHead>Períodos Calculados</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profissionais.map((prof) => (
                <TableRow 
                  key={prof.id}
                  className={prof.temFeriasRegistradas ? 'opacity-50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selecionados.has(prof.id)}
                      onCheckedChange={() => toggleSelecionado(prof.id)}
                      disabled={prof.temFeriasRegistradas || !prof.dataAdmissao}
                    />
                  </TableCell>
                  <TableCell className="font-mono">{prof.matricula}</TableCell>
                  <TableCell className="font-medium">{prof.nome}</TableCell>
                  <TableCell>{prof.loja}</TableCell>
                  <TableCell>
                    {prof.dataAdmissao 
                      ? new Date(prof.dataAdmissao).toLocaleDateString('pt-BR')
                      : <span className="text-destructive">Não informada</span>
                    }
                  </TableCell>
                  <TableCell>
                    {prof.periodosCalculados.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prof.periodosCalculados.slice(0, 3).map((periodo, idx) => (
                          <Badge 
                            key={idx} 
                            variant={periodo.vencido ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {new Date(periodo.inicio).getFullYear()}/{new Date(periodo.fim).getFullYear()}
                          </Badge>
                        ))}
                        {prof.periodosCalculados.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{prof.periodosCalculados.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {prof.temFeriasRegistradas ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Cadastrado
                      </Badge>
                    ) : !prof.dataAdmissao ? (
                      <Badge variant="destructive">
                        Sem data admissão
                      </Badge>
                    ) : prof.periodosCalculados.some(p => p.vencido) ? (
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Período vencido
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CheckCircle2, AlertTriangle, Loader2, Lock, FileText, 
  DollarSign, Users, Calendar, Sparkles, Banknote, ShieldAlert 
} from 'lucide-react';

interface CalculoProfissional {
  profissional: {
    id: string;
    nome: string;
    matricula: string;
    lojaId: string;
    salario: number;
    faltas: number;
    atestados: number;
    diasFerias: number;
    vales: number;
    emprestimos: number;
    pensao: number;
    status: string;
  };
  loja?: { id: string; nome: string };
  diasTrabalhados: number;
  recebeDia20: boolean;
  valorDia20: number;
  motivoDia20: string;
  valorVT: number;
  valorVR: number;
  recebeCesta: boolean;
  valorCesta: number;
  descontoFaltas: number;
  totalDescontos: number;
  salarioLiquido: number;
  totalMes: number;
}

interface TotaisGerais {
  totalDia20: number;
  totalDia5: number;
  totalVT: number;
  totalVR: number;
  totalCesta: number;
  totalEmprestimos: number;
  totalGeral: number;
  funcionarios: number;
}

interface Pendencia {
  tipo: string;
  descricao: string;
  quantidade: number;
  nivel: 'critico' | 'atencao';
}

interface FecharFolhaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competencia: string;
  calculosLote: CalculoProfissional[];
  totaisGerais: TotaisGerais;
  onSuccess: () => void;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function FecharFolhaModal({ 
  open, 
  onOpenChange, 
  competencia, 
  calculosLote,
  totaisGerais,
  onSuccess 
}: FecharFolhaModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'validating' | 'pendencias' | 'confirm' | 'processing' | 'success' | 'error'>('validating');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [confirmouRisco, setConfirmouRisco] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Verificar pendências ao abrir o modal
  const verificarPendencias = async () => {
    setStep('validating');
    const pendenciasEncontradas: Pendencia[] = [];
    
    try {
      const profissionaisIds = calculosLote.map(c => c.profissional.id);
      const hoje = new Date();
      
      // 1. ASO vencidos ou sem exame
      const { data: exames } = await supabase
        .from('exames_aso')
        .select('profissional_id, data_proximo_exame')
        .in('profissional_id', profissionaisIds);

      const profissionaisComASO = new Set((exames || []).map(e => e.profissional_id));
      const profissionaisSemASO = profissionaisIds.filter(id => !profissionaisComASO.has(id));
      const asoVencidosCount = (exames || []).filter(e => 
        e.data_proximo_exame && new Date(e.data_proximo_exame) < hoje
      ).length;

      if (profissionaisSemASO.length > 0) {
        pendenciasEncontradas.push({
          tipo: 'ASO Ausente',
          descricao: 'Profissionais sem exame ocupacional cadastrado',
          quantidade: profissionaisSemASO.length,
          nivel: 'critico',
        });
      }
      if (asoVencidosCount > 0) {
        pendenciasEncontradas.push({
          tipo: 'ASO Vencido',
          descricao: 'Exames ocupacionais com validade expirada',
          quantidade: asoVencidosCount,
          nivel: 'critico',
        });
      }

      // 2. Profissionais sem CPF
      const { data: profsSemCPF } = await supabase
        .from('profissionais')
        .select('id')
        .in('id', profissionaisIds)
        .or('cpf.is.null,cpf.eq.');
      
      if (profsSemCPF && profsSemCPF.length > 0) {
        pendenciasEncontradas.push({
          tipo: 'CPF Ausente',
          descricao: 'Profissionais sem CPF cadastrado',
          quantidade: profsSemCPF.length,
          nivel: 'critico',
        });
      }

      // 3. Férias vencidas
      const { data: feriasVencidas } = await supabase
        .from('ferias')
        .select('id')
        .in('profissional_id', profissionaisIds)
        .eq('status', 'pendente')
        .lt('periodo_aquisitivo_fim', hoje.toISOString().split('T')[0]);

      if (feriasVencidas && feriasVencidas.length > 0) {
        pendenciasEncontradas.push({
          tipo: 'Férias Vencidas',
          descricao: 'Períodos aquisitivos já expiraram',
          quantidade: feriasVencidas.length,
          nivel: 'atencao',
        });
      }

      // 4. Empréstimos em última parcela
      const { data: emprestimosUltima } = await supabase
        .from('emprestimos')
        .select('id, parcelas_pagas, numero_parcelas')
        .in('profissional_id', profissionaisIds)
        .eq('status', 'ativo');

      const emprestimosFinal = (emprestimosUltima || []).filter(e => 
        e.numero_parcelas && (e.parcelas_pagas || 0) + 1 >= e.numero_parcelas
      );

      if (emprestimosFinal.length > 0) {
        pendenciasEncontradas.push({
          tipo: 'Empréstimo Quitando',
          descricao: 'Empréstimos serão quitados nesta folha',
          quantidade: emprestimosFinal.length,
          nivel: 'atencao',
        });
      }

      setPendencias(pendenciasEncontradas);
      
      if (pendenciasEncontradas.length > 0) {
        setStep('pendencias');
      } else {
        setStep('confirm');
      }
    } catch (error) {
      console.error('Erro ao verificar pendências:', error);
      setStep('confirm');
    }
  };

  // Verificar ao abrir
  useEffect(() => {
    if (open) {
      setConfirmouRisco(false);
      verificarPendencias();
    }
  }, [open]);

  const handleFecharFolha = async () => {
    setIsProcessing(true);
    setStep('processing');
    setProgress(0);

    try {
      const totalRegistros = calculosLote.length;
      let processados = 0;

      // Verificar se já existe folha fechada para esta competência
      const { data: folhaExistente } = await supabase
        .from('folha_pagamento')
        .select('id')
        .eq('competencia', competencia)
        .limit(1);

      if (folhaExistente && folhaExistente.length > 0) {
        throw new Error(`Já existe folha fechada para a competência ${competencia}. Delete a folha existente antes de gerar uma nova.`);
      }

      setProgress(3);

      // ⭐ REGISTRAR AUTORIZAÇÃO SE HOUVER PENDÊNCIAS
      if (pendencias.length > 0) {
        const autorizacao = {
          acao: 'fechamento_folha_com_pendencias',
          modulo: 'folha',
          descricao: `Folha ${competencia} fechada com ${pendencias.length} pendência(s) ignorada(s)`,
          entidade_tipo: 'folha_pagamento',
          entidade_id: competencia,
          entidade_nome: `Folha ${competencia}`,
          dados_anteriores: null,
          dados_novos: JSON.stringify({
            pendencias_ignoradas: pendencias,
            total_funcionarios: totaisGerais.funcionarios,
            total_geral: totaisGerais.totalGeral,
            autorizado_por: user?.email || 'Sistema',
            autorizado_em: new Date().toISOString(),
          }),
          usuario: user?.email || 'Sistema',
        };
        
        await supabase.from('historico_acoes').insert([autorizacao]);
      }

      setProgress(5);

      // Preparar registros de folha_pagamento
      const folhaRecords = calculosLote.map(c => ({
        profissional_id: c.profissional.id,
        loja_id: c.profissional.lojaId !== 'sem-loja' ? c.profissional.lojaId : null,
        competencia: competencia,
        salario_base: c.profissional.salario,
        valor_dia20: c.valorDia20,
        elegivel_dia20: c.recebeDia20,
        motivo_dia20: c.motivoDia20,
        valor_dia5: c.salarioLiquido,
        valor_vt: c.valorVT,
        valor_vr: c.valorVR,
        valor_cesta_basica: c.valorCesta,
        desconto_faltas: c.descontoFaltas,
        desconto_vt: 0,
        desconto_vr: 0,
        desconto_inss: 0,
        desconto_ir: 0,
        desconto_sindicato: 0,
        desconto_pensao: c.profissional.pensao,
        outros_descontos: c.profissional.vales + c.profissional.emprestimos,
        horas_extras: 0,
        adicional_noturno: 0,
        bonus: 0,
        outras_adicoes: 0,
        total_proventos: c.profissional.salario + c.valorVT + c.valorVR + c.valorCesta,
        total_descontos: c.totalDescontos,
        valor_liquido: c.totalMes,
        dias_trabalhados: c.diasTrabalhados,
        faltas: c.profissional.faltas,
        atestados: c.profissional.atestados,
        dias_ferias: c.profissional.diasFerias,
        status: 'fechada'
      }));

      setProgress(15);

      // Inserir folha_pagamento em lotes de 50
      const batchSize = 50;
      for (let i = 0; i < folhaRecords.length; i += batchSize) {
        const batch = folhaRecords.slice(i, i + batchSize);
        const { error } = await supabase.from('folha_pagamento').insert(batch);
        
        if (error) {
          console.error('Erro ao inserir folha:', error);
          throw new Error(`Erro ao gravar folha de pagamento: ${error.message}`);
        }
        
        processados += batch.length;
        setProgress(15 + Math.round((processados / totalRegistros) * 35));
      }

      setProgress(50);

      // Atualizar empréstimos empresa (registrar parcela paga e atualizar saldo)
      const profissionaisComEmprestimo = calculosLote.filter(c => c.profissional.emprestimos > 0);
      
      for (const calc of profissionaisComEmprestimo) {
        // Buscar empréstimos ativos do profissional
        const { data: emprestimosAtivos } = await supabase
          .from('emprestimos')
          .select('*')
          .eq('profissional_id', calc.profissional.id)
          .eq('status', 'ativo');

        for (const emp of emprestimosAtivos || []) {
          const novasParcelasPagas = (emp.parcelas_pagas || 0) + 1;
          let novoSaldoDevedor = Number(emp.saldo_devedor) - Number(emp.valor_parcela);
          let novoStatus = emp.status;

          // Se é empréstimo empresa e todas as parcelas foram pagas
          if (emp.tipo === 'empresa' && emp.numero_parcelas && novasParcelasPagas >= emp.numero_parcelas) {
            novoStatus = 'quitado';
            novoSaldoDevedor = 0;
          }

          await supabase
            .from('emprestimos')
            .update({
              parcelas_pagas: novasParcelasPagas,
              saldo_devedor: Math.max(0, novoSaldoDevedor),
              status: novoStatus
            })
            .eq('id', emp.id);
        }
      }

      setProgress(55);

      // Preparar holerites
      const holeriteRecords = calculosLote.map(c => ({
        profissional_id: c.profissional.id,
        mes_referencia: `${competencia}-01`,
        salario_base: c.profissional.salario,
        horas_extras: 0,
        adicional_noturno: 0,
        adicional_periculosidade: 0,
        adicional_insalubridade: 0,
        outros_proventos: c.valorVT + c.valorVR + c.valorCesta,
        total_proventos: c.profissional.salario + c.valorVT + c.valorVR + c.valorCesta,
        inss: 0,
        irrf: 0,
        fgts: c.profissional.salario * 0.08,
        vale_transporte: 0,
        vale_refeicao: 0,
        adiantamento: c.valorDia20,
        emprestimo: c.profissional.emprestimos,
        pensao_alimenticia: c.profissional.pensao,
        faltas: c.descontoFaltas,
        outros_descontos: c.profissional.vales,
        total_descontos: c.totalDescontos + c.valorDia20,
        salario_liquido: c.salarioLiquido,
        base_inss: c.profissional.salario,
        base_irrf: c.profissional.salario,
        base_fgts: c.profissional.salario,
        status: 'gerado'
      }));

      setProgress(55);

      // Inserir holerites em lotes
      processados = 0;
      for (let i = 0; i < holeriteRecords.length; i += batchSize) {
        const batch = holeriteRecords.slice(i, i + batchSize);
        const { error } = await supabase.from('holerites').insert(batch);
        
        if (error) {
          console.error('Erro ao inserir holerite:', error);
          throw new Error(`Erro ao gerar holerites: ${error.message}`);
        }
        
        processados += batch.length;
        setProgress(55 + Math.round((processados / totalRegistros) * 40));
      }

      setProgress(100);
      setStep('success');

      toast({
        title: 'Folha fechada com sucesso!',
        description: `${totalRegistros} registros gerados para ${competencia}`,
      });

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setStep('confirm');
        setProgress(0);
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao fechar folha:', error);
      setErrorMessage(error.message || 'Erro desconhecido ao processar folha');
      setStep('error');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      setStep('confirm');
      setProgress(0);
      setErrorMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'validating' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {step === 'pendencias' && <ShieldAlert className="h-5 w-5 text-warning" />}
            {step === 'confirm' && <Lock className="h-5 w-5 text-primary" />}
            {step === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {step === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
            {step === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {step === 'validating' && 'Verificando pendências...'}
            {step === 'pendencias' && 'Pendências Identificadas'}
            {step === 'confirm' && 'Fechar Folha de Pagamento'}
            {step === 'processing' && 'Processando...'}
            {step === 'success' && 'Folha Fechada!'}
            {step === 'error' && 'Erro ao Processar'}
          </DialogTitle>
          <DialogDescription>
            {step === 'validating' && 'Analisando dados da folha...'}
            {step === 'pendencias' && 'O fechamento NÃO será bloqueado, mas você deve estar ciente dos riscos.'}
            {step === 'confirm' && 'Revise os valores antes de confirmar o fechamento.'}
            {step === 'processing' && 'Aguarde enquanto os dados são gravados no sistema.'}
            {step === 'success' && 'Todos os registros foram gravados com sucesso.'}
            {step === 'error' && 'Ocorreu um erro durante o processamento.'}
          </DialogDescription>
        </DialogHeader>

        {/* Tela de validação */}
        {step === 'validating' && (
          <div className="py-8 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando ASO, dados e conformidade...</p>
          </div>
        )}

        {/* Tela de pendências - NÃO BLOQUEIA, APENAS ALERTA */}
        {step === 'pendencias' && (
          <div className="space-y-4 py-4">
            <Alert className="border-warning/50 bg-warning/5">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">Atenção: Pendências detectadas</AlertTitle>
              <AlertDescription className="mt-1 text-sm text-muted-foreground">
                O sistema <strong>não bloqueará</strong> o fechamento, mas sua autorização será registrada.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pendencias.map((p, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    p.nivel === 'critico' 
                      ? 'border-destructive/30 bg-destructive/5' 
                      : 'border-warning/30 bg-warning/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${p.nivel === 'critico' ? 'text-destructive' : 'text-warning'}`} />
                    <div>
                      <p className="text-sm font-medium">{p.tipo}</p>
                      <p className="text-xs text-muted-foreground">{p.descricao}</p>
                    </div>
                  </div>
                  <Badge variant={p.nivel === 'critico' ? 'destructive' : 'secondary'}>
                    {p.quantidade}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
              <Checkbox 
                id="confirmar-risco" 
                checked={confirmouRisco}
                onCheckedChange={(checked) => setConfirmouRisco(checked === true)}
              />
              <label htmlFor="confirmar-risco" className="text-sm cursor-pointer">
                <strong>Estou ciente dos riscos</strong> e autorizo o fechamento da folha mesmo com as pendências listadas acima. Esta ação será registrada.
              </label>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                disabled={!confirmouRisco}
                onClick={() => setStep('confirm')}
              >
                Continuar para Fechamento
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4 py-4">
            {/* Aviso de ação definitiva */}
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle className="text-destructive">Ação Definitiva</AlertTitle>
              <AlertDescription>
                Ao confirmar, os valores serão gravados <strong>permanentemente</strong>. Esta ação gera:
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Registro definitivo da folha de pagamento</li>
                  <li>• Atualização de parcelas de empréstimos</li>
                  <li>• Geração de holerites para todos os funcionários</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Calendar className="h-3 w-3" />
                  Competência
                </div>
                <p className="text-lg font-bold">{competencia}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Users className="h-3 w-3" />
                  Funcionários
                </div>
                <p className="text-lg font-bold">{totaisGerais.funcionarios}</p>
              </div>
            </div>

            <Separator />

            {/* Valores */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dia 20 (Adiantamento)</span>
                <span className="font-medium">{formatCurrency(totaisGerais.totalDia20)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dia 5 (Salário)</span>
                <span className="font-medium">{formatCurrency(totaisGerais.totalDia5)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vale Transporte</span>
                <span className="font-medium">{formatCurrency(totaisGerais.totalVT)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vale Refeição</span>
                <span className="font-medium">{formatCurrency(totaisGerais.totalVR)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cesta Básica</span>
                <span className="font-medium">{formatCurrency(totaisGerais.totalCesta)}</span>
              </div>
              {totaisGerais.totalEmprestimos > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Banknote className="h-3 w-3" />
                    Empréstimos (descontos)
                  </span>
                  <span className="font-medium text-warning">{formatCurrency(totaisGerais.totalEmprestimos)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total Geral</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(totaisGerais.totalGeral)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-8 space-y-4">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {progress < 20 
                ? 'Gravando folha de pagamento...' 
                : progress < 55 
                ? 'Atualizando empréstimos...'
                : 'Gerando holerites...'}
            </p>
            <p className="text-center text-2xl font-bold">{progress}%</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="font-semibold text-lg">Folha Fechada com Sucesso!</p>
              <p className="text-sm text-muted-foreground">
                {totaisGerais.funcionarios} holerites gerados para {competencia}
              </p>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="py-4 space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro no processamento</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter>
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleFecharFolha} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Confirmar e Fechar Folha
              </Button>
            </>
          )}
          {step === 'error' && (
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
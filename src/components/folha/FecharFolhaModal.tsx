import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  CheckCircle2, AlertTriangle, Loader2, Lock, FileText, 
  DollarSign, Users, Calendar, Sparkles, Banknote 
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
  const [step, setStep] = useState<'aso_warning' | 'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [errorMessage, setErrorMessage] = useState('');
  const [asoVencidos, setAsoVencidos] = useState<number>(0);
  const { toast } = useToast();

  // Verificar ASO vencidos ao abrir o modal
  const verificarASOVencidos = async () => {
    try {
      const profissionaisIds = calculosLote.map(c => c.profissional.id);
      
      // Buscar profissionais sem ASO ou com ASO vencido
      const { data: exames } = await supabase
        .from('exames_aso')
        .select('profissional_id, data_proximo_exame')
        .in('profissional_id', profissionaisIds);

      const profissionaisComASO = new Set((exames || []).map(e => e.profissional_id));
      const profissionaisSemASO = profissionaisIds.filter(id => !profissionaisComASO.has(id));
      
      const hoje = new Date();
      const asoVencidosCount = (exames || []).filter(e => 
        e.data_proximo_exame && new Date(e.data_proximo_exame) < hoje
      ).length;

      const totalProblemas = profissionaisSemASO.length + asoVencidosCount;
      setAsoVencidos(totalProblemas);

      if (totalProblemas > 0) {
        setStep('aso_warning');
      } else {
        setStep('confirm');
      }
    } catch (error) {
      console.error('Erro ao verificar ASO:', error);
      setStep('confirm');
    }
  };

  // Verificar ao abrir
  useState(() => {
    if (open) {
      verificarASOVencidos();
    }
  });

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
            {step === 'aso_warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
            {step === 'confirm' && <Lock className="h-5 w-5 text-primary" />}
            {step === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {step === 'success' && <CheckCircle2 className="h-5 w-5 text-success" />}
            {step === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {step === 'aso_warning' && 'Atenção: ASO Pendente'}
            {step === 'confirm' && 'Fechar Folha de Pagamento'}
            {step === 'processing' && 'Processando...'}
            {step === 'success' && 'Folha Fechada!'}
            {step === 'error' && 'Erro ao Processar'}
          </DialogTitle>
          <DialogDescription>
            {step === 'aso_warning' && 'Existem profissionais com pendências de exame ocupacional.'}
            {step === 'confirm' && 'Revise os valores antes de confirmar o fechamento da folha.'}
            {step === 'processing' && 'Aguarde enquanto os dados são gravados no sistema.'}
            {step === 'success' && 'Todos os registros foram gravados com sucesso.'}
            {step === 'error' && 'Ocorreu um erro durante o processamento.'}
          </DialogDescription>
        </DialogHeader>

        {/* Alerta de ASO Vencido/Pendente */}
        {step === 'aso_warning' && (
          <div className="space-y-4 py-4">
            <Alert className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">Não conformidade trabalhista detectada</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="font-medium">
                  Existem <span className="text-destructive font-bold">{asoVencidos}</span> profissional(is) com ASO crítico vencido ou sem exame cadastrado.
                </p>
                <p className="text-sm mt-2 text-muted-foreground">
                  Isso representa um risco trabalhista. Deseja continuar mesmo assim?
                </p>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  handleClose();
                }}
              >
                Não, Voltar
              </Button>
              <Button 
                variant="default"
                className="flex-1 bg-warning hover:bg-warning/90 text-warning-foreground"
                onClick={() => setStep('confirm')}
              >
                Sim, Continuar
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
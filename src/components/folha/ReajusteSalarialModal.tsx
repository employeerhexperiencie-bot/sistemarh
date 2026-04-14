import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Percent, DollarSign, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrencyFromNumber } from '@/lib/utils';

interface ReajusteSalarialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profissional: {
    id: string;
    nome: string;
    matricula: string;
    salario_nominal: number;
    primeiro_salario: number;
  } | null;
  onSuccess: () => void;
}

type MetodoCalculo = 'percentual' | 'valor_fixo';
type CampoSalario = 'combinado' | 'ctps' | 'ambos';
type TipoReajuste = 'reajuste' | 'dissidio' | 'promocao' | 'merito';

export function ReajusteSalarialModal({ open, onOpenChange, profissional, onSuccess }: ReajusteSalarialModalProps) {
  const [metodo, setMetodo] = useState<MetodoCalculo>('percentual');
  const [campo, setCampo] = useState<CampoSalario>('combinado');
  const [tipo, setTipo] = useState<TipoReajuste>('reajuste');
  const [percentual, setPercentual] = useState('');
  const [valorNovo, setValorNovo] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!profissional) return null;

  const salarioCombinado = profissional.salario_nominal || 0;
  const salarioCtps = profissional.primeiro_salario || 0;

  const calcularNovoValor = (salarioAtual: number): number => {
    if (metodo === 'percentual') {
      const pct = parseFloat(percentual) || 0;
      return Math.round(salarioAtual * (1 + pct / 100));
    }
    return parseFloat(valorNovo) || salarioAtual;
  };

  const novoCombinado = campo !== 'ctps' ? calcularNovoValor(salarioCombinado) : salarioCombinado;
  const novoCtps = campo !== 'combinado' ? calcularNovoValor(salarioCtps) : salarioCtps;

  const pctCombinado = salarioCombinado > 0 ? ((novoCombinado - salarioCombinado) / salarioCombinado) * 100 : 0;
  const pctCtps = salarioCtps > 0 ? ((novoCtps - salarioCtps) / salarioCtps) * 100 : 0;

  const tipoLabels: Record<TipoReajuste, string> = {
    reajuste: 'Reajuste Geral',
    dissidio: 'Dissídio Coletivo',
    promocao: 'Promoção',
    merito: 'Mérito',
  };

  const handleSalvar = async () => {
    if (metodo === 'percentual' && !percentual) {
      toast.error('Informe o percentual de reajuste');
      return;
    }
    if (metodo === 'valor_fixo' && !valorNovo) {
      toast.error('Informe o novo valor do salário');
      return;
    }

    setLoading(true);
    try {
      const updates: Record<string, number> = {};
      const historico: any[] = [];

      if (campo !== 'ctps' && novoCombinado !== salarioCombinado) {
        updates.salario_nominal = novoCombinado;
        historico.push({
          profissional_id: profissional.id,
          salario_anterior: salarioCombinado,
          salario_novo: novoCombinado,
          data_alteracao: new Date().toISOString().split('T')[0],
          tipo_alteracao: tipo === 'reajuste' ? 'ajuste_combinado' : tipo,
          percentual_alteracao: Math.round(pctCombinado * 100) / 100,
          motivo: motivo || `${tipoLabels[tipo]} — Salário Combinado`,
        });
      }

      if (campo !== 'combinado' && novoCtps !== salarioCtps) {
        updates.primeiro_salario = novoCtps;
        historico.push({
          profissional_id: profissional.id,
          salario_anterior: salarioCtps,
          salario_novo: novoCtps,
          data_alteracao: new Date().toISOString().split('T')[0],
          tipo_alteracao: tipo === 'reajuste' ? 'ajuste_ctps' : tipo,
          percentual_alteracao: Math.round(pctCtps * 100) / 100,
          motivo: motivo || `${tipoLabels[tipo]} — Salário CTPS`,
        });
      }

      if (Object.keys(updates).length === 0) {
        toast.warning('Nenhuma alteração detectada');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('profissionais')
        .update(updates)
        .eq('id', profissional.id);

      if (updateError) throw updateError;

      if (historico.length > 0) {
        const { error: histError } = await supabase.from('historico_salarios').insert(historico);
        if (histError) throw histError;
      }

      toast.success(`Reajuste aplicado para ${profissional.nome}`);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro no reajuste:', error);
      toast.error(error?.message || 'Erro ao aplicar reajuste');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMetodo('percentual');
    setCampo('combinado');
    setTipo('reajuste');
    setPercentual('');
    setValorNovo('');
    setMotivo('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Reajuste Salarial
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Profissional info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-medium">{profissional.nome}</p>
            <p className="text-sm text-muted-foreground">Matrícula: {profissional.matricula}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span>Combinado: <strong>{formatCurrencyFromNumber(salarioCombinado)}</strong></span>
              {salarioCtps > 0 && (
                <span>CTPS: <strong>{formatCurrencyFromNumber(salarioCtps)}</strong></span>
              )}
            </div>
          </div>

          {/* Tipo de reajuste */}
          <div className="space-y-2">
            <Label>Tipo de Reajuste</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoReajuste)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reajuste">Reajuste Geral</SelectItem>
                <SelectItem value="dissidio">Dissídio Coletivo</SelectItem>
                <SelectItem value="promocao">Promoção</SelectItem>
                <SelectItem value="merito">Mérito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Qual salário alterar */}
          <div className="space-y-2">
            <Label>Qual salário alterar?</Label>
            <RadioGroup value={campo} onValueChange={(v) => setCampo(v as CampoSalario)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="combinado" id="campo-combinado" />
                <Label htmlFor="campo-combinado" className="font-normal cursor-pointer">Combinado</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ctps" id="campo-ctps" />
                <Label htmlFor="campo-ctps" className="font-normal cursor-pointer">CTPS</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="ambos" id="campo-ambos" />
                <Label htmlFor="campo-ambos" className="font-normal cursor-pointer">Ambos</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Método de cálculo */}
          <div className="space-y-2">
            <Label>Método</Label>
            <RadioGroup value={metodo} onValueChange={(v) => setMetodo(v as MetodoCalculo)} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percentual" id="metodo-pct" />
                <Label htmlFor="metodo-pct" className="font-normal cursor-pointer flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5" /> Percentual
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="valor_fixo" id="metodo-fixo" />
                <Label htmlFor="metodo-fixo" className="font-normal cursor-pointer flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" /> Novo Valor
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Input */}
          {metodo === 'percentual' ? (
            <div className="space-y-2">
              <Label>Percentual de Reajuste (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                placeholder="Ex: 5.5"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Novo Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorNovo}
                onChange={(e) => setValorNovo(e.target.value)}
                placeholder="Ex: 2500.00"
              />
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo / Observações</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo do reajuste..."
              rows={2}
            />
          </div>

          {/* Preview */}
          {(percentual || valorNovo) && (
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <p className="text-sm font-medium">Prévia do reajuste:</p>
              {campo !== 'ctps' && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">Combinado</Badge>
                  <span>{formatCurrencyFromNumber(salarioCombinado)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-bold text-primary">{formatCurrencyFromNumber(novoCombinado)}</span>
                  {pctCombinado !== 0 && (
                    <Badge variant={pctCombinado > 0 ? 'default' : 'destructive'} className="text-xs">
                      {pctCombinado > 0 ? '+' : ''}{pctCombinado.toFixed(2)}%
                    </Badge>
                  )}
                </div>
              )}
              {campo !== 'combinado' && salarioCtps > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">CTPS</Badge>
                  <span>{formatCurrencyFromNumber(salarioCtps)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-bold text-primary">{formatCurrencyFromNumber(novoCtps)}</span>
                  {pctCtps !== 0 && (
                    <Badge variant={pctCtps > 0 ? 'default' : 'destructive'} className="text-xs">
                      {pctCtps > 0 ? '+' : ''}{pctCtps.toFixed(2)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={loading}>
              {loading ? 'Salvando...' : 'Aplicar Reajuste'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

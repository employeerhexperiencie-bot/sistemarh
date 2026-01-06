import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, X, Building2, Banknote, Search } from 'lucide-react';
import { registrarHistoricoEmprestimo } from './HistoricoEmprestimos';

interface Profissional {
  id: string;
  nome: string;
  matricula: string;
  loja: string;
}

interface NovoEmprestimoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function NovoEmprestimoForm({ onSuccess, onCancel }: NovoEmprestimoFormProps) {
  const [loading, setLoading] = useState(false);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [searchProfissional, setSearchProfissional] = useState('');
  const [profissionaisFiltrados, setProfissionaisFiltrados] = useState<Profissional[]>([]);
  
  const [form, setForm] = useState({
    profissionalId: '',
    tipo: '' as 'empresa' | 'clt' | '',
    valorTotal: '',
    numeroParcelas: '',
    valorParcela: '',
    dataInicio: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  const profissionalSelecionado = profissionais.find(p => p.id === form.profissionalId);

  useEffect(() => {
    loadProfissionais();
  }, []);

  useEffect(() => {
    if (searchProfissional.length >= 2) {
      const filtered = profissionais.filter(p => 
        p.nome.toLowerCase().includes(searchProfissional.toLowerCase()) ||
        p.matricula.toLowerCase().includes(searchProfissional.toLowerCase())
      ).slice(0, 10);
      setProfissionaisFiltrados(filtered);
    } else {
      setProfissionaisFiltrados([]);
    }
  }, [searchProfissional, profissionais]);

  // Calcular valor da parcela automaticamente para empréstimo empresa
  useEffect(() => {
    if (form.tipo === 'empresa' && form.valorTotal && form.numeroParcelas) {
      const valorTotal = parseFloat(form.valorTotal);
      const numParcelas = parseInt(form.numeroParcelas);
      if (valorTotal > 0 && numParcelas > 0) {
        const valorParcela = (valorTotal / numParcelas).toFixed(2);
        setForm(prev => ({ ...prev, valorParcela }));
      }
    }
  }, [form.tipo, form.valorTotal, form.numeroParcelas]);

  const loadProfissionais = async () => {
    const { data: profs } = await supabase
      .from('profissionais')
      .select(`
        id, nome, matricula,
        lojas:loja_id (nome)
      `)
      .eq('status', 'ativo')
      .order('nome');

    const formatted: Profissional[] = (profs || []).map((p: any) => ({
      id: p.id,
      nome: p.nome,
      matricula: p.matricula,
      loja: p.lojas?.nome || 'Sem Loja'
    }));

    setProfissionais(formatted);
  };

  const handleSubmit = async () => {
    if (!form.profissionalId) {
      toast.error('Selecione um profissional');
      return;
    }
    if (!form.tipo) {
      toast.error('Selecione o tipo de empréstimo');
      return;
    }
    if (!form.valorParcela) {
      toast.error('Informe o valor da parcela');
      return;
    }
    if (!form.dataInicio) {
      toast.error('Informe a data de início');
      return;
    }

    if (form.tipo === 'empresa') {
      if (!form.valorTotal) {
        toast.error('Informe o valor total do empréstimo');
        return;
      }
      if (!form.numeroParcelas) {
        toast.error('Informe o número de parcelas');
        return;
      }
    }

    setLoading(true);

    try {
      const valorParcela = parseFloat(form.valorParcela);
      const valorTotal = form.tipo === 'empresa' ? parseFloat(form.valorTotal) : null;
      const numeroParcelas = form.tipo === 'empresa' ? parseInt(form.numeroParcelas) : null;
      
      // Calcular data de término para empréstimo empresa
      let dataPrevisaoTermino = null;
      if (form.tipo === 'empresa' && numeroParcelas) {
        const dataInicio = new Date(form.dataInicio);
        dataInicio.setMonth(dataInicio.getMonth() + numeroParcelas);
        dataPrevisaoTermino = dataInicio.toISOString().split('T')[0];
      }

      const { data, error } = await supabase.from('emprestimos').insert({
        profissional_id: form.profissionalId,
        tipo: form.tipo,
        valor_total: valorTotal,
        numero_parcelas: numeroParcelas,
        valor_parcela: valorParcela,
        saldo_devedor: valorTotal || valorParcela, // Para CLT, usa o valor da parcela como referência
        parcelas_pagas: 0,
        data_inicio: form.dataInicio,
        data_previsao_termino: dataPrevisaoTermino,
        status: 'ativo',
        observacoes: form.observacoes || null
      }).select().single();

      if (error) throw error;

      // Registrar no histórico
      await registrarHistoricoEmprestimo({
        emprestimoId: data.id,
        profissionalId: form.profissionalId,
        acao: 'criacao',
        campoAlterado: 'emprestimo',
        valorNovo: form.tipo === 'empresa' 
          ? `Empresa - R$ ${valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em ${numeroParcelas}x`
          : `CLT - R$ ${valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês`,
        observacao: form.observacoes || 'Novo empréstimo cadastrado'
      });

      toast.success('Empréstimo cadastrado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao cadastrar empréstimo:', error);
      toast.error('Erro ao cadastrar empréstimo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Seleção de Profissional */}
      <div className="space-y-2">
        <Label>Profissional</Label>
        {profissionalSelecionado ? (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{profissionalSelecionado.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Mat: {profissionalSelecionado.matricula} • {profissionalSelecionado.loja}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setForm(prev => ({ ...prev, profissionalId: '' }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                value={searchProfissional}
                onChange={(e) => setSearchProfissional(e.target.value)}
                className="pl-10"
              />
            </div>
            {profissionaisFiltrados.length > 0 && (
              <Card className="border border-muted">
                <CardContent className="p-0">
                  <div className="max-h-48 overflow-y-auto">
                    {profissionaisFiltrados.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setForm(prev => ({ ...prev, profissionalId: p.id }));
                          setSearchProfissional('');
                          setProfissionaisFiltrados([]);
                        }}
                      >
                        <p className="font-medium text-sm">{p.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.matricula} • {p.loja}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Tipo de Empréstimo */}
      <div className="space-y-2">
        <Label>Tipo de Empréstimo</Label>
        <div className="grid grid-cols-2 gap-3">
          <Card 
            className={`cursor-pointer transition-all ${form.tipo === 'empresa' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
            onClick={() => setForm(prev => ({ ...prev, tipo: 'empresa' }))}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Building2 className={`h-8 w-8 mb-2 ${form.tipo === 'empresa' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-medium">Empresa</p>
              <p className="text-xs text-muted-foreground">
                Empréstimo concedido pela empresa
              </p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${form.tipo === 'clt' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'}`}
            onClick={() => setForm(prev => ({ ...prev, tipo: 'clt' }))}
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Banknote className={`h-8 w-8 mb-2 ${form.tipo === 'clt' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-medium">CLT / Consignado</p>
              <p className="text-xs text-muted-foreground">
                Desconto em folha para terceiros
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campos condicionais baseado no tipo */}
      {form.tipo === 'empresa' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.valorTotal}
                onChange={(e) => setForm(prev => ({ ...prev, valorTotal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Número de Parcelas</Label>
              <Input
                type="number"
                min="1"
                max="60"
                placeholder="12"
                value={form.numeroParcelas}
                onChange={(e) => setForm(prev => ({ ...prev, numeroParcelas: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Valor da Parcela (R$)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Calculado automaticamente"
              value={form.valorParcela}
              onChange={(e) => setForm(prev => ({ ...prev, valorParcela: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Valor calculado automaticamente com base no total e parcelas
            </p>
          </div>
        </>
      )}

      {form.tipo === 'clt' && (
        <div className="space-y-2">
          <Label>Valor da Parcela Mensal (R$)</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Valor a descontar mensalmente"
            value={form.valorParcela}
            onChange={(e) => setForm(prev => ({ ...prev, valorParcela: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            Para empréstimos CLT/consignado, apenas o valor da parcela é necessário
          </p>
        </div>
      )}

      {form.tipo && (
        <>
          <div className="space-y-2">
            <Label>Data de Início do Desconto</Label>
            <Input
              type="date"
              value={form.dataInicio}
              onChange={(e) => setForm(prev => ({ ...prev, dataInicio: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre o empréstimo..."
              value={form.observacoes}
              onChange={(e) => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={2}
            />
          </div>
        </>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !form.tipo || !form.profissionalId}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Cadastrar Empréstimo
        </Button>
      </DialogFooter>
    </div>
  );
}

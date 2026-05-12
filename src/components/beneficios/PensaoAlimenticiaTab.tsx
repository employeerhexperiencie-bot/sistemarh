import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Scale, Plus, Edit, Eye, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { matchesSearch } from '@/lib/searchUtils';
import { toast } from 'sonner';

interface PensaoAlimenticia {
  id: string;
  profissional_id: string;
  profissional_nome: string;
  profissional_matricula: string;
  /** Incluídos para busca flexível (acentos/máscara) — não alteram regras de negócio. */
  profissional_cpf?: string | null;
  profissional_telefone?: string | null;
  profissional_celular?: string | null;
  loja: string;
  nome_beneficiario: string;
  cpf_beneficiario: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  operacao: string;
  chave_pix: string;
  nome_filho: string;
  tipo_calculo: string;
  percentual: number;
  valor_fixo: number;
  base_calculo: string;
  ativo: boolean;
}

interface Profissional {
  id: string;
  matricula: string;
  nome: string;
}

export function PensaoAlimenticiaTab() {
  const [pensoes, setPensoes] = useState<PensaoAlimenticia[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPensao, setEditingPensao] = useState<PensaoAlimenticia | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    profissional_id: '',
    nome_beneficiario: '',
    cpf_beneficiario: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo_conta: 'corrente',
    operacao: '',
    chave_pix: '',
    nome_filho: '',
    tipo_calculo: 'percentual',
    percentual: 0,
    valor_fixo: 0,
    base_calculo: 'liquido',
    data_inicio: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  useEffect(() => {
    loadData();
    loadProfissionais();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pensoes_alimenticias')
        .select(`
          *,
          profissionais:profissional_id(
            matricula, nome, cpf, telefone, celular,
            lojas:lojas!profissionais_loja_id_fkey(nome)
          )
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        profissional_id: p.profissional_id,
        profissional_nome: p.profissionais?.nome || '-',
        profissional_matricula: p.profissionais?.matricula || '-',
        profissional_cpf: p.profissionais?.cpf,
        profissional_telefone: p.profissionais?.telefone,
        profissional_celular: p.profissionais?.celular,
        loja: p.profissionais?.lojas?.nome || '-',
        nome_beneficiario: p.nome_beneficiario,
        cpf_beneficiario: p.cpf_beneficiario || '',
        banco: p.banco || '',
        agencia: p.agencia || '',
        conta: p.conta || '',
        tipo_conta: p.tipo_conta || 'corrente',
        operacao: p.operacao || '',
        chave_pix: p.chave_pix || '',
        nome_filho: p.nome_filho || '',
        tipo_calculo: p.tipo_calculo,
        percentual: p.percentual || 0,
        valor_fixo: p.valor_fixo || 0,
        base_calculo: p.base_calculo || 'liquido',
        ativo: p.ativo,
      }));

      setPensoes(mapped);
    } catch (error) {
      console.error('Erro ao carregar pensões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfissionais = async () => {
    const { data } = await supabase
      .from('profissionais')
      .select('id, matricula, nome')
      .eq('status', 'ativo')
      .order('nome');

    setProfissionais(data || []);
  };

  const handleSave = async () => {
    try {
      const payload = {
        profissional_id: formData.profissional_id,
        nome_beneficiario: formData.nome_beneficiario,
        cpf_beneficiario: formData.cpf_beneficiario || null,
        banco: formData.banco || null,
        agencia: formData.agencia || null,
        conta: formData.conta || null,
        tipo_conta: formData.tipo_conta,
        operacao: formData.operacao || null,
        chave_pix: formData.chave_pix || null,
        nome_filho: formData.nome_filho || null,
        tipo_calculo: formData.tipo_calculo,
        percentual: formData.tipo_calculo === 'percentual' ? formData.percentual : null,
        valor_fixo: formData.tipo_calculo === 'fixo' ? formData.valor_fixo : null,
        base_calculo: formData.base_calculo,
        data_inicio: formData.data_inicio,
        observacoes: formData.observacoes || null,
        ativo: true,
      };

      if (editingPensao) {
        const { error } = await supabase
          .from('pensoes_alimenticias')
          .update(payload)
          .eq('id', editingPensao.id);

        if (error) throw error;
        toast.success('Pensão atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('pensoes_alimenticias')
          .insert(payload);

        if (error) throw error;
        toast.success('Pensão cadastrada com sucesso!');
      }

      // Sincronizar campo pensao_alimenticia no cadastro do profissional
      const valorPensao = formData.tipo_calculo === 'percentual' ? formData.percentual : formData.valor_fixo;
      await supabase
        .from('profissionais')
        .update({ pensao_alimenticia: valorPensao })
        .eq('id', formData.profissional_id);

      setIsDialogOpen(false);
      setEditingPensao(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar pensão');
    }
  };

  const resetForm = () => {
    setFormData({
      profissional_id: '',
      nome_beneficiario: '',
      cpf_beneficiario: '',
      banco: '',
      agencia: '',
      conta: '',
      tipo_conta: 'corrente',
      operacao: '',
      chave_pix: '',
      nome_filho: '',
      tipo_calculo: 'percentual',
      percentual: 0,
      valor_fixo: 0,
      base_calculo: 'liquido',
      data_inicio: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
  };

  const handleEdit = (pensao: PensaoAlimenticia) => {
    setEditingPensao(pensao);
    setFormData({
      profissional_id: pensao.profissional_id,
      nome_beneficiario: pensao.nome_beneficiario,
      cpf_beneficiario: pensao.cpf_beneficiario,
      banco: pensao.banco,
      agencia: pensao.agencia,
      conta: pensao.conta,
      tipo_conta: pensao.tipo_conta,
      operacao: pensao.operacao,
      chave_pix: pensao.chave_pix,
      nome_filho: pensao.nome_filho,
      tipo_calculo: pensao.tipo_calculo,
      percentual: pensao.percentual,
      valor_fixo: pensao.valor_fixo,
      base_calculo: pensao.base_calculo,
      data_inicio: new Date().toISOString().split('T')[0],
      observacoes: '',
    });
    setIsDialogOpen(true);
  };

  const filteredPensoes = useMemo(
    () =>
      pensoes.filter((p) =>
        matchesSearch(searchTerm, [
          p.profissional_nome,
          p.profissional_matricula,
          p.profissional_cpf,
          p.profissional_telefone,
          p.profissional_celular,
          p.loja,
          p.nome_beneficiario,
          p.cpf_beneficiario,
          p.nome_filho,
          p.chave_pix,
        ])
      ),
    [pensoes, searchTerm]
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-600" />
            Pensões Alimentícias
          </h2>
          <p className="text-sm text-muted-foreground">
            {pensoes.length} pensões cadastradas
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPensao(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Pensão
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPensao ? 'Editar Pensão Alimentícia' : 'Cadastrar Pensão Alimentícia'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Funcionário */}
              <div className="space-y-2">
                <Label>Funcionário *</Label>
                <Select
                  value={formData.profissional_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, profissional_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {profissionais.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.matricula} - {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dependente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Filho/Dependente</Label>
                  <Input
                    value={formData.nome_filho}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_filho: e.target.value }))}
                    placeholder="Nome do dependente"
                  />
                </div>
              </div>

              {/* Beneficiário */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Dados do Beneficiário</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Beneficiário *</Label>
                    <Input
                      value={formData.nome_beneficiario}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome_beneficiario: e.target.value }))}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF do Beneficiário</Label>
                    <Input
                      value={formData.cpf_beneficiario}
                      onChange={(e) => setFormData(prev => ({ ...prev, cpf_beneficiario: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
              </div>

              {/* Dados Bancários */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Dados Bancários</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      value={formData.banco}
                      onChange={(e) => setFormData(prev => ({ ...prev, banco: e.target.value }))}
                      placeholder="Ex: Banco do Brasil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agência</Label>
                    <Input
                      value={formData.agencia}
                      onChange={(e) => setFormData(prev => ({ ...prev, agencia: e.target.value }))}
                      placeholder="0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conta</Label>
                    <Input
                      value={formData.conta}
                      onChange={(e) => setFormData(prev => ({ ...prev, conta: e.target.value }))}
                      placeholder="00000-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Conta</Label>
                    <Select
                      value={formData.tipo_conta}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_conta: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                        <SelectItem value="poupanca">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Operação (CEF)</Label>
                    <Input
                      value={formData.operacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, operacao: e.target.value }))}
                      placeholder="013"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input
                      value={formData.chave_pix}
                      onChange={(e) => setFormData(prev => ({ ...prev, chave_pix: e.target.value }))}
                      placeholder="CPF, telefone ou email"
                    />
                  </div>
                </div>
              </div>

              {/* Valores */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Cálculo do Valor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Cálculo</Label>
                    <Select
                      value={formData.tipo_calculo}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_calculo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual</SelectItem>
                        <SelectItem value="fixo">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.tipo_calculo === 'percentual' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Percentual (%)</Label>
                        <Input
                          type="number"
                          value={formData.percentual}
                          onChange={(e) => setFormData(prev => ({ ...prev, percentual: parseFloat(e.target.value) || 0 }))}
                          placeholder="30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Base de Cálculo</Label>
                        <Select
                          value={formData.base_calculo}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, base_calculo: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="liquido">Salário Líquido</SelectItem>
                            <SelectItem value="rendimentos">Rendimentos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label>Valor Fixo (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_fixo}
                        onChange={(e) => setFormData(prev => ({ ...prev, valor_fixo: parseFloat(e.target.value) || 0 }))}
                        placeholder="500.00"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.profissional_id || !formData.nome_beneficiario}>
                {editingPensao ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <Input
        placeholder="Buscar por funcionário, matrícula ou beneficiário..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Filho</TableHead>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredPensoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma pensão cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPensoes.map((pensao) => (
                    <TableRow key={pensao.id}>
                      <TableCell className="font-mono">{pensao.profissional_matricula}</TableCell>
                      <TableCell className="font-medium">{pensao.profissional_nome}</TableCell>
                      <TableCell>{pensao.loja}</TableCell>
                      <TableCell>{pensao.nome_filho || '-'}</TableCell>
                      <TableCell>{pensao.nome_beneficiario}</TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {pensao.banco}<br />
                          Ag: {pensao.agencia} / CC: {pensao.conta}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-amber-100 text-amber-700">
                          {pensao.tipo_calculo === 'percentual'
                            ? `${pensao.percentual}% do ${pensao.base_calculo}`
                            : formatCurrency(pensao.valor_fixo)
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(pensao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

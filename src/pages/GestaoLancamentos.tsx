import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ProfissionalAutocomplete } from '@/components/ProfissionalAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, DollarSign, ShoppingCart, Beef, Banknote, 
  Plus, Trash2, Edit2, Search, Download, FileText,
  AlertTriangle, CheckCircle2, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { toastError } from '@/lib/toastError';
import { matchesSearch } from '@/lib/searchUtils';

interface Vale {
  id: string;
  profissional_id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  data_lancamento: string;
  status: string;
  profissional?: { nome: string; matricula: string } | null;
}

interface LancamentoFinanceiro {
  id: string;
  profissional_id: string;
  mes_referencia: string;
  tipo: string;
  categoria: string;
  descricao: string;
  valor: number;
  observacoes: string | null;
  profissional?: { nome: string; matricula: string } | null;
}

interface BeneficioAdicional {
  id: string;
  profissional_id: string;
  mes_referencia: string;
  valor_vale_carne: number;
  valor_vale_dinheiro: number;
  valor_vale_alimentacao: number;
  profissional?: { nome: string; matricula: string } | null;
}

const CATEGORIAS_LANCAMENTO = [
  { value: 'vale_carne', label: 'Vale Carne', icon: Beef },
  { value: 'vale_dinheiro', label: 'Vale Dinheiro', icon: Banknote },
  { value: 'vale_alimentacao', label: 'Vale Alimentação', icon: ShoppingCart },
  { value: 'desconto_manual', label: 'Desconto Manual', icon: CreditCard },
  { value: 'outros', label: 'Outros Descontos', icon: DollarSign },
];

export default function GestaoLancamentos() {
  const [activeTab, setActiveTab] = useState<string>('vales');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Competência atual
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Dados
  const [vales, setVales] = useState<Vale[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [beneficios, setBeneficios] = useState<BeneficioAdicional[]>([]);
  
  // Modal de criação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'vale' | 'lancamento' | 'beneficio'>('vale');
  const [isSaving, setIsSaving] = useState(false);
  
  // Formulário
  const [formData, setFormData] = useState({
    profissional_id: '',
    tipo: '',
    categoria: '',
    valor: '',
    descricao: '',
    observacoes: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    // Campos de benefícios
    valor_vale_carne: '',
    valor_vale_dinheiro: '',
    valor_vale_alimentacao: '',
  });
  
  // Carregar dados
  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [ano, mes] = competencia.split('-').map(Number);
      const inicioMes = `${ano}-${String(mes).padStart(2, '0')}-01`;
      const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];
      
      const [valesRes, lancamentosRes, beneficiosRes] = await Promise.all([
        supabase
          .from('professional_vales')
          .select('*, profissional:profissionais(nome, matricula)')
          .gte('data_lancamento', inicioMes)
          .lte('data_lancamento', fimMes)
          .order('data_lancamento', { ascending: false }),
          
        supabase
          .from('lancamentos_financeiros')
          .select('*, profissional:profissionais(nome, matricula)')
          .eq('mes_referencia', inicioMes)
          .order('created_at', { ascending: false }),
          
        supabase
          .from('beneficios')
          .select('id, profissional_id, mes_referencia, valor_vale_carne, valor_vale_dinheiro, valor_vale_alimentacao, profissional:profissionais(nome, matricula)')
          .eq('mes_referencia', inicioMes)
          .or('valor_vale_carne.gt.0,valor_vale_dinheiro.gt.0,valor_vale_alimentacao.gt.0'),
      ]);
      
      setVales((valesRes.data as Vale[]) || []);
      setLancamentos((lancamentosRes.data as LancamentoFinanceiro[]) || []);
      setBeneficios((beneficiosRes.data as BeneficioAdicional[]) || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toastError(error, 'Erro ao carregar lançamentos');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    carregarDados();
  }, [competencia]);
  
  // Formatação
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  
  const parseCurrency = (value: string): number => {
    const numericValue = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(numericValue) || 0;
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      profissional_id: '',
      tipo: '',
      categoria: '',
      valor: '',
      descricao: '',
      observacoes: '',
      data_lancamento: new Date().toISOString().split('T')[0],
      valor_vale_carne: '',
      valor_vale_dinheiro: '',
      valor_vale_alimentacao: '',
    });
  };
  
  // Salvar Vale
  const handleSaveVale = async () => {
    if (!formData.profissional_id || !formData.valor) {
      toast.error('Preencha o profissional e o valor');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('professional_vales').insert({
        profissional_id: formData.profissional_id,
        tipo: formData.tipo || 'vale',
        valor: parseCurrency(formData.valor),
        descricao: formData.descricao || null,
        data_lancamento: formData.data_lancamento,
        status: 'pendente',
      });
      
      if (error) throw error;
      
      toast.success('Vale lançado com sucesso!');
      setShowCreateModal(false);
      resetForm();
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar vale:', error);
      toastError(error, error?.message || 'Erro ao salvar vale');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Salvar Lançamento Financeiro
  const handleSaveLancamento = async () => {
    if (!formData.profissional_id || !formData.valor || !formData.categoria) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    const [ano, mes] = competencia.split('-').map(Number);
    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}-01`;
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('lancamentos_financeiros').insert({
        profissional_id: formData.profissional_id,
        mes_referencia: mesReferencia,
        tipo: 'desconto',
        categoria: formData.categoria,
        descricao: formData.descricao || CATEGORIAS_LANCAMENTO.find(c => c.value === formData.categoria)?.label || 'Desconto',
        valor: parseCurrency(formData.valor),
        observacoes: formData.observacoes || null,
      });
      
      if (error) throw error;
      
      toast.success('Lançamento salvo com sucesso!');
      setShowCreateModal(false);
      resetForm();
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar lançamento:', error);
      toastError(error, error?.message || 'Erro ao salvar lançamento');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Salvar/Atualizar Benefícios Adicionais
  const handleSaveBeneficio = async () => {
    if (!formData.profissional_id) {
      toast.error('Selecione um profissional');
      return;
    }
    
    const [ano, mes] = competencia.split('-').map(Number);
    const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}-01`;
    
    const valeCarne = parseCurrency(formData.valor_vale_carne);
    const valeDinheiro = parseCurrency(formData.valor_vale_dinheiro);
    const valeAlimentacao = parseCurrency(formData.valor_vale_alimentacao);
    
    if (valeCarne === 0 && valeDinheiro === 0 && valeAlimentacao === 0) {
      toast.error('Preencha pelo menos um valor de benefício');
      return;
    }
    
    setIsSaving(true);
    try {
      // Verificar se já existe registro para este profissional/mês
      const { data: existing } = await supabase
        .from('beneficios')
        .select('id')
        .eq('profissional_id', formData.profissional_id)
        .eq('mes_referencia', mesReferencia)
        .maybeSingle();
      
      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from('beneficios')
          .update({
            valor_vale_carne: valeCarne,
            valor_vale_dinheiro: valeDinheiro,
            valor_vale_alimentacao: valeAlimentacao,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
          
        if (error) throw error;
        toast.success('Benefícios atualizados com sucesso!');
      } else {
        // Inserir novo
        const { error } = await supabase.from('beneficios').insert({
          profissional_id: formData.profissional_id,
          mes_referencia: mesReferencia,
          valor_vale_carne: valeCarne,
          valor_vale_dinheiro: valeDinheiro,
          valor_vale_alimentacao: valeAlimentacao,
        });
        
        if (error) throw error;
        toast.success('Benefícios cadastrados com sucesso!');
      }
      
      setShowCreateModal(false);
      resetForm();
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar benefícios:', error);
      toastError(error, error?.message || 'Erro ao salvar benefícios');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Excluir vale
  const handleDeleteVale = async (id: string) => {
    if (!confirm('Deseja realmente excluir este vale?')) return;
    
    try {
      const { error } = await supabase.from('professional_vales').delete().eq('id', id);
      if (error) throw error;
      toast.success('Vale excluído');
      carregarDados();
    } catch (error: any) {
      toastError(error, 'Erro ao excluir vale');
    }
  };
  
  // Excluir lançamento
  const handleDeleteLancamento = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;
    
    try {
      const { error } = await supabase.from('lancamentos_financeiros').delete().eq('id', id);
      if (error) throw error;
      toast.success('Lançamento excluído');
      carregarDados();
    } catch (error: any) {
      toastError(error, 'Erro ao excluir lançamento');
    }
  };
  
  // Filtros
  const valesFiltrados = vales.filter(v => {
    if (!searchTerm) return true;
    return matchesSearch(searchTerm, [
      v.profissional?.nome,
      v.profissional?.matricula,
      v.descricao,
      v.profissional_id,
    ]);
  });
  
  const lancamentosFiltrados = lancamentos.filter(l => {
    if (!searchTerm) return true;
    return matchesSearch(searchTerm, [
      l.profissional?.nome,
      l.profissional?.matricula,
      l.tipo,
      l.profissional_id,
    ]);
  });
  
  const beneficiosFiltrados = beneficios.filter(b => {
    if (!searchTerm) return true;
    return matchesSearch(searchTerm, [
      b.profissional?.nome,
      b.profissional?.matricula,
      b.profissional_id,
    ]);
  });
  
  // Totais
  const totalVales = vales.reduce((sum, v) => sum + Number(v.valor), 0);
  const totalLancamentos = lancamentos.reduce((sum, l) => sum + Number(l.valor), 0);
  const totalBeneficios = beneficios.reduce((sum, b) => 
    sum + Number(b.valor_vale_carne) + Number(b.valor_vale_dinheiro) + Number(b.valor_vale_alimentacao), 0);
  
  const openCreateModal = (type: 'vale' | 'lancamento' | 'beneficio') => {
    setCreateType(type);
    resetForm();
    setShowCreateModal(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Lançamentos</h1>
          <p className="text-muted-foreground">
            Gerencie vales, descontos e benefícios adicionais
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" size="icon" onClick={carregarDados} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vales</p>
                <p className="text-xl font-bold">{formatCurrency(totalVales)}</p>
                <p className="text-xs text-muted-foreground">{vales.length} lançamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10 text-warning">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Descontos Manuais</p>
                <p className="text-xl font-bold">{formatCurrency(totalLancamentos)}</p>
                <p className="text-xs text-muted-foreground">{lancamentos.length} lançamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground">
                <Beef className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Benefícios (Carne/Dinheiro)</p>
                <p className="text-xl font-bold">{formatCurrency(totalBeneficios)}</p>
                <p className="text-xs text-muted-foreground">{beneficios.length} profissionais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-primary/80">Total Descontos</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalVales + totalLancamentos + totalBeneficios)}</p>
                <p className="text-xs text-primary/60">Impacto na folha</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="vales" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Vales ({vales.length})
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Descontos ({lancamentos.length})
            </TabsTrigger>
            <TabsTrigger value="beneficios" className="flex items-center gap-2">
              <Beef className="h-4 w-4" />
              Vale Carne/Dinheiro ({beneficios.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={() => openCreateModal(activeTab === 'vales' ? 'vale' : activeTab === 'lancamentos' ? 'lancamento' : 'beneficio')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lançamento
            </Button>
          </div>
        </div>
        
        {/* Tab Vales */}
        <TabsContent value="vales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vales do Mês</CardTitle>
              <CardDescription>Vales concedidos aos profissionais para desconto em folha</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : valesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum vale lançado neste mês</p>
                  <Button variant="outline" className="mt-4" onClick={() => openCreateModal('vale')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lançar Vale
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {valesFiltrados.map((vale) => (
                      <TableRow key={vale.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vale.profissional?.nome || '-'}</p>
                            <p className="text-xs text-muted-foreground">{vale.profissional?.matricula}</p>
                          </div>
                        </TableCell>
                        <TableCell>{vale.tipo}</TableCell>
                        <TableCell>{vale.descricao || '-'}</TableCell>
                        <TableCell>{new Date(vale.data_lancamento).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Badge variant={vale.status === 'pendente' ? 'outline' : 'secondary'}>
                            {vale.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(vale.valor))}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteVale(vale.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Lançamentos */}
        <TabsContent value="lancamentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Descontos Manuais</CardTitle>
              <CardDescription>Lançamentos financeiros para desconto na folha de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : lancamentosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum lançamento neste mês</p>
                  <Button variant="outline" className="mt-4" onClick={() => openCreateModal('lancamento')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lançamento
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentosFiltrados.map((lanc) => (
                      <TableRow key={lanc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lanc.profissional?.nome || '-'}</p>
                            <p className="text-xs text-muted-foreground">{lanc.profissional?.matricula}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lanc.categoria}</Badge>
                        </TableCell>
                        <TableCell>{lanc.descricao}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{lanc.observacoes || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(lanc.valor))}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteLancamento(lanc.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Benefícios */}
        <TabsContent value="beneficios" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Vale Carne / Vale Dinheiro / Vale Alimentação</CardTitle>
              <CardDescription>Benefícios adicionais que são descontados na folha</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : beneficiosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Beef className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum benefício adicional cadastrado neste mês</p>
                  <Button variant="outline" className="mt-4" onClick={() => openCreateModal('beneficio')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Benefício
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Vale Carne</TableHead>
                      <TableHead className="text-right">Vale Dinheiro</TableHead>
                      <TableHead className="text-right">Vale Alimentação</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiosFiltrados.map((ben) => {
                      const total = Number(ben.valor_vale_carne) + Number(ben.valor_vale_dinheiro) + Number(ben.valor_vale_alimentacao);
                      return (
                        <TableRow key={ben.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ben.profissional?.nome || '-'}</p>
                              <p className="text-xs text-muted-foreground">{ben.profissional?.matricula}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(ben.valor_vale_carne))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(ben.valor_vale_dinheiro))}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(ben.valor_vale_alimentacao))}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(total)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de Criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {createType === 'vale' && 'Lançar Vale'}
              {createType === 'lancamento' && 'Novo Desconto Manual'}
              {createType === 'beneficio' && 'Cadastrar Benefícios'}
            </DialogTitle>
            <DialogDescription>
              {createType === 'vale' && 'Registre um vale para desconto na folha'}
              {createType === 'lancamento' && 'Adicione um desconto manual para a folha'}
              {createType === 'beneficio' && 'Configure vale carne, vale dinheiro ou vale alimentação'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Profissional *</Label>
              <ProfissionalAutocomplete
                value={formData.profissional_id}
                onChange={(matricula, profissionalId) => setFormData(prev => ({ 
                  ...prev, 
                  profissional_id: profissionalId || '' 
                }))}
                placeholder="Buscar por nome ou matrícula"
              />
            </div>
            
            {createType === 'vale' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, tipo: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vale">Vale</SelectItem>
                        <SelectItem value="adiantamento">Adiantamento</SelectItem>
                        <SelectItem value="emprestimo">Empréstimo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor *</Label>
                    <Input
                      placeholder="R$ 0,00"
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data do Lançamento</Label>
                  <Input
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_lancamento: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Motivo do vale (opcional)"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
              </>
            )}
            
            {createType === 'lancamento' && (
              <>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, categoria: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_LANCAMENTO.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor *</Label>
                  <Input
                    placeholder="R$ 0,00"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição do lançamento"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Observações adicionais (opcional)"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  />
                </div>
              </>
            )}
            
            {createType === 'beneficio' && (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Benefícios Adicionais</AlertTitle>
                  <AlertDescription>
                    Estes valores serão descontados automaticamente na folha de pagamento do profissional.
                  </AlertDescription>
                </Alert>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Beef className="h-4 w-4" />
                      Vale Carne
                    </Label>
                    <Input
                      placeholder="R$ 0,00"
                      value={formData.valor_vale_carne}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_vale_carne: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Vale Dinheiro
                    </Label>
                    <Input
                      placeholder="R$ 0,00"
                      value={formData.valor_vale_dinheiro}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_vale_dinheiro: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Vale Alimentação
                    </Label>
                    <Input
                      placeholder="R$ 0,00"
                      value={formData.valor_vale_alimentacao}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_vale_alimentacao: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (createType === 'vale') handleSaveVale();
                else if (createType === 'lancamento') handleSaveLancamento();
                else handleSaveBeneficio();
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
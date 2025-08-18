import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUploader } from '@/components/FileUploader';
import { CreditCard, TrendingUp, DollarSign } from 'lucide-react';
import { useN8NAction } from '@/hooks/useN8NAction';

export function Lancamentos() {
  const [valeForm, setValeForm] = useState({
    matricula: '',
    valor: '',
    data: '',
    observacao: '',
    reciboFileId: ''
  });

  const [adiantamentoForm, setAdiantamentoForm] = useState({
    matricula: '',
    valor: '',
    competencia: '',
    reciboFileId: ''
  });

  const [pagamentoForm, setPagamentoForm] = useState({
    matricula: '',
    competencia: '',
    valeDinheiro: '',
    valeCarne: '',
    pensao: '',
    emprestimo: '',
    emprestimoCLT: '',
    adiantamentoSalario: '',
    completacao: ''
  });

  const { execute, loading } = useN8NAction();

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const centavos = parseInt(numericValue) || 0;
    return (centavos / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const parseCurrencyToCentavos = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return parseInt(numericValue) || 0;
  };

  const handleValeSubmit = async () => {
    const payload = {
      lojaId: 'CENTRO',
      lojaNome: 'Centro',
      matricula: valeForm.matricula,
      valorCentavos: parseCurrencyToCentavos(valeForm.valor),
      dataISO: valeForm.data,
      reciboFileId: valeForm.reciboFileId || null,
      observacao: valeForm.observacao
    };

    await execute('vale', payload, {
      successMessage: 'Vale lançado com sucesso!'
    });
  };

  const handleAdiantamentoSubmit = async () => {
    const payload = {
      matricula: adiantamentoForm.matricula,
      valorCentavos: parseCurrencyToCentavos(adiantamentoForm.valor),
      competencia: adiantamentoForm.competencia,
      reciboFileId: adiantamentoForm.reciboFileId || null
    };

    await execute('adiantamento', payload, {
      successMessage: 'Adiantamento lançado com sucesso!'
    });
  };

  const handlePagamentoSubmit = async () => {
    const payload = {
      matricula: pagamentoForm.matricula,
      competencia: pagamentoForm.competencia,
      fields: {
        valeDinheiroCentavos: parseCurrencyToCentavos(pagamentoForm.valeDinheiro),
        valeCarneCentavos: parseCurrencyToCentavos(pagamentoForm.valeCarne),
        pensaoCentavos: parseCurrencyToCentavos(pagamentoForm.pensao),
        emprestimoCentavos: parseCurrencyToCentavos(pagamentoForm.emprestimo),
        emprestimoCLTCentavos: parseCurrencyToCentavos(pagamentoForm.emprestimoCLT),
        adiantamentoSalarioCentavos: parseCurrencyToCentavos(pagamentoForm.adiantamentoSalario),
        completacaoCentavos: parseCurrencyToCentavos(pagamentoForm.completacao)
      }
    };

    await execute('pagto', payload, {
      successMessage: 'Pagamento aplicado com sucesso!'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lançamentos</h1>
        <p className="text-muted-foreground">
          Gerencie vales, adiantamentos e aplicação de pagamentos
        </p>
      </div>

      <Tabs defaultValue="vale" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vale" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Vale
          </TabsTrigger>
          <TabsTrigger value="adiantamento" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Adiantamento
          </TabsTrigger>
          <TabsTrigger value="pagamento" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pagamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vale">
          <Card>
            <CardHeader>
              <CardTitle>Lançar Vale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vale-matricula">Matrícula</Label>
                  <Input
                    id="vale-matricula"
                    placeholder="Digite a matrícula (1-10 dígitos)"
                    value={valeForm.matricula}
                    onChange={(e) => setValeForm(prev => ({ ...prev, matricula: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vale-valor">Valor</Label>
                  <Input
                    id="vale-valor"
                    placeholder="R$ 0,00"
                    value={valeForm.valor}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setValeForm(prev => ({ ...prev, valor: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="vale-data">Data</Label>
                  <Input
                    id="vale-data"
                    type="date"
                    value={valeForm.data}
                    onChange={(e) => setValeForm(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vale-observacao">Observação</Label>
                <Textarea
                  id="vale-observacao"
                  placeholder="Motivo do vale (opcional)"
                  value={valeForm.observacao}
                  onChange={(e) => setValeForm(prev => ({ ...prev, observacao: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Comprovante (opcional)</Label>
                <FileUploader
                  onFileUploaded={(fileId) => setValeForm(prev => ({ ...prev, reciboFileId: fileId }))}
                />
              </div>
              
              <Button 
                onClick={handleValeSubmit} 
                disabled={loading || !valeForm.matricula || !valeForm.valor || !valeForm.data}
                className="w-full"
              >
                {loading ? 'Lançando...' : 'Lançar Vale'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adiantamento">
          <Card>
            <CardHeader>
              <CardTitle>Lançar Adiantamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adt-matricula">Matrícula</Label>
                  <Input
                    id="adt-matricula"
                    placeholder="Digite a matrícula"
                    value={adiantamentoForm.matricula}
                    onChange={(e) => setAdiantamentoForm(prev => ({ ...prev, matricula: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adt-valor">Valor</Label>
                  <Input
                    id="adt-valor"
                    placeholder="R$ 0,00"
                    value={adiantamentoForm.valor}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setAdiantamentoForm(prev => ({ ...prev, valor: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adt-competencia">Competência</Label>
                  <Input
                    id="adt-competencia"
                    placeholder="AAAA-MM (ex: 2025-08)"
                    value={adiantamentoForm.competencia}
                    onChange={(e) => setAdiantamentoForm(prev => ({ ...prev, competencia: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Comprovante (opcional)</Label>
                <FileUploader
                  onFileUploaded={(fileId) => setAdiantamentoForm(prev => ({ ...prev, reciboFileId: fileId }))}
                />
              </div>
              
              <Button 
                onClick={handleAdiantamentoSubmit} 
                disabled={loading || !adiantamentoForm.matricula || !adiantamentoForm.valor || !adiantamentoForm.competencia}
                className="w-full"
              >
                {loading ? 'Lançando...' : 'Lançar Adiantamento'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamento">
          <Card>
            <CardHeader>
              <CardTitle>Aplicar Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pgt-matricula">Matrícula</Label>
                  <Input
                    id="pgt-matricula"
                    placeholder="Digite a matrícula"
                    value={pagamentoForm.matricula}
                    onChange={(e) => setPagamentoForm(prev => ({ ...prev, matricula: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pgt-competencia">Competência</Label>
                  <Input
                    id="pgt-competencia"
                    placeholder="AAAA-MM (ex: 2025-08)"
                    value={pagamentoForm.competencia}
                    onChange={(e) => setPagamentoForm(prev => ({ ...prev, competencia: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pgt-vale-dinheiro">Vale Dinheiro</Label>
                  <Input
                    id="pgt-vale-dinheiro"
                    placeholder="R$ 0,00"
                    value={pagamentoForm.valeDinheiro}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPagamentoForm(prev => ({ ...prev, valeDinheiro: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pgt-vale-carne">Vale Carne</Label>
                  <Input
                    id="pgt-vale-carne"
                    placeholder="R$ 0,00"
                    value={pagamentoForm.valeCarne}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPagamentoForm(prev => ({ ...prev, valeCarne: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pgt-pensao">Pensão</Label>
                  <Input
                    id="pgt-pensao"
                    placeholder="R$ 0,00"
                    value={pagamentoForm.pensao}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPagamentoForm(prev => ({ ...prev, pensao: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pgt-emprestimo">Empréstimo</Label>
                  <Input
                    id="pgt-emprestimo"
                    placeholder="R$ 0,00"
                    value={pagamentoForm.emprestimo}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPagamentoForm(prev => ({ ...prev, emprestimo: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pgt-emprestimo-clt">Empréstimo CLT</Label>
                  <Input
                    id="pgt-emprestimo-clt"
                    placeholder="R$ 0,00"
                    value={pagamentoForm.emprestimoCLT}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPagamentoForm(prev => ({ ...prev, emprestimoCLT: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pgt-adiantamento-salario">Adiantamento Salário</Label>
                  <Input
                    id="pgt-adiantamento-salario"
                    placeholder="R$ 0,00"
                    value={pagamentoForm.adiantamentoSalario}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPagamentoForm(prev => ({ ...prev, adiantamentoSalario: formatted }));
                    }}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="pgt-completacao">Completação</Label>
                  <Input
                    id="pgt-completacao"
                    placeholder="R$ 0,00"
                    value={pagamentoForm.completacao}
                    onChange={(e) => {
                      const formatted = formatCurrency(e.target.value);
                      setPagamentoForm(prev => ({ ...prev, completacao: formatted }));
                    }}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handlePagamentoSubmit} 
                disabled={loading || !pagamentoForm.matricula || !pagamentoForm.competencia}
                className="w-full"
              >
                {loading ? 'Aplicando...' : 'Aplicar Pagamento'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
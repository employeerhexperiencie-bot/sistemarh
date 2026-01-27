import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bus, Calculator, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BeneficioConfig {
  diasUteis6x1: number;
  diasUteis5x2: number;
  valorPassagem: number;
}

interface ProfissionalVT {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  vale_transporte: boolean;
  valor_diario_rota: number;
}

interface CalcForm {
  escala: '6x1' | '5x2';
  faltas: number;
  atestados: number;
  ferias: number;
}

export function BeneficiosVTTab() {
  const [profissionais, setProfissionais] = useState<ProfissionalVT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [config, setConfig] = useState<BeneficioConfig>({
    diasUteis6x1: 26,
    diasUteis5x2: 22,
    valorPassagem: 4.40,
  });

  const [calcForm, setCalcForm] = useState<CalcForm>({
    escala: '6x1',
    faltas: 0,
    atestados: 0,
    ferias: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id, matricula, nome,
          vale_transporte, valor_diario_rota,
          lojas:lojas!profissionais_loja_id_fkey(nome)
        `)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        matricula: p.matricula,
        nome: p.nome,
        loja: p.lojas?.nome || '-',
        vale_transporte: p.vale_transporte || false,
        valor_diario_rota: p.valor_diario_rota || config.valorPassagem * 2,
      }));

      setProfissionais(mapped);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const diasUteis = calcForm.escala === '6x1' ? config.diasUteis6x1 : config.diasUteis5x2;
  const diasAbatidos = calcForm.faltas + calcForm.atestados + calcForm.ferias;
  const diasTrabalhados = Math.max(0, diasUteis - diasAbatidos);
  const valorVTCalculado = diasTrabalhados * 2 * config.valorPassagem;

  const profissionaisComVT = profissionais.filter(p => p.vale_transporte);
  const totalVT = profissionaisComVT.reduce((sum, p) => sum + (22 * p.valor_diario_rota), 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const filteredProfissionais = profissionaisComVT.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.matricula.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" />
              Total de Beneficiários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-primary">
              {profissionaisComVT.length}
            </span>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Custo Mensal Estimado</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(totalVT)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Valor Passagem Padrão</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {formatCurrency(config.valorPassagem)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Configuração e Calculadora */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Configuração VT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dias úteis (6x1)</Label>
                <Input
                  type="number"
                  value={config.diasUteis6x1}
                  onChange={(e) => setConfig(prev => ({ ...prev, diasUteis6x1: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Dias úteis (5x2)</Label>
                <Input
                  type="number"
                  value={config.diasUteis5x2}
                  onChange={(e) => setConfig(prev => ({ ...prev, diasUteis5x2: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Valor da Passagem (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={config.valorPassagem}
                onChange={(e) => setConfig(prev => ({ ...prev, valorPassagem: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-success" />
              Calculadora VT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={calcForm.escala === '6x1' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalcForm(prev => ({ ...prev, escala: '6x1' }))}
              >
                6x1
              </Button>
              <Button
                variant={calcForm.escala === '5x2' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalcForm(prev => ({ ...prev, escala: '5x2' }))}
              >
                5x2
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Faltas</Label>
                <Input
                  type="number"
                  value={calcForm.faltas}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, faltas: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Atestados</Label>
                <Input
                  type="number"
                  value={calcForm.atestados}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, atestados: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Férias</Label>
                <Input
                  type="number"
                  value={calcForm.ferias}
                  onChange={(e) => setCalcForm(prev => ({ ...prev, ferias: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="p-4 bg-primary/5 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dias úteis:</span>
                <span className="font-medium">{diasUteis}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dias abatidos:</span>
                <span className="font-medium text-destructive">-{diasAbatidos}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Dias trabalhados:</span>
                <span className="font-medium text-success">{diasTrabalhados}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Passagens:</span>
                <span className="font-medium">{diasTrabalhados * 2}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold">Total VT:</span>
                <span className="font-bold text-primary">{formatCurrency(valorVTCalculado)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regras */}
      <Card className="border-info/20 bg-info/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Info className="h-4 w-4" />
            Regras VT
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm space-y-1">
          <p>• Dias úteis no mês de pagamento conforme escala (6x1 ou 5x2)</p>
          <p>• Quantidade de passagem x valor total</p>
          <p>• <span className="text-destructive font-medium">Abater:</span> faltas, atestados, férias, afastados</p>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Profissionais com Vale Transporte</CardTitle>
          <Input
            placeholder="Buscar por nome ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm mt-2"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Valor Diário</TableHead>
                  <TableHead className="text-right">Valor Mensal (22 dias)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProfissionais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfissionais.slice(0, 50).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.matricula}</TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>{p.loja}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.valor_diario_rota)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(22 * p.valor_diario_rota)}
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

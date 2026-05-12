import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Utensils, ShoppingBasket, CreditCard, Beef, Info, AlertTriangle, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { matchesSearch } from '@/lib/searchUtils';

interface BeneficioConfig {
  valorVR: number;
  valorCestaBasica: number;
  valorValeAlimentacao: number;
  valorValeCarne: number;
  valorValeDinheiro: number;
  diasUteis: number;
}

interface ProfissionalAlimentacao {
  id: string;
  matricula: string;
  nome: string;
  cpf?: string | null;
  telefone?: string | null;
  celular?: string | null;
  loja: string;
  vale_refeicao: boolean;
  cesta_basica: boolean;
  vale_alimentacao: boolean;
  vale_carne: boolean;
  valor_vale_alimentacao: number;
  valor_vale_carne: number;
  valor_vale_dinheiro: number;
}

export function BeneficiosAlimentacaoTab() {
  const [profissionais, setProfissionais] = useState<ProfissionalAlimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [config, setConfig] = useState<BeneficioConfig>({
    valorVR: 25.00,
    valorCestaBasica: 150.00,
    valorValeAlimentacao: 200.00,
    valorValeCarne: 100.00,
    valorValeDinheiro: 100.00,
    diasUteis: 22,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar profissionais
      const { data: profsData, error: profsError } = await supabase
        .from('profissionais')
        .select(`
          id, matricula, nome, cpf, telefone, celular,
          vale_refeicao, cesta_basica, vale_alimentacao, vale_carne,
          valor_vale_alimentacao, valor_vale_carne,
          lojas:lojas!profissionais_loja_id_fkey(nome)
        `)
        .eq('status', 'ativo')
        .order('nome');

      if (profsError) throw profsError;

      // Carregar valores de vale dinheiro da tabela beneficios (mês atual)
      const mesAtual = new Date().toISOString().slice(0, 7);
      const { data: beneficiosData } = await supabase
        .from('beneficios')
        .select('profissional_id, valor_vale_dinheiro')
        .eq('mes_referencia', mesAtual);

      const beneficiosMap = new Map(
        (beneficiosData || []).map(b => [b.profissional_id, b.valor_vale_dinheiro || 0])
      );

      const mapped = (profsData || []).map((p: any) => ({
        id: p.id,
        matricula: p.matricula,
        nome: p.nome,
        cpf: p.cpf,
        telefone: p.telefone,
        celular: p.celular,
        loja: p.lojas?.nome || '-',
        vale_refeicao: p.vale_refeicao || false,
        cesta_basica: p.cesta_basica || false,
        vale_alimentacao: p.vale_alimentacao || false,
        vale_carne: p.vale_carne || false,
        valor_vale_alimentacao: p.valor_vale_alimentacao || config.valorValeAlimentacao,
        valor_vale_carne: p.valor_vale_carne || config.valorValeCarne,
        valor_vale_dinheiro: beneficiosMap.get(p.id) || 0,
      }));

      setProfissionais(mapped);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfissionais = profissionais.filter((p) =>
    matchesSearch(searchTerm, [p.nome, p.matricula, p.cpf, p.telefone, p.celular, p.loja])
  );

  const totalVR = profissionais.filter(p => p.vale_refeicao).length * config.diasUteis * config.valorVR;
  const totalCesta = profissionais.filter(p => p.cesta_basica).length * config.valorCestaBasica;
  const totalVA = profissionais.filter(p => p.vale_alimentacao).reduce((sum, p) => sum + p.valor_vale_alimentacao, 0);
  const totalCarne = profissionais.filter(p => p.vale_carne).reduce((sum, p) => sum + p.valor_vale_carne, 0);
  const totalDinheiro = profissionais.reduce((sum, p) => sum + p.valor_vale_dinheiro, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Utensils className="h-4 w-4 text-orange-600" />
              Vale Refeição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-orange-600">
                {profissionais.filter(p => p.vale_refeicao).length}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(totalVR)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-green-600" />
              Cesta Básica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-600">
                {profissionais.filter(p => p.cesta_basica).length}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(totalCesta)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-200 bg-indigo-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-600" />
              Vale Alimentação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-indigo-600">
                {profissionais.filter(p => p.vale_alimentacao).length}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(totalVA)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Beef className="h-4 w-4 text-rose-600" />
              Vale Carne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-rose-600">
                {profissionais.filter(p => p.vale_carne).length}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(totalCarne)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Banknote className="h-4 w-4 text-emerald-600" />
              Vale Dinheiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-emerald-600">
                {profissionais.filter(p => p.valor_vale_dinheiro > 0).length}
              </span>
              <span className="text-sm font-semibold">{formatCurrency(totalDinheiro)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Configuração de Valores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>VR por dia (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.valorVR}
                  onChange={(e) => setConfig(prev => ({ ...prev, valorVR: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Dias úteis</Label>
                <Input
                  type="number"
                  value={config.diasUteis}
                  onChange={(e) => setConfig(prev => ({ ...prev, diasUteis: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cesta Básica (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.valorCestaBasica}
                  onChange={(e) => setConfig(prev => ({ ...prev, valorCestaBasica: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vale Alimentação (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.valorValeAlimentacao}
                  onChange={(e) => setConfig(prev => ({ ...prev, valorValeAlimentacao: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vale Carne (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.valorValeCarne}
                  onChange={(e) => setConfig(prev => ({ ...prev, valorValeCarne: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vale Dinheiro (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.valorValeDinheiro}
                  onChange={(e) => setConfig(prev => ({ ...prev, valorValeDinheiro: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Regras de Elegibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs sm:text-sm space-y-1">
            <p className="text-destructive font-medium">• Cesta Básica: Falta injustificada = PERDE o benefício</p>
            <p>• Admissão até dia 15: tem direito no mês</p>
            <p>• Admissão após dia 15: não tem direito no mês da admissão</p>
            <p>• VR: Descontar faltas, atestados e férias</p>
            <p>• Vale Dinheiro: Lançado mensalmente conforme necessidade</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios de Alimentação por Profissional</CardTitle>
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
                  <TableHead className="text-center">VR</TableHead>
                  <TableHead className="text-center">Cesta</TableHead>
                  <TableHead className="text-center">VA</TableHead>
                  <TableHead className="text-center">Carne</TableHead>
                  <TableHead className="text-center">Dinheiro</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProfissionais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfissionais.slice(0, 50).map((p) => {
                    const vrValue = p.vale_refeicao ? config.diasUteis * config.valorVR : 0;
                    const cestaValue = p.cesta_basica ? config.valorCestaBasica : 0;
                    const vaValue = p.vale_alimentacao ? p.valor_vale_alimentacao : 0;
                    const carneValue = p.vale_carne ? p.valor_vale_carne : 0;
                    const dinheiroValue = p.valor_vale_dinheiro;
                    const total = vrValue + cestaValue + vaValue + carneValue + dinheiroValue;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.matricula}</TableCell>
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell>{p.loja}</TableCell>
                        <TableCell className="text-center">
                          {p.vale_refeicao ? (
                            <Badge className="bg-orange-100 text-orange-700">{formatCurrency(vrValue)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.cesta_basica ? (
                            <Badge className="bg-green-100 text-green-700">{formatCurrency(cestaValue)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.vale_alimentacao ? (
                            <Badge className="bg-indigo-100 text-indigo-700">{formatCurrency(vaValue)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.vale_carne ? (
                            <Badge className="bg-rose-100 text-rose-700">{formatCurrency(carneValue)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {dinheiroValue > 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-700">{formatCurrency(dinheiroValue)}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, DollarSign, Bus, Utensils, ShoppingBasket, 
  TrendingUp, Building2, Download, FileSpreadsheet, 
  Banknote, PiggyBank, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Loja {
  id: string;
  nome: string;
}

interface CalculoProfissional {
  profissional: {
    id: string;
    nome: string;
    matricula: string;
    lojaId: string;
    salario: number;
    emprestimos: number;
    vales: number;
    pensao: number;
  };
  loja?: Loja;
  valorDia20: number;
  salarioLiquido: number;
  valorVT: number;
  valorVR: number;
  valorCesta: number;
  totalMes: number;
  recebeDia20: boolean;
}

interface PrevisaoCustosConsolidadoProps {
  competencia: string;
  calculosLote: CalculoProfissional[];
  percentualDia20: number;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function PrevisaoCustosConsolidado({ 
  competencia, 
  calculosLote,
  percentualDia20 
}: PrevisaoCustosConsolidadoProps) {
  const [viewMode, setViewMode] = useState<'consolidado' | 'por-loja'>('consolidado');

  // Calcular totais gerais
  const totaisGerais = useMemo(() => {
    return calculosLote.reduce((acc, c) => ({
      totalDia20: acc.totalDia20 + c.valorDia20,
      totalDia5: acc.totalDia5 + c.salarioLiquido,
      totalVT: acc.totalVT + c.valorVT,
      totalVR: acc.totalVR + c.valorVR,
      totalCesta: acc.totalCesta + c.valorCesta,
      totalEmprestimos: acc.totalEmprestimos + c.profissional.emprestimos,
      totalVales: acc.totalVales + c.profissional.vales,
      totalPensao: acc.totalPensao + c.profissional.pensao,
      funcionarios: acc.funcionarios + 1,
      recebemDia20: acc.recebemDia20 + (c.recebeDia20 ? 1 : 0),
    }), { 
      totalDia20: 0, 
      totalDia5: 0, 
      totalVT: 0, 
      totalVR: 0, 
      totalCesta: 0, 
      totalEmprestimos: 0,
      totalVales: 0,
      totalPensao: 0,
      funcionarios: 0,
      recebemDia20: 0 
    });
  }, [calculosLote]);

  // Calcular resumo por loja
  const resumoPorLoja = useMemo(() => {
    const resumo: Record<string, {
      loja: string;
      qtdFuncionarios: number;
      totalDia20: number;
      totalDia5: number;
      totalVT: number;
      totalVR: number;
      totalCesta: number;
      totalGeral: number;
    }> = {};

    calculosLote.forEach(c => {
      const lojaId = c.profissional.lojaId;
      const lojaNome = c.loja?.nome || 'Sem Loja';
      
      if (!resumo[lojaId]) {
        resumo[lojaId] = {
          loja: lojaNome,
          qtdFuncionarios: 0,
          totalDia20: 0,
          totalDia5: 0,
          totalVT: 0,
          totalVR: 0,
          totalCesta: 0,
          totalGeral: 0,
        };
      }
      
      resumo[lojaId].qtdFuncionarios++;
      resumo[lojaId].totalDia20 += c.valorDia20;
      resumo[lojaId].totalDia5 += c.salarioLiquido;
      resumo[lojaId].totalVT += c.valorVT;
      resumo[lojaId].totalVR += c.valorVR;
      resumo[lojaId].totalCesta += c.valorCesta;
      resumo[lojaId].totalGeral += c.totalMes;
    });

    return Object.values(resumo).sort((a, b) => b.totalGeral - a.totalGeral);
  }, [calculosLote]);

  // Calcular totais consolidados
  const custoTotalBruto = totaisGerais.totalDia20 + totaisGerais.totalDia5 + totaisGerais.totalVT + totaisGerais.totalVR + totaisGerais.totalCesta;
  const totalBeneficiosPagos = totaisGerais.totalVT + totaisGerais.totalVR + totaisGerais.totalCesta;
  const totalSalariosLiquidos = totaisGerais.totalDia20 + totaisGerais.totalDia5;
  const totalDescontosRecuperados = totaisGerais.totalEmprestimos + totaisGerais.totalVales + totaisGerais.totalPensao;

  // Exportar relatório
  const exportarRelatorio = () => {
    const headers = ['Categoria', 'Valor'];
    const rows = [
      ['PREVISÃO DE CUSTOS - ' + competencia, ''],
      ['', ''],
      ['PAGAMENTOS', ''],
      ['Dia 20 (Adiantamento ' + percentualDia20 + '%)', totaisGerais.totalDia20.toFixed(2)],
      ['Dia 5 (Salário Restante)', totaisGerais.totalDia5.toFixed(2)],
      ['Subtotal Salários', totalSalariosLiquidos.toFixed(2)],
      ['', ''],
      ['BENEFÍCIOS', ''],
      ['Vale Transporte', totaisGerais.totalVT.toFixed(2)],
      ['Vale Refeição', totaisGerais.totalVR.toFixed(2)],
      ['Cesta Básica', totaisGerais.totalCesta.toFixed(2)],
      ['Subtotal Benefícios', totalBeneficiosPagos.toFixed(2)],
      ['', ''],
      ['DESCONTOS RECUPERADOS', ''],
      ['Empréstimos', totaisGerais.totalEmprestimos.toFixed(2)],
      ['Vales', totaisGerais.totalVales.toFixed(2)],
      ['Pensão Alimentícia', totaisGerais.totalPensao.toFixed(2)],
      ['Total Recuperado', totalDescontosRecuperados.toFixed(2)],
      ['', ''],
      ['CUSTO TOTAL BRUTO', custoTotalBruto.toFixed(2)],
      ['', ''],
      ['POR LOJA', ''],
      ...resumoPorLoja.map(r => [r.loja, r.totalGeral.toFixed(2)]),
    ];
    
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `previsao_custos_${competencia}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PiggyBank className="h-6 w-6 text-primary" />
            Previsão de Custos Consolidada
          </h2>
          <p className="text-sm text-muted-foreground">
            Competência: {competencia} • Adiantamento Dia 20: {percentualDia20}%
          </p>
        </div>
        <Button variant="outline" onClick={exportarRelatorio} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Cards de Resumo Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Geral */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 col-span-1 md:col-span-3">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary/80">Custo Total Previsto</p>
                <p className="text-4xl font-bold text-primary">{formatCurrency(custoTotalBruto)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {totaisGerais.funcionarios} funcionários • {totaisGerais.recebemDia20} recebem adiantamento
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Salários</p>
                  <p className="text-xl font-bold">{formatCurrency(totalSalariosLiquidos)}</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Benefícios</p>
                  <p className="text-xl font-bold">{formatCurrency(totalBeneficiosPagos)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento de Pagamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pagamentos (Dia 20 e Dia 5) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-5 w-5 text-success" />
              Cronograma de Pagamentos
            </CardTitle>
            <CardDescription>Projeção de saída de caixa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dia 20 */}
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">Dia 20 - Adiantamento ({percentualDia20}%)</span>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                  {totaisGerais.recebemDia20} funcionários
                </Badge>
              </div>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totaisGerais.totalDia20)}</p>
              <Progress 
                value={(totaisGerais.totalDia20 / custoTotalBruto) * 100} 
                className="h-2 mt-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((totaisGerais.totalDia20 / custoTotalBruto) * 100).toFixed(1)}% do custo total
              </p>
            </div>

            {/* Dia 5 */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Dia 5 - Salário Restante</span>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {totaisGerais.funcionarios} funcionários
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totaisGerais.totalDia5)}</p>
              <Progress 
                value={(totaisGerais.totalDia5 / custoTotalBruto) * 100} 
                className="h-2 mt-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((totaisGerais.totalDia5 / custoTotalBruto) * 100).toFixed(1)}% do custo total
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="font-semibold">Total Salários</span>
              <span className="text-xl font-bold">{formatCurrency(totalSalariosLiquidos)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBasket className="h-5 w-5 text-emerald-600" />
              Benefícios
            </CardTitle>
            <CardDescription>Custos com benefícios do mês</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vale Transporte */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Bus className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium">Vale Transporte</p>
                  <p className="text-xs text-muted-foreground">Custo empresa (sem desconto 6%)</p>
                </div>
              </div>
              <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalVT)}</p>
            </div>

            {/* Vale Refeição */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Utensils className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Vale Refeição</p>
                  <p className="text-xs text-muted-foreground">Custo integral</p>
                </div>
              </div>
              <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalVR)}</p>
            </div>

            {/* Cesta Básica */}
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <ShoppingBasket className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Cesta Básica</p>
                  <p className="text-xs text-muted-foreground">R$ 180,00 por funcionário elegível</p>
                </div>
              </div>
              <p className="text-xl font-bold">{formatCurrency(totaisGerais.totalCesta)}</p>
            </div>

            <Separator />

            <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
              <span className="font-semibold text-emerald-700">Total Benefícios</span>
              <span className="text-xl font-bold text-emerald-700">{formatCurrency(totalBeneficiosPagos)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descontos Recuperados */}
      {totalDescontosRecuperados > 0 && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-success">
              <TrendingUp className="h-5 w-5" />
              Descontos Recuperados (em folha)
            </CardTitle>
            <CardDescription>Valores que retornam para a empresa via desconto em folha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground">Empréstimos</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totaisGerais.totalEmprestimos)}</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground">Vales</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totaisGerais.totalVales)}</p>
              </div>
              <div className="p-4 rounded-lg bg-background border">
                <p className="text-sm text-muted-foreground">Pensão Alimentícia</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totaisGerais.totalPensao)}</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Recuperado</span>
              <span className="text-2xl font-bold text-success">{formatCurrency(totalDescontosRecuperados)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo por Loja */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Previsão por Loja
          </CardTitle>
          <CardDescription>Distribuição dos custos por unidade</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-center">Func.</TableHead>
                  <TableHead className="text-right">Dia 20</TableHead>
                  <TableHead className="text-right">Dia 5</TableHead>
                  <TableHead className="text-right">VT</TableHead>
                  <TableHead className="text-right">VR</TableHead>
                  <TableHead className="text-right">Cesta</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumoPorLoja.map((r, idx) => {
                  const percentual = (r.totalGeral / custoTotalBruto) * 100;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{r.loja}</TableCell>
                      <TableCell className="text-center">{r.qtdFuncionarios}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(r.totalDia20)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.totalDia5)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(r.totalVT)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(r.totalVR)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(r.totalCesta)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{formatCurrency(r.totalGeral)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {percentual.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Observações */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Observações:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Valores calculados com base no percentual de adiantamento configurado: <strong>{percentualDia20}%</strong></li>
                <li>VT considera apenas funcionários ativos com valor de rota cadastrado</li>
                <li>Cesta Básica é perdida em caso de faltas injustificadas</li>
                <li>Descontos (empréstimos, vales, pensão) são abatidos do salário no Dia 5</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

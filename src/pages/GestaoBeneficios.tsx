import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bus, Utensils, ShoppingBasket, Heart, CreditCard, Calculator, AlertTriangle, Info, Download } from 'lucide-react';
import { useMockData } from '@/hooks/useMockData';

interface BeneficioConfig {
  diasUteis6x1: number;
  diasUteis5x2: number;
  valorPassagem: number;
  valorVR: number;
  valorCestaBasica: number;
}

export default function GestaoBeneficios() {
  const mockData = useMockData();
  const [beneficiosData, setBeneficiosData] = useState<any[]>([]);

  useEffect(() => {
    if (mockData.hasMockData) {
      const beneficios = mockData.getBeneficios();
      setBeneficiosData(beneficios.slice(0, 50)); // Limitar a 50 para performance
    }
  }, [mockData.hasMockData]);

  const [config, setConfig] = useState<BeneficioConfig>({
    diasUteis6x1: 26,
    diasUteis5x2: 22,
    valorPassagem: 4.40,
    valorVR: 25.00,
    valorCestaBasica: 150.00,
  });

  const [calcForm, setCalcForm] = useState({
    escala: '6x1' as '6x1' | '5x2',
    faltas: 0,
    atestados: 0,
    ferias: 0,
    afastado: false,
  });

  const diasUteis = calcForm.escala === '6x1' ? config.diasUteis6x1 : config.diasUteis5x2;
  const diasAbatidos = calcForm.faltas + calcForm.atestados + calcForm.ferias;
  const diasTrabalhados = Math.max(0, diasUteis - diasAbatidos);

  const valorVT = diasTrabalhados * 2 * config.valorPassagem; // 2 passagens por dia
  const valorVR = diasTrabalhados * config.valorVR;

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Benefícios</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Vale Transporte, Vale Refeição, Cesta Básica e Seguros</p>
      </div>

      <Tabs defaultValue="vt" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="vt" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Bus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Vale</span> Transporte
          </TabsTrigger>
          <TabsTrigger value="vr" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Vale</span> Refeição
          </TabsTrigger>
          <TabsTrigger value="cesta" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <ShoppingBasket className="h-3 w-3 sm:h-4 sm:w-4" />
            Cesta
          </TabsTrigger>
          <TabsTrigger value="alelo" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
            Alelo
          </TabsTrigger>
          <TabsTrigger value="seguros" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
            Seguros
          </TabsTrigger>
        </TabsList>

        {/* VALE TRANSPORTE */}
        <TabsContent value="vt" className="space-y-4">
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
                    <span className="font-bold text-primary">{formatCurrency(valorVT)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
        </TabsContent>

        {/* VALE REFEIÇÃO */}
        <TabsContent value="vr" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-orange-500" />
                  Configuração VR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Valor por dia (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.valorVR}
                    onChange={(e) => setConfig(prev => ({ ...prev, valorVR: parseFloat(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: R$ 25,00 por dia</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-success" />
                  Cálculo VR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-orange-500/5 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dias trabalhados:</span>
                    <span className="font-medium">{diasTrabalhados}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valor por dia:</span>
                    <span className="font-medium">{formatCurrency(config.valorVR)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total VR:</span>
                    <span className="font-bold text-orange-500">{formatCurrency(valorVR)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-info/20 bg-info/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Regras VR
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-1">
              <p>• Por dia R$ 25,00</p>
              <p>• Dias úteis no mês de pagamento conforme escala (6x1 ou 5x2)</p>
              <p>• <span className="text-destructive font-medium">Abater:</span> faltas, atestados, férias, afastados</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CESTA BÁSICA */}
        <TabsContent value="cesta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-green-600" />
                Cesta Básica
              </CardTitle>
              <CardDescription>Configuração e regras para cesta básica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Valor da Cesta Básica (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.valorCestaBasica}
                  onChange={(e) => setConfig(prev => ({ ...prev, valorCestaBasica: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-warning/20 bg-warning/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Regras Cesta Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs sm:text-sm space-y-1">
              <p className="text-destructive font-medium">• Falta Injustificada: PERDE o direito à cesta básica</p>
              <p>• Admissão até dia 15 de cada mês: tem direito</p>
              <p>• Admissão após dia 15: não tem direito no mês da admissão</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CARTÃO ALELO */}
        <TabsContent value="alelo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-500" />
                Benefícios por Profissional
              </CardTitle>
              <CardDescription>Resumo de VT, VR e Cesta Básica ({beneficiosData.length} profissionais)</CardDescription>
            </CardHeader>
            <CardContent>
              {mockData.hasMockData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total VT</p>
                      <p className="text-2xl font-bold text-primary">
                        {beneficiosData.reduce((sum, b) => sum + b.valorVT, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-500/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total VR</p>
                      <p className="text-2xl font-bold text-orange-500">
                        {beneficiosData.reduce((sum, b) => sum + b.valorVR, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="p-4 bg-green-600/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Cesta</p>
                      <p className="text-2xl font-bold text-green-600">
                        {beneficiosData.reduce((sum, b) => sum + b.cestaBasica, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="p-4 bg-accent/5 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Geral</p>
                      <p className="text-2xl font-bold text-accent">
                        {beneficiosData.reduce((sum, b) => sum + b.valorVT + b.valorVR + b.cestaBasica, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Loja</TableHead>
                          <TableHead>Escala</TableHead>
                          <TableHead>VT</TableHead>
                          <TableHead>VR</TableHead>
                          <TableHead>Cesta</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {beneficiosData.map((ben, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{ben.matricula}</TableCell>
                            <TableCell className="font-medium">{ben.nome}</TableCell>
                            <TableCell>{ben.loja}</TableCell>
                            <TableCell>{ben.escala}</TableCell>
                            <TableCell className="font-mono text-primary">
                              {ben.valorVT.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell className="font-mono text-orange-500">
                              {ben.valorVR.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                            <TableCell className="font-mono">
                              {ben.temCestaBasica ? (
                                <span className="text-success">
                                  {ben.cestaBasica.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                              ) : (
                                <span className="text-destructive">R$ 0,00</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono font-bold">
                              {(ben.valorVT + ben.valorVR + ben.cestaBasica).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório CSV
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum dado de profissionais importado. Vá para "Análise de Ativos" para carregar os dados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEGUROS */}
        <TabsContent value="seguros" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Seguro de Vida
                </CardTitle>
                <CardDescription>Porto Seguro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">Relatório para envio à Porto Seguro</p>
                  <Button variant="outline" className="w-full">
                    Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-500" />
                  Odontológico
                </CardTitle>
                <CardDescription>Porto Seguro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">Relatório para envio à Porto Seguro</p>
                  <Button variant="outline" className="w-full">
                    Gerar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

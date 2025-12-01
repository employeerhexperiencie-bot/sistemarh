import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DollarSign, Calendar, Bus, Utensils, ShoppingBasket, Heart, 
  AlertTriangle, Clock, Calculator, FileText, CheckCircle, XCircle,
  Info, Users, Building
} from 'lucide-react';

export default function ReferenciaSistema() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Referência do Sistema</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Documentação das regras de negócio e estrutura de dados</p>
      </div>

      <Tabs defaultValue="folha" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="folha" className="text-xs sm:text-sm">Folha de Pagamento</TabsTrigger>
          <TabsTrigger value="beneficios" className="text-xs sm:text-sm">Benefícios</TabsTrigger>
          <TabsTrigger value="exames" className="text-xs sm:text-sm">Exames/ASO</TabsTrigger>
          <TabsTrigger value="ferias" className="text-xs sm:text-sm">Férias</TabsTrigger>
          <TabsTrigger value="afastamentos" className="text-xs sm:text-sm">Afastamentos</TabsTrigger>
          <TabsTrigger value="status" className="text-xs sm:text-sm">Status Projeto</TabsTrigger>
        </TabsList>

        {/* FOLHA DE PAGAMENTO */}
        <TabsContent value="folha" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                Folha de Pagamento
              </CardTitle>
              <CardDescription>Regras e cálculos da folha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Regra de Arredondamento */}
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Calculator className="h-4 w-4" />
                  Regra de Arredondamento
                </h4>
                <div className="space-y-2 text-sm">
                  <p>• Valor com <span className="text-success font-medium">0,50 ou mais</span> → arredonda para <span className="text-success font-medium">CIMA</span></p>
                  <p>• Valor com <span className="text-destructive font-medium">menos de 0,50</span> → arredonda para <span className="text-destructive font-medium">BAIXO</span></p>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    Exemplos Práticos de Arredondamento
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-background rounded border">
                      <p className="text-muted-foreground mb-1">Cenário 1: Salário com centavos altos</p>
                      <p>Salário bruto: <strong>R$ 2.150,00</strong></p>
                      <p>Adiantamento 40%: R$ 2.150 × 0,40 = <strong>R$ 860,00</strong></p>
                      <p>INSS (8%): R$ 860 × 0,08 = R$ 68,80</p>
                      <p>Líquido: R$ 860 - R$ 68,80 = R$ 791,20</p>
                      <p className="text-destructive mt-1">→ Pagar: <strong>R$ 791,00</strong> (0,20 &lt; 0,50)</p>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="text-muted-foreground mb-1">Cenário 2: Salário com centavos baixos</p>
                      <p>Salário bruto: <strong>R$ 1.890,00</strong></p>
                      <p>Adiantamento 40%: R$ 1.890 × 0,40 = <strong>R$ 756,00</strong></p>
                      <p>INSS (8%): R$ 756 × 0,08 = R$ 60,48</p>
                      <p>Líquido: R$ 756 - R$ 60,48 = R$ 695,52</p>
                      <p className="text-success mt-1">→ Pagar: <strong>R$ 696,00</strong> (0,52 ≥ 0,50)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pagamento dia 20 */}
              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-warning" />
                  Regra Pagamento Dia 20
                </h4>
                <div className="space-y-2 text-sm">
                  <p>• Admitidos até dia 10 do mês: recebem apenas <span className="font-medium">40%</span> do salário (mesmo que outros recebam % maior)</p>
                  <p>• <span className="text-warning font-medium">Férias:</span> não recebe no dia 20, apenas valores sobre dias vendidos</p>
                  <p>• <span className="text-destructive font-medium">Acidente Trabalho/Trajeto:</span> não recebe no dia 20, valor pago no mês seguinte</p>
                  <p>• <span className="text-pink-500 font-medium">Licença Maternidade:</span> recebe a % do dia 20 normalmente</p>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-warning" />
                    Exemplos Práticos - Dia 20
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-background rounded border border-warning/30">
                      <p className="text-warning font-medium mb-2">Funcionário novo (admitido dia 12)</p>
                      <p>Salário: <strong>R$ 2.000,00</strong></p>
                      <p>% padrão da empresa: 50%</p>
                      <p className="text-muted-foreground">Regra: admitido após dia 10 → recebe 40%</p>
                      <p>Adiantamento: R$ 2.000 × 0,40 = <strong>R$ 800,00</strong></p>
                    </div>
                    <div className="p-3 bg-background rounded border border-pink-500/30">
                      <p className="text-pink-500 font-medium mb-2">Funcionária em licença maternidade</p>
                      <p>Salário: <strong>R$ 2.500,00</strong></p>
                      <p>% padrão da empresa: 50%</p>
                      <p className="text-muted-foreground">Regra: maternidade recebe normalmente</p>
                      <p>Adiantamento: R$ 2.500 × 0,50 = <strong>R$ 1.250,00</strong></p>
                    </div>
                    <div className="p-3 bg-background rounded border border-destructive/30">
                      <p className="text-destructive font-medium mb-2">Funcionário afastado (acidente)</p>
                      <p>Salário: <strong>R$ 1.800,00</strong></p>
                      <p className="text-muted-foreground">Regra: não recebe dia 20</p>
                      <p>Adiantamento: <strong>R$ 0,00</strong></p>
                      <p className="text-xs text-muted-foreground">→ Valor será pago no mês seguinte</p>
                    </div>
                    <div className="p-3 bg-background rounded border border-blue-500/30">
                      <p className="text-blue-500 font-medium mb-2">Funcionário em férias</p>
                      <p>Salário: <strong>R$ 2.200,00</strong></p>
                      <p>Dias vendidos: 10 dias</p>
                      <p className="text-muted-foreground">Regra: só recebe dias vendidos</p>
                      <p>Valor dias vendidos: (R$ 2.200 / 30) × 10 = <strong>R$ 733,33</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adiantamento de Salário */}
              <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  Adiantamento de Salário - Quem NÃO recebe
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>Férias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>+10 faltas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>Afastados (exceto licença maternidade)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span>Admissão após dia 10 do mês</span>
                  </div>
                </div>
              </div>

              {/* 13º Salário */}
              <div className="p-4 bg-success/5 rounded-lg border border-success/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-success" />
                  13º Salário
                </h4>
                <div className="space-y-2 text-sm">
                  <p>• Admissão até dia 15: conta no cálculo de avos</p>
                  <p>• Considerar afastamentos nos meses</p>
                  <p>• 2ª parcela: incluir ambos valores + descontos (Pensão) = líquido final</p>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h5 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4 text-success" />
                    Exemplos Práticos - 13º Salário
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-background rounded border">
                      <p className="text-success font-medium mb-2">Funcionário ano completo</p>
                      <p>Salário: <strong>R$ 2.400,00</strong></p>
                      <p>Avos trabalhados: <strong>12/12</strong></p>
                      <p className="border-t pt-2 mt-2">1ª Parcela (nov): R$ 2.400 / 2 = <strong>R$ 1.200,00</strong></p>
                      <p>2ª Parcela (dez): R$ 2.400 - R$ 1.200 = R$ 1.200,00</p>
                      <p>INSS (9%): R$ 2.400 × 0,09 = R$ 216,00</p>
                      <p>Líquido 2ª parcela: <strong>R$ 984,00</strong></p>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <p className="text-warning font-medium mb-2">Funcionário admitido em maio (dia 10)</p>
                      <p>Salário: <strong>R$ 1.800,00</strong></p>
                      <p>Avos trabalhados: mai-dez = <strong>8/12</strong></p>
                      <p className="border-t pt-2 mt-2">Base 13º: (R$ 1.800 / 12) × 8 = <strong>R$ 1.200,00</strong></p>
                      <p>1ª Parcela: R$ 1.200 / 2 = <strong>R$ 600,00</strong></p>
                      <p>2ª Parcela (líquida): ~<strong>R$ 504,00</strong></p>
                    </div>
                    <div className="p-3 bg-background rounded border border-destructive/30 md:col-span-2">
                      <p className="text-destructive font-medium mb-2">Funcionário com 2 meses de afastamento</p>
                      <p>Salário: <strong>R$ 2.000,00</strong> | Afastado: março e abril (acidente)</p>
                      <p>Avos completos: 12 - 2 = <strong>10/12</strong></p>
                      <p className="border-t pt-2 mt-2">Base 13º: (R$ 2.000 / 12) × 10 = <strong>R$ 1.666,67</strong></p>
                      <p>1ª Parcela: R$ 1.666,67 / 2 = <strong>R$ 833,33</strong> → Arredondado: <strong>R$ 833,00</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico/Alertas */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  Incluir no Histórico e Alerta de Pagamento
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Antecipação Férias</Badge>
                  <Badge variant="outline">Antecipação 13º</Badge>
                  <Badge variant="outline">Empréstimos CLT</Badge>
                  <Badge variant="outline">Empréstimos Loja</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BENEFÍCIOS */}
        <TabsContent value="beneficios" className="space-y-4">
          {/* VT e VR com exemplos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Vale Transporte */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bus className="h-5 w-5 text-primary" />
                  Vale Transporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>• Dias úteis no mês de pagamento</p>
                  <p>• Escalas: 6x1 e 5x2</p>
                  <p>• Quantidade de passagem × valor total</p>
                  <p className="text-destructive font-medium">Abater: faltas, atestados, férias, afastados</p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <h5 className="font-medium text-xs mb-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Exemplo Prático - VT
                  </h5>
                  <div className="text-xs space-y-1">
                    <p>Mês: Janeiro/2025 | Dias úteis (6x1): <strong>26 dias</strong></p>
                    <p>Valor passagem: <strong>R$ 5,00</strong> × 2 = R$ 10,00/dia</p>
                    <p>Funcionário com 3 faltas e 5 dias de atestado</p>
                    <p className="border-t pt-1 mt-1">Dias abatidos: 3 + 5 = <strong>8 dias</strong></p>
                    <p>Dias VT: 26 - 8 = <strong>18 dias</strong></p>
                    <p className="text-primary font-medium">VT a pagar: 18 × R$ 10,00 = <strong>R$ 180,00</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vale Refeição */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Utensils className="h-5 w-5 text-orange-500" />
                  Vale Refeição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p>• Por dia: <span className="font-medium">R$ 25,00</span></p>
                  <p>• Dias úteis no mês de pagamento</p>
                  <p>• Escalas: 6x1 e 5x2</p>
                  <p className="text-destructive font-medium">Abater: faltas, atestados, férias, afastados</p>
                </div>
                <div className="p-3 bg-orange-500/5 rounded-lg border border-orange-500/20">
                  <h5 className="font-medium text-xs mb-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Exemplo Prático - VR
                  </h5>
                  <div className="text-xs space-y-1">
                    <p>Mês: Janeiro/2025 | Dias úteis (5x2): <strong>22 dias</strong></p>
                    <p>Valor VR/dia: <strong>R$ 25,00</strong></p>
                    <p>Funcionário com 2 faltas e 10 dias de férias</p>
                    <p className="border-t pt-1 mt-1">Dias abatidos: 2 + 10 = <strong>12 dias</strong></p>
                    <p>Dias VR: 22 - 12 = <strong>10 dias</strong></p>
                    <p className="text-orange-500 font-medium">VR a pagar: 10 × R$ 25,00 = <strong>R$ 250,00</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Cesta Básica */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBasket className="h-5 w-5 text-green-600" />
                  Cesta Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p className="text-destructive font-medium">• Falta Injustificada: PERDE o direito</p>
                  <p>• Admissão até dia 15: tem direito</p>
                  <p>• Valor: <span className="font-medium">R$ 180,00</span></p>
                </div>
                <div className="p-3 bg-green-600/5 rounded-lg border border-green-600/20">
                  <h5 className="font-medium text-xs mb-2">Validação Cesta Básica</h5>
                  <div className="text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span>João: 0 faltas injustificadas → <strong className="text-success">Recebe</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      <span>Maria: 2 atestados médicos → <strong className="text-success">Recebe</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-destructive" />
                      <span>Pedro: 1 falta injustificada → <strong className="text-destructive">NÃO Recebe</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-destructive" />
                      <span>Ana: Admitida dia 18 → <strong className="text-destructive">NÃO Recebe</strong></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seguros */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Heart className="h-5 w-5 text-red-500" />
                  Seguro de Vida / Odonto
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Relatório para envio à Porto Seguro</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EXAMES/ASO */}
        <TabsContent value="exames" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-success" />
                Exames Ocupacionais (ASO)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Alertas - 30 dias antes do vencimento
                </h4>
                <p className="text-sm">Clínica pede agendamento com 1 mês de antecedência</p>
                <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                  <h5 className="font-medium mb-2">Exemplo de Timeline de Alerta:</h5>
                  <div className="space-y-1">
                    <p>ASO realizado: <strong>15/01/2025</strong></p>
                    <p>Validade (anual): <strong>15/01/2026</strong></p>
                    <p className="text-warning">→ Alerta gerado em: <strong>16/12/2025</strong> (30 dias antes)</p>
                    <p className="text-muted-foreground">→ Ação: agendar exame até 15/01/2026</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3">Recorrências</h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge>Semestral (6 meses)</Badge>
                  <Badge variant="secondary">Anual (1 ano)</Badge>
                  <Badge variant="outline">Bienal (2 anos)</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>• Áreas de risco (cozinha, açougue): <strong>Semestral</strong></p>
                  <p>• Funcionários &lt; 18 ou &gt; 45 anos: <strong>Anual</strong></p>
                  <p>• Demais funcionários: <strong>Bienal</strong></p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-3">Valores e Custos</h4>
                <div className="space-y-2 text-sm">
                  <p>• Taxa mensal por vida: <span className="font-medium">R$ 6,70</span></p>
                  <p>• Exame de Fezes: <span className="font-medium">R$ 10,00</span></p>
                  <p>• Hemograma: <span className="font-medium">R$ 16,00</span></p>
                  <p>• Exame Clínico: <span className="font-medium">R$ 20,00 a R$ 25,00</span></p>
                </div>
                <div className="mt-3 p-3 bg-muted/50 rounded text-xs">
                  <h5 className="font-medium mb-2">Exemplo de Custo Mensal (20 lojas × 13 func):</h5>
                  <p>Total funcionários: <strong>260</strong></p>
                  <p>Taxa mensal: 260 × R$ 6,70 = <strong>R$ 1.742,00/mês</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FÉRIAS */}
        <TabsContent value="ferias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Gestão de Férias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <h4 className="font-semibold mb-3">Campos Necessários</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Agendamento de férias</p>
                    <p>• Data de saída / Data de retorno</p>
                    <p>• Quantidade de dias (20 ou 30)</p>
                    <p>• Trabalhadas ou Descansadas</p>
                    <p>• Dias a pagar na folha de pagamento</p>
                    <p>• Observações</p>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Relatórios</h4>
                  <div className="space-y-1 text-sm">
                    <p>• Relatório de férias no mês</p>
                    <p>• Relatório período aquisitivo a vencer</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AFASTAMENTOS */}
        <TabsContent value="afastamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-warning" />
                Gestão de Afastamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <h4 className="font-semibold mb-3">Campos Necessários</h4>
                <div className="space-y-1 text-sm">
                  <p>• Data Início</p>
                  <p>• Data Perícia</p>
                  <p>• Motivo do Afastamento</p>
                  <p>• Documentos</p>
                  <p>• Data Fim Afastamento</p>
                  <p>• Observação</p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3">Motivos de Afastamento</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-destructive/10 text-destructive">Acidente Trabalho</Badge>
                  <Badge className="bg-destructive/10 text-destructive">Acidente Trajeto</Badge>
                  <Badge className="bg-warning/10 text-warning">Doença</Badge>
                  <Badge className="bg-pink-500/10 text-pink-500">Maternidade</Badge>
                  <Badge className="bg-blue-500/10 text-blue-500">Paternidade</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STATUS DO PROJETO */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Status do Projeto
              </CardTitle>
              <CardDescription>O que está implementado e o que falta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Implementado */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-success">
                  <CheckCircle className="h-4 w-4" />
                  Frontend Implementado
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Dashboard com KPIs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Cadastro de Profissionais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Cadastro de Lojas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Gestão de Férias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Gestão de ASO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Gestão de EPI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Lançamentos (Vales/Adiantamentos)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Holerites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Gestão de Faltas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Relatórios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Pendências</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Gestão de Afastamentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Gestão de Benefícios (VT/VR/Cesta)</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Próximos Passos */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-warning">
                  <Clock className="h-4 w-4" />
                  Próximos Passos - Banco de Dados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: profissionais (completa)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: lojas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: ferias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: afastamentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: exames_aso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: folha_pagamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: beneficios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: vales_lancamentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: holerites</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-muted-foreground" />
                    <span>Tabela: epi</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Regras implementadas */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-success">
                  <CheckCircle className="h-4 w-4" />
                  Regras de Negócio Documentadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Arredondamento de valores (≥0,50 para cima, &lt;0,50 para baixo)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Cálculo automático de VT/VR com abatimentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Regras de pagamento dia 20</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Cálculo de 13º salário por avos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Alertas de vencimento ASO (30 dias)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Validação de cesta básica (falta injustificada)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span>Regras de adiantamento por tipo de afastamento</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

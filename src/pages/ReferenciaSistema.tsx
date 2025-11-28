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
          <TabsTrigger value="exames" className="text-xs sm:text-sm">Exames/ASUS</TabsTrigger>
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
                  <div className="mt-3 p-3 bg-muted/50 rounded text-xs space-y-1">
                    <p><strong>Exemplo 1:</strong> R$ 1.950,51 → pagar <span className="text-success">R$ 1.951,00</span></p>
                    <p><strong>Exemplo 2:</strong> R$ 1.950,49 → pagar <span className="text-destructive">R$ 1.950,00</span></p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vale Transporte */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bus className="h-5 w-5 text-primary" />
                  Vale Transporte
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>• Dias úteis no mês de pagamento</p>
                <p>• Escalas: 6x1 e 5x2</p>
                <p>• Quantidade de passagem × valor total</p>
                <p className="text-destructive font-medium">Abater: faltas, atestados, férias, afastados</p>
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
              <CardContent className="text-sm space-y-2">
                <p>• Por dia: <span className="font-medium">R$ 25,00</span></p>
                <p>• Dias úteis no mês de pagamento</p>
                <p>• Escalas: 6x1 e 5x2</p>
                <p className="text-destructive font-medium">Abater: faltas, atestados, férias, afastados</p>
              </CardContent>
            </Card>

            {/* Cesta Básica */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBasket className="h-5 w-5 text-green-600" />
                  Cesta Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-destructive font-medium">• Falta Injustificada: PERDE o direito</p>
                <p>• Admissão até dia 15: tem direito</p>
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

        {/* EXAMES/ASUS */}
        <TabsContent value="exames" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-success" />
                Exames Ocupacionais (ASUS)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-warning/5 rounded-lg border border-warning/20">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Alertas
                </h4>
                <p className="text-sm">30 dias antes do vencimento</p>
                <p className="text-sm">Clínica pede agendamento com 1 mês de antecedência</p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3">Recorrências</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>Semestral (6 meses)</Badge>
                  <Badge variant="secondary">Anual (1 ano)</Badge>
                  <Badge variant="outline">Bienal (2 anos)</Badge>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-3">Valores</h4>
                <div className="space-y-2 text-sm">
                  <p>• Taxa mensal por vida: <span className="font-medium">R$ 6,70</span></p>
                  <p>• Exame de Fezes: <span className="font-medium">R$ 10,00</span></p>
                  <p>• Hemograma: <span className="font-medium">R$ 16,00</span></p>
                  <p>• Exame Clínico: <span className="font-medium">R$ 20,00 a R$ 25,00</span></p>
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
                    <span>Gestão de ASUS</span>
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
                    <span>Tabela: exames_asus</span>
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

              {/* Regras para implementar */}
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Regras de Negócio para Implementar
                </h4>
                <div className="space-y-2 text-sm">
                  <p>• Arredondamento de valores (≥0,50 para cima, &lt;0,50 para baixo)</p>
                  <p>• Cálculo automático de VT/VR com abatimentos</p>
                  <p>• Regras de pagamento dia 20</p>
                  <p>• Cálculo de 13º salário por avos</p>
                  <p>• Alertas de vencimento ASUS (30 dias)</p>
                  <p>• Validação de cesta básica (falta injustificada)</p>
                  <p>• Regras de adiantamento por tipo de afastamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

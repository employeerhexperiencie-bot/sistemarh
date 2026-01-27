import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, CheckCircle2, AlertTriangle, Info,
  Users, Calculator, FileText, Calendar, 
  ArrowRight, Lightbulb, Shield
} from 'lucide-react';

export default function ComoUsar() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Como Usar o Sistema
        </h1>
        <p className="text-muted-foreground">
          Guia prático para gerenciar sua folha de pagamento sem complicações
        </p>
      </div>

      {/* O que o sistema faz */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            O que este sistema resolve
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Cálculo automático da folha</p>
                <p className="text-xs text-muted-foreground">Salários, descontos, VT, VR, cesta básica</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Controle de empréstimos</p>
                <p className="text-xs text-muted-foreground">Parcelas, saldos e quitações automáticas</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Alertas de vencimento</p>
                <p className="text-xs text-muted-foreground">ASO, férias e documentos importantes</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Geração de holerites</p>
                <p className="text-xs text-muted-foreground">PDFs prontos para impressão e assinatura</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ordem correta de uso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Ordem de Uso Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                passo: 1,
                titulo: 'Verifique os dados dos profissionais',
                descricao: 'Antes de qualquer coisa, confira se todos têm CPF, salário e data de admissão preenchidos.',
                onde: 'Menu → Cadastros → Profissionais',
                tempo: '5 minutos',
              },
              {
                passo: 2,
                titulo: 'Revise os alertas',
                descricao: 'Veja se há ASO vencidos, férias pendentes ou outros problemas a resolver.',
                onde: 'Dashboard → Alertas',
                tempo: '5 minutos',
              },
              {
                passo: 3,
                titulo: 'Simule a folha',
                descricao: 'Veja todos os valores calculados antes de fechar. Você pode simular quantas vezes quiser, sem gerar nenhum efeito.',
                onde: 'Dashboard → Simulador Folha',
                tempo: '10 minutos',
              },
              {
                passo: 4,
                titulo: 'Feche a folha',
                descricao: 'Quando estiver satisfeito com os valores, clique em "Fechar Folha". Isso grava os dados definitivamente.',
                onde: 'Simulador Folha → Botão Fechar',
                tempo: '2 minutos',
              },
              {
                passo: 5,
                titulo: 'Gere os holerites',
                descricao: 'Após fechar, você pode gerar os PDFs dos holerites para cada funcionário.',
                onde: 'Menu → Folha → Holerites',
                tempo: '5 minutos',
              },
            ].map((item) => (
              <div key={item.passo} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {item.passo}
                  </div>
                </div>
                <div className="flex-1 pb-4 border-b border-border last:border-0">
                  <p className="font-medium">{item.titulo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.descricao}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-primary">{item.onde}</span>
                    <Badge variant="secondary">{item.tempo}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Onde pode errar sem problemas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-success/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-success">
              <Shield className="h-4 w-4" />
              Pode fazer sem medo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
              <p className="text-sm">Simular a folha quantas vezes quiser</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
              <p className="text-sm">Alterar dados de profissionais</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
              <p className="text-sm">Consultar relatórios e painéis</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
              <p className="text-sm">Registrar faltas e vales</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
              <p className="text-sm">Navegar por todo o sistema</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Requer atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm"><strong>Fechar Folha:</strong> gera registro definitivo</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm"><strong>Excluir profissional:</strong> ação irreversível</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <p className="text-sm"><strong>Quitar empréstimo:</strong> marca como pago</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">Todas as ações importantes pedem confirmação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dica final */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-primary">Dica importante</p>
              <p className="text-sm text-muted-foreground mt-1">
                Se tiver dúvidas, sempre comece pelo <strong>Dashboard</strong>. Lá você encontra um resumo 
                de tudo que está acontecendo e o que precisa da sua atenção. O sistema foi feito para 
                guiar você pelo caminho certo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

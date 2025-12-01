import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Inconsistencia {
  tipo: string;
  matricula: string;
  nome: string;
  detalhe: string;
  severidade: 'alta' | 'media' | 'baixa';
}

export default function ValidacaoDados() {
  const [inconsistencias, setInconsistencias] = useState<Inconsistencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ultimaValidacao, setUltimaValidacao] = useState<Date | null>(null);

  const validarDados = () => {
    setIsLoading(true);
    const novasInconsistencias: Inconsistencia[] = [];

    try {
      // Carregar dados do localStorage
      const profissionaisStr = localStorage.getItem('profissionaisImportados');
      const dadosASOStr = localStorage.getItem('dadosASO');
      const dadosBeneficiosStr = localStorage.getItem('dadosBeneficios');

      if (!profissionaisStr) {
        toast.error('ATIVOS.xlsx não foi carregado');
        setIsLoading(false);
        return;
      }

      const profissionais = JSON.parse(profissionaisStr);
      const dadosASO = dadosASOStr ? JSON.parse(dadosASOStr) : [];
      const dadosBeneficios = dadosBeneficiosStr ? JSON.parse(dadosBeneficiosStr) : [];

      // Criar maps para busca rápida
      const profissionaisMap = new Map(profissionais.map((p: any) => [p.matricula, p]));
      const asoMap = new Map(dadosASO.map((a: any) => [a.matricula, a]));
      const beneficiosMap = new Map(dadosBeneficios.map((b: any) => [b.matricula, b]));

      // 1. Verificar profissionais sem registro de ASO
      profissionais.forEach((prof: any) => {
        if (!asoMap.has(prof.matricula)) {
          novasInconsistencias.push({
            tipo: 'ASO Ausente',
            matricula: prof.matricula,
            nome: prof.nome,
            detalhe: 'Profissional não possui registro de exames ASO na BASE_ASO',
            severidade: 'alta',
          });
        }
      });

      // 2. Verificar profissionais sem registro de Benefícios
      profissionais.forEach((prof: any) => {
        if (!beneficiosMap.has(prof.matricula)) {
          novasInconsistencias.push({
            tipo: 'Benefícios Ausente',
            matricula: prof.matricula,
            nome: prof.nome,
            detalhe: 'Profissional não possui registro de benefícios na BASE_Beneficios',
            severidade: 'alta',
          });
        }
      });

      // 3. Verificar registros ASO sem profissional correspondente
      dadosASO.forEach((aso: any) => {
        if (!profissionaisMap.has(aso.matricula)) {
          novasInconsistencias.push({
            tipo: 'ASO Órfão',
            matricula: aso.matricula,
            nome: aso.nome || 'N/A',
            detalhe: 'Registro de ASO existe mas profissional não está em ATIVOS.xlsx',
            severidade: 'media',
          });
        }
      });

      // 4. Verificar registros Benefícios sem profissional correspondente
      dadosBeneficios.forEach((ben: any) => {
        if (!profissionaisMap.has(ben.matricula)) {
          novasInconsistencias.push({
            tipo: 'Benefício Órfão',
            matricula: ben.matricula,
            nome: ben.nome || 'N/A',
            detalhe: 'Registro de benefício existe mas profissional não está em ATIVOS.xlsx',
            severidade: 'media',
          });
        }
      });

      // 5. Verificar inconsistências de dados (nome, loja)
      profissionais.forEach((prof: any) => {
        const aso = asoMap.get(prof.matricula) as any;
        const ben = beneficiosMap.get(prof.matricula) as any;

        if (aso) {
          if (aso.nome && aso.nome !== prof.nome) {
            novasInconsistencias.push({
              tipo: 'Nome Divergente ASO',
              matricula: prof.matricula,
              nome: prof.nome,
              detalhe: `Nome em ATIVOS: "${prof.nome}" vs BASE_ASO: "${aso.nome}"`,
              severidade: 'baixa',
            });
          }
          if (aso.localTrabalho && aso.localTrabalho !== prof.localTrabalho) {
            novasInconsistencias.push({
              tipo: 'Loja Divergente ASO',
              matricula: prof.matricula,
              nome: prof.nome,
              detalhe: `Loja em ATIVOS: "${prof.localTrabalho}" vs BASE_ASO: "${aso.localTrabalho}"`,
              severidade: 'baixa',
            });
          }
        }

        if (ben) {
          if (ben.nome && ben.nome !== prof.nome) {
            novasInconsistencias.push({
              tipo: 'Nome Divergente Benefícios',
              matricula: prof.matricula,
              nome: prof.nome,
              detalhe: `Nome em ATIVOS: "${prof.nome}" vs BASE_Beneficios: "${ben.nome}"`,
              severidade: 'baixa',
            });
          }
          if (ben.localTrabalho && ben.localTrabalho !== prof.localTrabalho) {
            novasInconsistencias.push({
              tipo: 'Loja Divergente Benefícios',
              matricula: prof.matricula,
              nome: prof.nome,
              detalhe: `Loja em ATIVOS: "${prof.localTrabalho}" vs BASE_Beneficios: "${ben.localTrabalho}"`,
              severidade: 'baixa',
            });
          }
        }
      });

      setInconsistencias(novasInconsistencias);
      setUltimaValidacao(new Date());
      
      if (novasInconsistencias.length === 0) {
        toast.success('Validação concluída: Nenhuma inconsistência encontrada!');
      } else {
        toast.warning(`Validação concluída: ${novasInconsistencias.length} inconsistência(s) encontrada(s)`);
      }
    } catch (error) {
      console.error('Erro ao validar dados:', error);
      toast.error('Erro ao validar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validarDados();
  }, []);

  const exportarCSV = () => {
    const headers = ['Tipo', 'Matrícula', 'Nome', 'Detalhe', 'Severidade'];
    const rows = inconsistencias.map(inc => [
      inc.tipo,
      inc.matricula,
      inc.nome,
      inc.detalhe,
      inc.severidade,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `validacao_dados_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Relatório exportado com sucesso!');
  };

  const getInconsistenciasPorSeveridade = (severidade: 'alta' | 'media' | 'baixa') => {
    return inconsistencias.filter(inc => inc.severidade === severidade);
  };

  const getInconsistenciasPorTipo = (tipo: string) => {
    return inconsistencias.filter(inc => inc.tipo.includes(tipo));
  };

  const getBadgeColor = (severidade: string) => {
    switch (severidade) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Validação de Dados</h1>
          <p className="text-muted-foreground">
            Relatório de inconsistências entre ATIVOS.xlsx e planilhas BASE
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={validarDados} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Revalidar
          </Button>
          <Button onClick={exportarCSV} disabled={inconsistencias.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Inconsistências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{inconsistencias.length}</span>
              {inconsistencias.length === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Severidade Alta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-600">
                {getInconsistenciasPorSeveridade('alta').length}
              </span>
              <Badge variant="destructive">ALTA</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Severidade Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-orange-600">
                {getInconsistenciasPorSeveridade('media').length}
              </span>
              <Badge variant="default">MÉDIA</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Severidade Baixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-yellow-600">
                {getInconsistenciasPorSeveridade('baixa').length}
              </span>
              <Badge variant="secondary">BAIXA</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {ultimaValidacao && (
        <p className="text-sm text-muted-foreground">
          Última validação: {ultimaValidacao.toLocaleString('pt-BR')}
        </p>
      )}

      {/* Tabs com diferentes visualizações */}
      <Tabs defaultValue="todas" className="w-full">
        <TabsList>
          <TabsTrigger value="todas">
            Todas ({inconsistencias.length})
          </TabsTrigger>
          <TabsTrigger value="aso">
            ASO ({getInconsistenciasPorTipo('ASO').length})
          </TabsTrigger>
          <TabsTrigger value="beneficios">
            Benefícios ({getInconsistenciasPorTipo('Benefícios').length})
          </TabsTrigger>
          <TabsTrigger value="divergencias">
            Divergências ({getInconsistenciasPorTipo('Divergente').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Inconsistências</CardTitle>
            </CardHeader>
            <CardContent>
              {inconsistencias.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma Inconsistência Encontrada!</h3>
                  <p className="text-muted-foreground">
                    Os dados estão sincronizados entre ATIVOS.xlsx e as planilhas BASE.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Detalhe</TableHead>
                      <TableHead>Severidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inconsistencias.map((inc, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{inc.tipo}</TableCell>
                        <TableCell>{inc.matricula}</TableCell>
                        <TableCell>{inc.nome}</TableCell>
                        <TableCell className="max-w-md">{inc.detalhe}</TableCell>
                        <TableCell>
                          <Badge variant={getBadgeColor(inc.severidade)}>
                            {inc.severidade.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aso">
          <Card>
            <CardHeader>
              <CardTitle>Inconsistências - ASO</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead>Severidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getInconsistenciasPorTipo('ASO').map((inc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{inc.tipo}</TableCell>
                      <TableCell>{inc.matricula}</TableCell>
                      <TableCell>{inc.nome}</TableCell>
                      <TableCell className="max-w-md">{inc.detalhe}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeColor(inc.severidade)}>
                          {inc.severidade.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="beneficios">
          <Card>
            <CardHeader>
              <CardTitle>Inconsistências - Benefícios</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead>Severidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getInconsistenciasPorTipo('Benefícios').map((inc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{inc.tipo}</TableCell>
                      <TableCell>{inc.matricula}</TableCell>
                      <TableCell>{inc.nome}</TableCell>
                      <TableCell className="max-w-md">{inc.detalhe}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeColor(inc.severidade)}>
                          {inc.severidade.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="divergencias">
          <Card>
            <CardHeader>
              <CardTitle>Divergências de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead>Severidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getInconsistenciasPorTipo('Divergente').map((inc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{inc.tipo}</TableCell>
                      <TableCell>{inc.matricula}</TableCell>
                      <TableCell>{inc.nome}</TableCell>
                      <TableCell className="max-w-md">{inc.detalhe}</TableCell>
                      <TableCell>
                        <Badge variant={getBadgeColor(inc.severidade)}>
                          {inc.severidade.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

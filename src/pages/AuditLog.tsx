import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Trash2, Filter, Clock, User, Activity, FileBox, AlertCircle } from 'lucide-react';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { matchesSearch } from '@/lib/searchUtils';

export default function AuditLog() {
  const { logs, clearLogs, exportLogs, getLogsByModule } = useAuditLog();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduloFiltro, setModuloFiltro] = useState<string>('TODOS');
  const [acaoFiltro, setAcaoFiltro] = useState<string>('TODAS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'CRIAR':
        return <Badge className="bg-success/10 text-success border-success/20">Criar</Badge>;
      case 'EDITAR':
        return <Badge className="bg-accent/10 text-accent border-accent/20">Editar</Badge>;
      case 'EXCLUIR':
        return <Badge variant="destructive">Excluir</Badge>;
      case 'VISUALIZAR':
        return <Badge variant="outline">Visualizar</Badge>;
      case 'EXPORTAR':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Exportar</Badge>;
      default:
        return <Badge variant="secondary">{acao}</Badge>;
    }
  };

  const getModuloBadge = (modulo: string) => {
    const colors: Record<string, string> = {
      PROFISSIONAIS: 'bg-primary/10 text-primary border-primary/20',
      LOJAS: 'bg-accent/10 text-accent border-accent/20',
      VALES: 'bg-success/10 text-success border-success/20',
      ADVERTENCIAS: 'bg-destructive/10 text-destructive border-destructive/20',
      DOCUMENTOS: 'bg-warning/10 text-warning border-warning/20',
      FERIAS: 'bg-primary/10 text-primary border-primary/20',
      FALTAS: 'bg-destructive/10 text-destructive border-destructive/20',
      ASO: 'bg-accent/10 text-accent border-accent/20',
      FOLHA: 'bg-success/10 text-success border-success/20',
      AFASTAMENTOS: 'bg-warning/10 text-warning border-warning/20',
      EPI: 'bg-primary/10 text-primary border-primary/20',
    };
    return <Badge className={colors[modulo] || 'bg-secondary'}>{modulo}</Badge>;
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filtro de busca
      if (searchTerm && !matchesSearch(searchTerm, [log.usuario, log.entidade, log.detalhes, log.modulo, log.acao])) {
        return false;
      }

      // Filtro de módulo
      if (moduloFiltro !== 'TODOS' && log.modulo !== moduloFiltro) {
        return false;
      }

      // Filtro de ação
      if (acaoFiltro !== 'TODAS' && log.acao !== acaoFiltro) {
        return false;
      }

      // Filtro de data
      if (dataInicio || dataFim) {
        const logDate = new Date(log.timestamp);
        if (dataInicio && logDate < new Date(dataInicio)) return false;
        if (dataFim && logDate > new Date(dataFim + 'T23:59:59')) return false;
      }

      return true;
    });
  }, [logs, searchTerm, moduloFiltro, acaoFiltro, dataInicio, dataFim]);

  const estatisticas = useMemo(() => {
    return {
      total: logs.length,
      criar: logs.filter(l => l.acao === 'CRIAR').length,
      editar: logs.filter(l => l.acao === 'EDITAR').length,
      excluir: logs.filter(l => l.acao === 'EXCLUIR').length,
      hoje: logs.filter(l => {
        const logDate = new Date(l.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length,
    };
  }, [logs]);

  const logsPorModulo = useMemo(() => {
    const modulos = ['PROFISSIONAIS', 'LOJAS', 'VALES', 'ADVERTENCIAS', 'DOCUMENTOS', 'FERIAS', 'FALTAS', 'ASO', 'FOLHA', 'AFASTAMENTOS', 'EPI'];
    return modulos.map(modulo => ({
      modulo,
      quantidade: getLogsByModule(modulo as any).length,
    }));
  }, [logs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Alterações</h1>
          <p className="text-muted-foreground">Rastreabilidade completa de todas as operações no sistema</p>
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Clock className="h-4 w-4 mr-2" />
          Audit Log
        </Badge>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold">{estatisticas.total}</p>
                <p className="text-xs text-muted-foreground">Total Registros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-success">{estatisticas.criar}</p>
                <p className="text-xs text-muted-foreground">Criações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-accent">{estatisticas.editar}</p>
                <p className="text-xs text-muted-foreground">Edições</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-destructive">{estatisticas.excluir}</p>
                <p className="text-xs text-muted-foreground">Exclusões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold text-primary">{estatisticas.hoje}</p>
                <p className="text-xs text-muted-foreground">Hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="modulos">Por Módulo</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Filtros */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Entidade ou detalhes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modulo">Módulo</Label>
                  <Select value={moduloFiltro} onValueChange={setModuloFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos os Módulos</SelectItem>
                      <SelectItem value="PROFISSIONAIS">Profissionais</SelectItem>
                      <SelectItem value="LOJAS">Lojas</SelectItem>
                      <SelectItem value="VALES">Vales</SelectItem>
                      <SelectItem value="ADVERTENCIAS">Advertências</SelectItem>
                      <SelectItem value="DOCUMENTOS">Documentos</SelectItem>
                      <SelectItem value="FERIAS">Férias</SelectItem>
                      <SelectItem value="FALTAS">Faltas</SelectItem>
                      <SelectItem value="ASO">ASO</SelectItem>
                      <SelectItem value="FOLHA">Folha</SelectItem>
                      <SelectItem value="AFASTAMENTOS">Afastamentos</SelectItem>
                      <SelectItem value="EPI">EPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acao">Ação</Label>
                  <Select value={acaoFiltro} onValueChange={setAcaoFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAS">Todas as Ações</SelectItem>
                      <SelectItem value="CRIAR">Criar</SelectItem>
                      <SelectItem value="EDITAR">Editar</SelectItem>
                      <SelectItem value="EXCLUIR">Excluir</SelectItem>
                      <SelectItem value="VISUALIZAR">Visualizar</SelectItem>
                      <SelectItem value="EXPORTAR">Exportar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={exportLogs} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Button onClick={clearLogs} variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Histórico
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline de Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Timeline de Alterações ({filteredLogs.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum registro encontrado</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{log.usuario}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getAcaoBadge(log.acao)}</TableCell>
                          <TableCell>{getModuloBadge(log.modulo)}</TableCell>
                          <TableCell className="font-medium">{log.entidade}</TableCell>
                          <TableCell className="max-w-md truncate text-sm text-muted-foreground" title={log.detalhes}>
                            {log.detalhes}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modulos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBox className="h-5 w-5" />
                Atividade por Módulo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {logsPorModulo.map(({ modulo, quantidade }) => (
                  <Card key={modulo} className="bg-card/50 border-border/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        {getModuloBadge(modulo)}
                        <span className="text-2xl font-bold">{quantidade}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">operações registradas</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from 'react';
import { Plus, LayoutGrid, List, Filter, AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOcorrencias, Ocorrencia, OcorrenciaStatus } from '@/hooks/useOcorrencias';
import { OcorrenciasKanban } from '@/components/ocorrencias/OcorrenciasKanban';
import { NovaOcorrenciaModal } from '@/components/ocorrencias/NovaOcorrenciaModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Ocorrencias() {
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');
  
  const { 
    ocorrencias, 
    loading, 
    createOcorrencia, 
    updateOcorrencia, 
    getEstatisticas 
  } = useOcorrencias();

  const stats = getEstatisticas();

  const handleStatusChange = async (id: string, newStatus: OcorrenciaStatus) => {
    await updateOcorrencia(id, { status: newStatus });
  };

  const handleViewDetails = (ocorrencia: Ocorrencia) => {
    // TODO: Implementar modal de detalhes
    console.log('Ver detalhes:', ocorrencia);
  };

  const filteredOcorrencias = ocorrencias.filter(o => {
    if (filtroStatus !== 'todos' && o.status !== filtroStatus) return false;
    if (filtroPrioridade !== 'todos' && o.prioridade !== filtroPrioridade) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Ocorrências</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie todas as ocorrências do sistema</p>
        </div>
        <Button onClick={() => setShowNovaModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ocorrência
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">{stats.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{stats.emAndamento}</p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold text-emerald-500">{stats.concluidas}</p>
                <p className="text-sm text-muted-foreground">Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.criticas + stats.vencidas}</p>
                <p className="text-sm text-muted-foreground">Críticas/Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Visualização */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant={view === 'kanban' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setView('kanban')}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Kanban
              </Button>
              <Button 
                variant={view === 'lista' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setView('lista')}
              >
                <List className="h-4 w-4 mr-1" />
                Lista
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando ocorrências...</p>
            </div>
          ) : view === 'kanban' ? (
            <OcorrenciasKanban 
              ocorrencias={filteredOcorrencias}
              onStatusChange={handleStatusChange}
              onViewDetails={handleViewDetails}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOcorrencias.map((ocorrencia) => (
                  <TableRow 
                    key={ocorrencia.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(ocorrencia)}
                  >
                    <TableCell className="font-medium">{ocorrencia.titulo}</TableCell>
                    <TableCell>{ocorrencia.tipo}</TableCell>
                    <TableCell>
                      <Badge variant={
                        ocorrencia.prioridade === 'critica' ? 'destructive' :
                        ocorrencia.prioridade === 'alta' ? 'default' :
                        'secondary'
                      }>
                        {ocorrencia.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ocorrencia.status}</Badge>
                    </TableCell>
                    <TableCell>{ocorrencia.profissional?.nome || '-'}</TableCell>
                    <TableCell>
                      {ocorrencia.data_prazo 
                        ? format(new Date(ocorrencia.data_prazo), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(ocorrencia.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOcorrencias.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma ocorrência encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Ocorrência */}
      <NovaOcorrenciaModal
        open={showNovaModal}
        onOpenChange={setShowNovaModal}
        onSubmit={createOcorrencia}
      />
    </div>
  );
}

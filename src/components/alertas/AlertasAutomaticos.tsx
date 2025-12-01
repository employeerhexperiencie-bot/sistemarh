import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, AlertTriangle, Calendar, FileText, Stethoscope, 
  Clock, CheckCircle, XCircle, Building2, User, ChevronRight,
  Filter, Download, RefreshCw, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export type TipoAlerta = 'aso' | 'ferias' | 'documento' | 'epi' | 'afastamento';
export type NivelAlerta = 'critico' | 'urgente' | 'atencao' | 'info';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  nivel: NivelAlerta;
  titulo: string;
  descricao: string;
  dataVencimento: string;
  diasRestantes: number;
  loja: string;
  profissional?: string;
  matricula?: string;
  acaoUrl?: string;
  lido: boolean;
  resolvido: boolean;
}

// Gerar alertas mock baseado nas regras de negócio
const gerarAlertasMock = (): Alerta[] => {
  const lojas = ['Loja 01', 'Loja 02', 'Loja 03', 'Loja 04', 'Loja 05', 'Loja 06', 'Loja 07'];
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima', 'Carlos Oliveira', 
    'Julia Souza', 'Lucas Ferreira', 'Fernanda Alves', 'Ricardo Rodrigues', 'Mariana Pereira'];
  
  const alertas: Alerta[] = [];
  let id = 1;
  
  const hoje = new Date();
  
  // ASO - Vencendo em 30, 15, 7 dias ou vencidos
  const diasASO = [-5, -2, 3, 7, 12, 15, 22, 28, 35];
  diasASO.forEach((dias, idx) => {
    const dataVenc = new Date(hoje);
    dataVenc.setDate(dataVenc.getDate() + dias);
    
    let nivel: NivelAlerta = 'info';
    if (dias <= 0) nivel = 'critico';
    else if (dias <= 7) nivel = 'urgente';
    else if (dias <= 15) nivel = 'atencao';
    
    alertas.push({
      id: `aso-${id++}`,
      tipo: 'aso',
      nivel,
      titulo: dias <= 0 ? 'ASO Vencido' : 'ASO Vencendo',
      descricao: dias <= 0 
        ? `Exame ocupacional vencido há ${Math.abs(dias)} dias`
        : `Exame ocupacional vence em ${dias} dias`,
      dataVencimento: dataVenc.toISOString().split('T')[0],
      diasRestantes: dias,
      loja: lojas[idx % lojas.length],
      profissional: nomes[idx % nomes.length],
      matricula: String(100 + idx).padStart(4, '0'),
      acaoUrl: '/gestao-asus',
      lido: Math.random() > 0.5,
      resolvido: false,
    });
  });
  
  // Férias - Período aquisitivo vencendo
  const diasFerias = [-10, 5, 15, 25, 30, 45, 60];
  diasFerias.forEach((dias, idx) => {
    const dataVenc = new Date(hoje);
    dataVenc.setDate(dataVenc.getDate() + dias);
    
    let nivel: NivelAlerta = 'info';
    if (dias <= 0) nivel = 'critico';
    else if (dias <= 15) nivel = 'urgente';
    else if (dias <= 30) nivel = 'atencao';
    
    alertas.push({
      id: `ferias-${id++}`,
      tipo: 'ferias',
      nivel,
      titulo: dias <= 0 ? 'Férias Vencidas' : 'Férias a Vencer',
      descricao: dias <= 0 
        ? `Período aquisitivo venceu há ${Math.abs(dias)} dias - AÇÃO URGENTE`
        : `Período aquisitivo vence em ${dias} dias`,
      dataVencimento: dataVenc.toISOString().split('T')[0],
      diasRestantes: dias,
      loja: lojas[(idx + 2) % lojas.length],
      profissional: nomes[(idx + 3) % nomes.length],
      matricula: String(200 + idx).padStart(4, '0'),
      acaoUrl: '/gestao-ferias',
      lido: Math.random() > 0.6,
      resolvido: false,
    });
  });
  
  // Documentos - CNH, contratos, etc.
  const tiposDoc = ['CNH', 'Contrato de Trabalho', 'Certidão Negativa', 'Alvará', 'Certificado NR'];
  const diasDoc = [-3, 5, 10, 20, 25, 40];
  diasDoc.forEach((dias, idx) => {
    const dataVenc = new Date(hoje);
    dataVenc.setDate(dataVenc.getDate() + dias);
    
    let nivel: NivelAlerta = 'info';
    if (dias <= 0) nivel = 'critico';
    else if (dias <= 7) nivel = 'urgente';
    else if (dias <= 15) nivel = 'atencao';
    
    alertas.push({
      id: `doc-${id++}`,
      tipo: 'documento',
      nivel,
      titulo: dias <= 0 ? 'Documento Vencido' : 'Documento Vencendo',
      descricao: `${tiposDoc[idx % tiposDoc.length]} ${dias <= 0 ? `venceu há ${Math.abs(dias)} dias` : `vence em ${dias} dias`}`,
      dataVencimento: dataVenc.toISOString().split('T')[0],
      diasRestantes: dias,
      loja: lojas[(idx + 1) % lojas.length],
      profissional: idx < 3 ? nomes[idx % nomes.length] : undefined,
      matricula: idx < 3 ? String(300 + idx).padStart(4, '0') : undefined,
      acaoUrl: idx < 3 ? '/painel-profissional' : '/cadastro-lojas',
      lido: Math.random() > 0.4,
      resolvido: false,
    });
  });
  
  return alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
};

const getNivelConfig = (nivel: NivelAlerta) => {
  const config = {
    critico: { 
      label: 'Crítico', 
      className: 'bg-destructive text-destructive-foreground',
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10 border-destructive/20'
    },
    urgente: { 
      label: 'Urgente', 
      className: 'bg-warning text-warning-foreground',
      iconColor: 'text-warning',
      bgColor: 'bg-warning/10 border-warning/20'
    },
    atencao: { 
      label: 'Atenção', 
      className: 'bg-info/80 text-info-foreground',
      iconColor: 'text-info',
      bgColor: 'bg-info/10 border-info/20'
    },
    info: { 
      label: 'Info', 
      className: 'bg-muted text-muted-foreground',
      iconColor: 'text-muted-foreground',
      bgColor: 'bg-muted/50'
    },
  };
  return config[nivel];
};

const getTipoConfig = (tipo: TipoAlerta) => {
  const config = {
    aso: { label: 'ASO', icon: Stethoscope, color: 'text-success' },
    ferias: { label: 'Férias', icon: Calendar, color: 'text-info' },
    documento: { label: 'Documento', icon: FileText, color: 'text-warning' },
    epi: { label: 'EPI', icon: FileText, color: 'text-accent' },
    afastamento: { label: 'Afastamento', icon: Clock, color: 'text-destructive' },
  };
  return config[tipo];
};

interface AlertaItemProps {
  alerta: Alerta;
  onMarcarLido?: (id: string) => void;
  onResolver?: (id: string) => void;
  compact?: boolean;
}

export function AlertaItem({ alerta, onMarcarLido, onResolver, compact = false }: AlertaItemProps) {
  const navigate = useNavigate();
  const nivelConfig = getNivelConfig(alerta.nivel);
  const tipoConfig = getTipoConfig(alerta.tipo);
  const TipoIcon = tipoConfig.icon;
  
  if (compact) {
    return (
      <div 
        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${nivelConfig.bgColor} ${alerta.lido ? 'opacity-70' : ''}`}
        onClick={() => alerta.acaoUrl && navigate(alerta.acaoUrl)}
      >
        <div className={`p-1.5 rounded-lg ${alerta.nivel === 'critico' ? 'bg-destructive/20' : 'bg-background/50'}`}>
          <TipoIcon className={`h-4 w-4 ${tipoConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium truncate">{alerta.titulo}</p>
            {!alerta.lido && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{alerta.descricao}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{alerta.loja}</Badge>
            {alerta.profissional && (
              <span className="text-[10px] text-muted-foreground">{alerta.profissional}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <Badge className={`text-[10px] ${nivelConfig.className}`}>
            {alerta.diasRestantes <= 0 ? 'Vencido' : `${alerta.diasRestantes}d`}
          </Badge>
        </div>
      </div>
    );
  }
  
  return (
    <TableRow className={`${alerta.lido ? 'opacity-70' : ''} hover:bg-muted/50`}>
      <TableCell>
        <div className="flex items-center gap-2">
          <TipoIcon className={`h-4 w-4 ${tipoConfig.color}`} />
          <Badge variant="outline" className="text-xs">{tipoConfig.label}</Badge>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`text-xs ${nivelConfig.className}`}>{nivelConfig.label}</Badge>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{alerta.titulo}</p>
          <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">{alerta.loja}</Badge>
      </TableCell>
      <TableCell>
        {alerta.profissional ? (
          <div>
            <p className="text-sm">{alerta.profissional}</p>
            <p className="text-xs text-muted-foreground font-mono">{alerta.matricula}</p>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={alerta.diasRestantes <= 0 ? 'destructive' : 'secondary'}>
          {alerta.diasRestantes <= 0 ? `${Math.abs(alerta.diasRestantes)}d atrás` : `${alerta.diasRestantes}d`}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {alerta.acaoUrl && (
            <Button variant="ghost" size="sm" onClick={() => navigate(alerta.acaoUrl!)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onMarcarLido && !alerta.lido && (
            <Button variant="ghost" size="sm" onClick={() => onMarcarLido(alerta.id)}>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function CentralAlertas() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState<Alerta[]>(() => gerarAlertasMock());
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [nivelFiltro, setNivelFiltro] = useState<string>('todos');
  const [lojaFiltro, setLojaFiltro] = useState<string>('todas');
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const alertasFiltrados = useMemo(() => {
    return alertas.filter(a => {
      if (tipoFiltro !== 'todos' && a.tipo !== tipoFiltro) return false;
      if (nivelFiltro !== 'todos' && a.nivel !== nivelFiltro) return false;
      if (lojaFiltro !== 'todas' && a.loja !== lojaFiltro) return false;
      if (!mostrarResolvidos && a.resolvido) return false;
      if (searchTerm && !a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !a.descricao.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !(a.profissional?.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
      return true;
    });
  }, [alertas, tipoFiltro, nivelFiltro, lojaFiltro, mostrarResolvidos, searchTerm]);
  
  const contadores = useMemo(() => ({
    total: alertas.filter(a => !a.resolvido).length,
    critico: alertas.filter(a => a.nivel === 'critico' && !a.resolvido).length,
    urgente: alertas.filter(a => a.nivel === 'urgente' && !a.resolvido).length,
    atencao: alertas.filter(a => a.nivel === 'atencao' && !a.resolvido).length,
    aso: alertas.filter(a => a.tipo === 'aso' && !a.resolvido).length,
    ferias: alertas.filter(a => a.tipo === 'ferias' && !a.resolvido).length,
    documento: alertas.filter(a => a.tipo === 'documento' && !a.resolvido).length,
    naoLidos: alertas.filter(a => !a.lido && !a.resolvido).length,
  }), [alertas]);
  
  const lojas = useMemo(() => [...new Set(alertas.map(a => a.loja))], [alertas]);
  
  const marcarLido = (id: string) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, lido: true } : a));
  };
  
  const marcarTodosLidos = () => {
    setAlertas(prev => prev.map(a => ({ ...a, lido: true })));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Central de Alertas
            {contadores.naoLidos > 0 && (
              <Badge variant="destructive" className="ml-2">{contadores.naoLidos} novos</Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitoramento de vencimentos e pendências
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={marcarTodosLidos}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Marcar todos como lidos
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{contadores.critico}</p>
            <p className="text-xs text-muted-foreground">Críticos</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-warning">{contadores.urgente}</p>
            <p className="text-xs text-muted-foreground">Urgentes</p>
          </CardContent>
        </Card>
        <Card className="bg-info/5 border-info/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-info">{contadores.atencao}</p>
            <p className="text-xs text-muted-foreground">Atenção</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{contadores.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-success">{contadores.aso}</p>
            <p className="text-xs text-muted-foreground">ASOs</p>
          </CardContent>
        </Card>
        <Card className="bg-info/5 border-info/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-info">{contadores.ferias}</p>
            <p className="text-xs text-muted-foreground">Férias</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-warning">{contadores.documento}</p>
            <p className="text-xs text-muted-foreground">Documentos</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aso">ASO</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nível</Label>
              <Select value={nivelFiltro} onValueChange={setNivelFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="atencao">Atenção</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {lojas.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Buscar</Label>
              <Input
                placeholder="Nome, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={mostrarResolvidos}
                onCheckedChange={setMostrarResolvidos}
              />
              <Label className="text-xs">Mostrar resolvidos</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table className="table-zebra">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-28">Tipo</TableHead>
                  <TableHead className="w-24">Nível</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Loja</TableHead>
                  <TableHead className="w-32">Profissional</TableHead>
                  <TableHead className="w-24 text-center">Vencimento</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasFiltrados.map((alerta) => (
                  <AlertaItem 
                    key={alerta.id} 
                    alerta={alerta} 
                    onMarcarLido={marcarLido}
                  />
                ))}
                {alertasFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum alerta encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de Resumo para uso no Dashboard
export function AlertasResumo({ maxItems = 5 }: { maxItems?: number }) {
  const navigate = useNavigate();
  const alertas = useMemo(() => gerarAlertasMock().filter(a => !a.resolvido).slice(0, maxItems), [maxItems]);
  
  const criticos = alertas.filter(a => a.nivel === 'critico').length;
  const urgentes = alertas.filter(a => a.nivel === 'urgente').length;
  
  return (
    <Card className={criticos > 0 ? 'border-destructive/30' : urgentes > 0 ? 'border-warning/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className={`p-1.5 rounded-lg ${criticos > 0 ? 'bg-destructive/10' : 'bg-warning/10'}`}>
              <AlertTriangle className={`h-4 w-4 ${criticos > 0 ? 'text-destructive' : 'text-warning'}`} />
            </div>
            Alertas Pendentes
            {(criticos + urgentes) > 0 && (
              <Badge variant={criticos > 0 ? 'destructive' : 'secondary'} className="ml-2">
                {criticos > 0 ? `${criticos} críticos` : `${urgentes} urgentes`}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/alertas')}>
            Ver todos
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {alertas.map((alerta) => (
          <AlertaItem key={alerta.id} alerta={alerta} compact />
        ))}
        {alertas.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-sm">Nenhum alerta pendente!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de Badge para o Header
export function AlertasBadge() {
  const alertas = useMemo(() => gerarAlertasMock().filter(a => !a.resolvido && !a.lido), []);
  const criticos = alertas.filter(a => a.nivel === 'critico').length;
  
  if (alertas.length === 0) return null;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
            criticos > 0 ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-warning text-warning-foreground'
          }`}>
            {alertas.length > 9 ? '9+' : alertas.length}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas ({alertas.length})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 pb-4">
            {alertas.slice(0, 10).map((alerta) => (
              <AlertaItem key={alerta.id} alerta={alerta} compact />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

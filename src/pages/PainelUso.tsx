import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  Clock, Activity, Users, BarChart3, RefreshCw, TrendingUp,
  CheckCircle, XCircle, Monitor, FileText, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserSessionSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  total_sessions: number;
  total_duration_seconds: number;
  total_pages: number;
  last_active: string;
  is_online: boolean;
}

interface ActivityEvent {
  id: string;
  user_id: string;
  action: string;
  module: string;
  entity_type: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

interface ModuleStats {
  module: string;
  total_events: number;
  success_count: number;
  error_count: number;
  success_rate: number;
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}min`;
};

export default function PainelUso() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [userSummaries, setUserSummaries] = useState<UserSessionSummary[]>([]);
  const [recentEvents, setRecentEvents] = useState<ActivityEvent[]>([]);
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [totals, setTotals] = useState({ sessions: 0, duration: 0, events: 0, errors: 0, users: 0 });

  const getPeriodDate = useCallback(() => {
    const d = new Date();
    switch (period) {
      case '7d': d.setDate(d.getDate() - 7); break;
      case '30d': d.setDate(d.getDate() - 30); break;
      case '90d': d.setDate(d.getDate() - 90); break;
    }
    return d.toISOString();
  }, [period]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const since = getPeriodDate();

    try {
      // Buscar sessões
      const { data: sessions } = await supabase
        .from('user_activity_sessions')
        .select('*')
        .gte('started_at', since)
        .order('started_at', { ascending: false });

      // Buscar eventos de atividade
      const { data: events } = await supabase
        .from('user_activity_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      // Buscar logs de erro do sistema (dev_logs)
      const { data: devLogs } = await supabase
        .from('dev_logs')
        .select('*')
        .gte('created_at', since)
        .in('tipo', ['erro', 'error', 'critical'])
        .order('created_at', { ascending: false });

      // Buscar nomes dos usuários
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, nome, role');

      const userMap = new Map<string, { nome: string; role: string }>();
      (userRoles || []).forEach((ur: any) => {
        userMap.set(ur.user_id, { nome: ur.nome || 'Sem nome', role: ur.role || '' });
      });

      // Inicializar TODOS os usuários registrados no mapa de sessões
      const userSessionMap = new Map<string, UserSessionSummary>();
      const onlineThreshold = Date.now() - 5 * 60 * 1000; // 5 min

      // Primeiro: criar entrada para TODOS os usuários do user_roles
      (userRoles || []).forEach((ur: any) => {
        userSessionMap.set(ur.user_id, {
          user_id: ur.user_id,
          user_name: ur.nome || 'Sem nome',
          user_email: ur.role || '',
          total_sessions: 0,
          total_duration_seconds: 0,
          total_pages: 0,
          last_active: '',
          is_online: false,
        });
      });

      // Depois: agregar dados de sessão para quem tem
      (sessions || []).forEach((s: any) => {
        const existing = userSessionMap.get(s.user_id);
        const isOnline = !s.ended_at && s.last_heartbeat && new Date(s.last_heartbeat).getTime() > onlineThreshold;

        if (existing) {
          existing.total_sessions += 1;
          existing.total_duration_seconds += s.duration_seconds || 0;
          existing.total_pages += s.pages_visited || 0;
          if (!existing.last_active || new Date(s.started_at) > new Date(existing.last_active)) {
            existing.last_active = s.started_at;
          }
          if (isOnline) existing.is_online = true;
        } else {
          // Usuário com sessão mas sem role (caso raro)
          const userData = userMap.get(s.user_id);
          userSessionMap.set(s.user_id, {
            user_id: s.user_id,
            user_name: userData?.nome || s.user_id.slice(0, 8),
            user_email: userData?.role || '',
            total_sessions: 1,
            total_duration_seconds: s.duration_seconds || 0,
            total_pages: s.pages_visited || 0,
            last_active: s.started_at,
            is_online: isOnline,
          });
        }
      });

      const summaries = Array.from(userSessionMap.values()).sort(
        (a, b) => b.total_duration_seconds - a.total_duration_seconds
      );

      // Agregar eventos por módulo
      const moduleMap = new Map<string, ModuleStats>();
      (events || []).forEach((e: any) => {
        const existing = moduleMap.get(e.module);
        if (existing) {
          existing.total_events += 1;
          if (e.success) existing.success_count += 1;
          else existing.error_count += 1;
        } else {
          moduleMap.set(e.module, {
            module: e.module,
            total_events: 1,
            success_count: e.success ? 1 : 0,
            error_count: e.success ? 0 : 1,
            success_rate: 0,
          });
        }
      });

      const mStats = Array.from(moduleMap.values())
        .map(m => ({ ...m, success_rate: m.total_events > 0 ? (m.success_count / m.total_events) * 100 : 0 }))
        .sort((a, b) => b.total_events - a.total_events);

      const allEvents = events || [];
      const totalErrors = allEvents.filter((e: any) => !e.success).length;

      const devLogErrors = (devLogs || []).length;

      setUserSummaries(summaries);
      setRecentEvents(allEvents.slice(0, 50) as ActivityEvent[]);
      setModuleStats(mStats);
      setTotals({
        sessions: (sessions || []).length,
        duration: summaries.reduce((s, u) => s + u.total_duration_seconds, 0),
        events: allEvents.length,
        errors: totalErrors + devLogErrors,
        users: summaries.length,
      });
    } catch (err) {
      console.error('Erro ao carregar dados de uso:', err);
    } finally {
      setLoading(false);
    }
  }, [getPeriodDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Painel de Uso</h1>
          <p className="text-muted-foreground">Carregando métricas...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel de Uso</h1>
          <p className="text-muted-foreground">
            Acompanhe tempo online, ações executadas e taxa de sucesso dos usuários
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.users}</p>
                <p className="text-xs text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-accent/10">
                <Monitor className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.sessions}</p>
                <p className="text-xs text-muted-foreground">Sessões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatDuration(totals.duration)}</p>
                <p className="text-xs text-muted-foreground">Tempo Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-success/10">
                <Activity className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.events}</p>
                <p className="text-xs text-muted-foreground">Ações Executadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totals.errors}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uso por Usuário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Uso por Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Sessões</TableHead>
                    <TableHead className="text-right">Tempo</TableHead>
                    <TableHead className="text-right">Páginas</TableHead>
                    <TableHead className="text-right">Última Ativ.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userSummaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma atividade registrada no período
                      </TableCell>
                    </TableRow>
                  ) : (
                    userSummaries.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{u.user_name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {u.is_online ? (
                            <Badge className="bg-success/10 text-success border-success/20">Online</Badge>
                          ) : (
                            <Badge variant="outline">Offline</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">{u.total_sessions}</TableCell>
                        <TableCell className="text-right font-mono">{formatDuration(u.total_duration_seconds)}</TableCell>
                        <TableCell className="text-right font-mono">{u.total_pages}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(u.last_active), { addSuffix: true, locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Uso por Módulo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Uso por Módulo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    <TableHead className="text-right">Sucesso</TableHead>
                    <TableHead className="text-right">Erros</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma ação registrada no período
                      </TableCell>
                    </TableRow>
                  ) : (
                    moduleStats.map(m => (
                      <TableRow key={m.module}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{m.module}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{m.total_events}</TableCell>
                        <TableCell className="text-right font-mono text-success">{m.success_count}</TableCell>
                        <TableCell className="text-right font-mono text-destructive">{m.error_count}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={m.success_rate >= 95 ? 'bg-success/10 text-success' : m.success_rate >= 80 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}
                          >
                            {m.success_rate.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Eventos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Ações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-80">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum evento registrado
                    </TableCell>
                  </TableRow>
                ) : (
                  recentEvents.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{e.action}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">{e.module}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.entity_type || '-'}</TableCell>
                      <TableCell className="text-center">
                        {e.success ? (
                          <CheckCircle className="h-4 w-4 text-success mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive mx-auto" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

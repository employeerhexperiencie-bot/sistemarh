import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plane, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeriasRow {
  id: string;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  periodo_gozo_inicio: string | null;
  periodo_gozo_fim: string | null;
  dias_direito: number | null;
  dias_gozados: number | null;
  status: string | null;
}

interface Props {
  profissionalId: string;
}

const fmt = (d: string | null) => {
  if (!d) return '-';
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return d;
  return `${m[3]}/${m[2]}/${m[1]}`;
};

const renderStatus = (status: string | null) => {
  switch ((status || '').toLowerCase()) {
    case 'em_gozo':
      return <Badge className="bg-success/10 text-success border-success/20">Em Férias</Badge>;
    case 'agendada':
      return <Badge className="bg-primary/10 text-primary border-primary/20">Agendado</Badge>;
    case 'finalizada':
      return <Badge variant="outline">Finalizado</Badge>;
    case 'pendente':
      return <Badge variant="secondary">Pendente</Badge>;
    default:
      return <Badge variant="secondary">{status || '-'}</Badge>;
  }
};

export function FeriasProfissional({ profissionalId }: Props) {
  const [rows, setRows] = useState<FeriasRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ferias')
        .select('id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim, periodo_gozo_inicio, periodo_gozo_fim, dias_direito, dias_gozados, status')
        .eq('profissional_id', profissionalId)
        .order('periodo_aquisitivo_inicio', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('[FeriasProfissional] erro ao carregar:', error);
        setRows([]);
      } else {
        setRows((data || []) as FeriasRow[]);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [profissionalId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" />
          Férias
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando férias...
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum período de férias registrado para este profissional.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período Aquisitivo</TableHead>
                <TableHead>Período de Gozo</TableHead>
                <TableHead className="text-center">Dias de Direito</TableHead>
                <TableHead className="text-center">Dias Gozados</TableHead>
                <TableHead className="text-center">Saldo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => {
                const direito = r.dias_direito ?? 30;
                const gozados = r.dias_gozados ?? 0;
                const saldo = Math.max(0, direito - gozados);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {fmt(r.periodo_aquisitivo_inicio)} – {fmt(r.periodo_aquisitivo_fim)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.periodo_gozo_inicio || r.periodo_gozo_fim
                        ? `${fmt(r.periodo_gozo_inicio)} – ${fmt(r.periodo_gozo_fim)}`
                        : <span className="text-muted-foreground">Não agendado</span>}
                    </TableCell>
                    <TableCell className="text-center">{direito}</TableCell>
                    <TableCell className="text-center">{gozados}</TableCell>
                    <TableCell className="text-center font-medium">{saldo}</TableCell>
                    <TableCell>{renderStatus(r.status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

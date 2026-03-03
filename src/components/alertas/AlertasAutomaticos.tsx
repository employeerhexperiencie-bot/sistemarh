import { useState, useMemo, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Bell, AlertTriangle, Calendar, FileText, Stethoscope, 
  Clock, CheckCircle, XCircle, Building2, User, ChevronRight,
  Filter, Download, RefreshCw, Eye, CheckCircle2, Info, Loader2, ChevronDown, ChevronUp,
  UserPlus, Send
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { DelegarAlertaModal, DelegarAlertaData } from './DelegarAlertaModal';

export type TipoAlerta = 'aso' | 'ferias' | 'documento' | 'epi' | 'afastamento' | 'emprestimo';
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
  // ID do registro para ações rápidas
  entidadeId?: string;
}

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
    emprestimo: { label: 'Empréstimo', icon: Building2, color: 'text-primary' },
  };
  return config[tipo];
};

interface AlertaItemProps {
  alerta: Alerta;
  onMarcarLido?: (id: string) => void;
  onResolver?: (id: string) => void;
  onAcaoRapida?: (alerta: Alerta, acao: string) => void;
  onDelegar?: (alerta: Alerta) => void;
  resolvendo?: string | null;
  compact?: boolean;
  isAdmin?: boolean;
}

export function AlertaItem({ alerta, onMarcarLido, onResolver, onAcaoRapida, onDelegar, resolvendo, compact = false, isAdmin = false }: AlertaItemProps) {
  const navigate = useNavigate();
  const nivelConfig = getNivelConfig(alerta.nivel);
  const tipoConfig = getTipoConfig(alerta.tipo);
  const TipoIcon = tipoConfig.icon;
  const isResolvendo = resolvendo === alerta.id;

  // Ações rápidas baseadas no tipo de alerta
  const getAcoesRapidas = () => {
    if (alerta.tipo === 'emprestimo') {
      if (alerta.titulo.includes('Quitar') || alerta.titulo.includes('Última')) {
        return [{ label: 'Marcar Quitado', acao: 'quitar_emprestimo', variant: 'success' as const }];
      }
      if (alerta.titulo.includes('Verificar')) {
        return [
          { label: 'Pausar', acao: 'pausar_emprestimo', variant: 'warning' as const },
          { label: 'Quitar', acao: 'quitar_emprestimo', variant: 'success' as const }
        ];
      }
    }
    return [];
  };

  const acoesRapidas = getAcoesRapidas();
  
  if (compact) {
    return (
      <div 
        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${nivelConfig.bgColor} ${alerta.lido ? 'opacity-70' : ''} ${alerta.resolvido ? 'opacity-50 line-through' : ''}`}
        onClick={() => alerta.acaoUrl && navigate(alerta.acaoUrl)}
      >
        <div className={`p-1.5 rounded-lg ${alerta.nivel === 'critico' ? 'bg-destructive/20' : 'bg-background/50'}`}>
          <TipoIcon className={`h-4 w-4 ${tipoConfig.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium truncate">{alerta.titulo}</p>
            {!alerta.lido && !alerta.resolvido && <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            {alerta.resolvido && <CheckCircle2 className="h-3 w-3 text-success" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{alerta.descricao}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{alerta.loja}</Badge>
            {alerta.profissional && (
              <span className="text-[10px] text-muted-foreground">{alerta.profissional}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={`text-[10px] ${nivelConfig.className}`}>
            {alerta.diasRestantes <= 0 ? 'Vencido' : `${alerta.diasRestantes}d`}
          </Badge>
          {onResolver && !alerta.resolvido && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onResolver(alerta.id);
              }}
              disabled={isResolvendo}
            >
              {isResolvendo ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <TableRow className={`${alerta.lido ? 'opacity-70' : ''} ${alerta.resolvido ? 'opacity-50 bg-success/5' : ''} hover:bg-muted/50`}>
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
        <div className={alerta.resolvido ? 'line-through' : ''}>
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
        {alerta.resolvido ? (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolvido
          </Badge>
        ) : (
          <Badge variant={alerta.diasRestantes <= 0 ? 'destructive' : 'secondary'}>
            {alerta.diasRestantes <= 0 ? `${Math.abs(alerta.diasRestantes)}d atrás` : `${alerta.diasRestantes}d`}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 flex-wrap">
          {/* Ações rápidas */}
          {acoesRapidas.length > 0 && onAcaoRapida && !alerta.resolvido && (
            acoesRapidas.map((ar, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className={`h-7 text-xs ${
                  ar.variant === 'success' 
                    ? 'border-success/50 text-success hover:bg-success/10' 
                    : ar.variant === 'warning'
                    ? 'border-warning/50 text-warning hover:bg-warning/10'
                    : ''
                }`}
                onClick={() => onAcaoRapida(alerta, ar.acao)}
                disabled={isResolvendo}
              >
                {ar.label}
              </Button>
            ))
          )}
          {/* Botão Delegar - apenas para admins */}
          {isAdmin && onDelegar && !alerta.resolvido && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelegar(alerta)}
              className="h-7 text-xs border-primary/50 text-primary hover:bg-primary/10"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Delegar
            </Button>
          )}
          {alerta.acaoUrl && (
            <Button variant="ghost" size="sm" onClick={() => navigate(alerta.acaoUrl!)}>
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {onMarcarLido && !alerta.lido && !alerta.resolvido && (
            <Button variant="ghost" size="sm" onClick={() => onMarcarLido(alerta.id)}>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          {onResolver && !alerta.resolvido && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onResolver(alerta.id)}
              disabled={isResolvendo}
              className="text-success hover:text-success hover:bg-success/10"
            >
              {isResolvendo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function CentralAlertas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  const [loading, setLoading] = useState(true);
  const [resolvendo, setResolvendo] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [nivelFiltro, setNivelFiltro] = useState<string>('todos');
  const [lojaFiltro, setLojaFiltro] = useState<string>('todas');
  const [mostrarResolvidos, setMostrarResolvidos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [alertasSistema, setAlertasSistema] = useState<any[]>([]);
  const [lojas, setLojas] = useState<string[]>([]);
  const [listaAberta, setListaAberta] = useState(true);
  
  // Modal de delegação
  const [showDelegarModal, setShowDelegarModal] = useState(false);
  const [alertaParaDelegar, setAlertaParaDelegar] = useState<Alerta | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const alertasGerados: Alerta[] = [];
      let id = 1;
      const hoje = new Date();

      // Carregar lojas
      const { data: lojasData } = await supabase.from('lojas').select('nome');
      setLojas((lojasData || []).map((l: any) => l.nome));

      // Carregar alertas do sistema (banco de dados)
      const { data: alertasBD } = await supabase
        .from('alertas_sistema')
        .select(`
          *,
          profissionais:profissional_id (nome, matricula),
          lojas:loja_id (nome)
        `)
        .order('created_at', { ascending: false });

      setAlertasSistema(alertasBD || []);

      // Converter alertas do BD para o formato do componente
      (alertasBD || []).forEach((a: any) => {
        const prioridadeToNivel: Record<string, NivelAlerta> = {
          'critica': 'critico',
          'alta': 'urgente',
          'media': 'atencao',
          'baixa': 'info'
        };
        
        const tipoMapping: Record<string, TipoAlerta> = {
          'cadastro_incompleto': 'documento',
          'aso_pendente': 'aso',
          'aso_vencido': 'aso',
          'ferias_vencendo': 'ferias',
          'afastamento': 'afastamento',
          'epi': 'epi',
          'emprestimo_quitando': 'emprestimo',
          'emprestimo': 'emprestimo'
        };

        alertasGerados.push({
          id: `db-${a.id}`,
          tipo: tipoMapping[a.tipo] || 'documento',
          nivel: prioridadeToNivel[a.prioridade] || 'info',
          titulo: a.titulo,
          descricao: a.mensagem,
          dataVencimento: a.data_vencimento || a.created_at,
          diasRestantes: a.dias_ate_vencimento || 0,
          loja: a.lojas?.nome || 'Sistema',
          profissional: a.profissionais?.nome,
          matricula: a.profissionais?.matricula,
          acaoUrl: a.acao_url,
          lido: a.lido || false,
          resolvido: false, // Alertas do BD são sempre pendentes se existem
        });
      });

      // Carregar exames ASO vencendo
      const { data: exames } = await supabase
        .from('exames_aso')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `);

      (exames || []).forEach((e: any) => {
        if (!e.data_proximo_exame) return;
        const dataVenc = new Date(e.data_proximo_exame);
        const diasRestantes = Math.floor((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes > 60) return;

        let nivel: NivelAlerta = 'info';
        if (diasRestantes <= 0) nivel = 'critico';
        else if (diasRestantes <= 7) nivel = 'urgente';
        else if (diasRestantes <= 30) nivel = 'atencao';

        alertasGerados.push({
          id: `aso-${id++}`,
          tipo: 'aso',
          nivel,
          titulo: diasRestantes <= 0 ? 'ASO Vencido' : 'ASO Vencendo',
          descricao: diasRestantes <= 0 
            ? `Exame ocupacional vencido há ${Math.abs(diasRestantes)} dias`
            : `Exame ocupacional vence em ${diasRestantes} dias`,
          dataVencimento: e.data_proximo_exame,
          diasRestantes,
          loja: e.profissionais?.lojas?.nome || 'N/A',
          profissional: e.profissionais?.nome,
          matricula: e.profissionais?.matricula,
          acaoUrl: '/gestao-aso',
          lido: false,
          resolvido: false,
        });
      });

      // Carregar férias vencendo
      const { data: ferias } = await supabase
        .from('ferias')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `);

      (ferias || []).forEach((f: any) => {
        const dataVenc = new Date(f.periodo_aquisitivo_fim);
        const diasRestantes = Math.floor((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes > 60 || f.status === 'finalizada') return;

        let nivel: NivelAlerta = 'info';
        if (diasRestantes <= 0) nivel = 'critico';
        else if (diasRestantes <= 15) nivel = 'urgente';
        else if (diasRestantes <= 30) nivel = 'atencao';

        alertasGerados.push({
          id: `ferias-${id++}`,
          tipo: 'ferias',
          nivel,
          titulo: diasRestantes <= 0 ? 'Férias Vencidas' : 'Férias a Vencer',
          descricao: diasRestantes <= 0 
            ? `Período aquisitivo venceu há ${Math.abs(diasRestantes)} dias`
            : `Período aquisitivo vence em ${diasRestantes} dias`,
          dataVencimento: f.periodo_aquisitivo_fim,
          diasRestantes,
          loja: f.profissionais?.lojas?.nome || 'N/A',
          profissional: f.profissionais?.nome,
          matricula: f.profissionais?.matricula,
          acaoUrl: '/gestao-ferias',
          lido: false,
          resolvido: false,
        });
      });

      // Carregar afastamentos com perícia
      const { data: afastamentos } = await supabase
        .from('afastamentos')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `)
        .eq('status', 'aguardando_pericia');

      (afastamentos || []).forEach((a: any) => {
        if (!a.data_prevista_retorno) return;
        const dataPericia = new Date(a.data_prevista_retorno);
        const diasRestantes = Math.floor((dataPericia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes > 30) return;

        let nivel: NivelAlerta = 'info';
        if (diasRestantes <= 0) nivel = 'critico';
        else if (diasRestantes <= 7) nivel = 'urgente';
        else if (diasRestantes <= 15) nivel = 'atencao';

        alertasGerados.push({
          id: `afastamento-${id++}`,
          tipo: 'afastamento',
          nivel,
          titulo: diasRestantes <= 0 ? 'Perícia Atrasada' : 'Perícia Agendada',
          descricao: diasRestantes <= 0 
            ? `Perícia estava agendada há ${Math.abs(diasRestantes)} dias`
            : `Perícia agendada em ${diasRestantes} dias`,
          dataVencimento: a.data_prevista_retorno,
          diasRestantes,
          loja: a.profissionais?.lojas?.nome || 'N/A',
          profissional: a.profissionais?.nome,
          matricula: a.profissionais?.matricula,
          acaoUrl: '/gestao-afastamentos',
          lido: false,
          resolvido: false,
        });
      });

      // Alertas para profissionais com status de afastamento mas SEM registro formal na tabela afastamentos
      const { data: profAfastados } = await supabase
        .from('profissionais')
        .select(`
          id,
          matricula,
          nome,
          status,
          lojas:lojas!profissionais_loja_id_fkey (nome)
        `)
        .in('status', ['afastado_acidente', 'licenca_maternidade', 'afastado_doenca', 'afastado']);

      if (profAfastados && profAfastados.length > 0) {
        // Verificar quais já têm registro na tabela afastamentos
        const profIds = profAfastados.map((p: any) => p.id);
        const { data: afastamentosExistentes } = await supabase
          .from('afastamentos')
          .select('profissional_id')
          .in('profissional_id', profIds);

        const idsComRegistro = new Set((afastamentosExistentes || []).map((a: any) => a.profissional_id));

        profAfastados.forEach((p: any) => {
          if (idsComRegistro.has(p.id)) return; // já tem registro formal

          const tipoLabel = p.status === 'licenca_maternidade' ? 'Licença Maternidade'
            : p.status === 'afastado_acidente' ? 'Afastado por Acidente'
            : p.status === 'afastado_doenca' ? 'Afastado por Doença'
            : 'Afastado';

          alertasGerados.push({
            id: `afastamento-sem-registro-${id++}`,
            tipo: 'afastamento',
            nivel: 'urgente',
            titulo: 'Afastamento sem Registro',
            descricao: `${p.nome} está como "${tipoLabel}" mas não tem registro formal de afastamento (datas, documentos). Cadastre na Gestão de Afastamentos.`,
            dataVencimento: new Date().toISOString(),
            diasRestantes: 0,
            loja: p.lojas?.nome || 'N/A',
            profissional: p.nome,
            matricula: p.matricula,
            acaoUrl: '/gestao-afastamentos',
            lido: false,
            resolvido: false,
          });
        });
      }

      // Carregar empréstimos próximos de quitação ou com situações especiais
      const { data: emprestimos } = await supabase
        .from('emprestimos')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `)
        .eq('status', 'ativo')
        .eq('tipo', 'empresa');

      (emprestimos || []).forEach((e: any) => {
        if (!e.numero_parcelas || !e.parcelas_pagas) return;
        
        const parcelasRestantes = (e.numero_parcelas || 0) - (e.parcelas_pagas || 0);
        
        // Alerta para empréstimos próximos de quitação (últimas 3 parcelas)
        if (parcelasRestantes > 0 && parcelasRestantes <= 3) {
          let nivel: NivelAlerta = 'info';
          if (parcelasRestantes === 1) nivel = 'urgente';
          else if (parcelasRestantes === 2) nivel = 'atencao';

          alertasGerados.push({
            id: `emprestimo-quitando-${id++}`,
            tipo: 'emprestimo',
            nivel,
            titulo: parcelasRestantes === 1 ? 'Última Parcela!' : 'Empréstimo Quitando',
            descricao: `${parcelasRestantes} ${parcelasRestantes === 1 ? 'parcela restante' : 'parcelas restantes'} - ${e.profissionais?.nome}`,
            dataVencimento: e.data_previsao_termino || '',
            diasRestantes: parcelasRestantes,
            loja: e.profissionais?.lojas?.nome || 'N/A',
            profissional: e.profissionais?.nome,
            matricula: e.profissionais?.matricula,
            acaoUrl: '/gestao-emprestimos',
            lido: false,
            resolvido: false,
            entidadeId: e.id,
          });
        }

        // Alerta para empréstimos que deveriam ter sido quitados (parcelas pagas > total)
        if (e.parcelas_pagas >= e.numero_parcelas && e.status === 'ativo') {
          alertasGerados.push({
            id: `emprestimo-quitado-${id++}`,
            tipo: 'emprestimo',
            nivel: 'urgente',
            titulo: 'Empréstimo a Quitar',
            descricao: `Todas as parcelas pagas, marcar como quitado - ${e.profissionais?.nome}`,
            dataVencimento: '',
            diasRestantes: 0,
            loja: e.profissionais?.lojas?.nome || 'N/A',
            profissional: e.profissionais?.nome,
            matricula: e.profissionais?.matricula,
            acaoUrl: '/gestao-emprestimos',
            lido: false,
            resolvido: false,
            entidadeId: e.id,
          });
        }
      });

      // Alertas para empréstimos CLT ativos há muito tempo (mais de 12 meses)
      const { data: emprestimosCLT } = await supabase
        .from('emprestimos')
        .select(`
          *,
          profissionais:profissional_id (
            matricula,
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `)
        .eq('status', 'ativo')
        .eq('tipo', 'clt');

      (emprestimosCLT || []).forEach((e: any) => {
        if (!e.data_inicio) return;
        
        const dataInicio = new Date(e.data_inicio);
        const mesesAtivo = Math.floor((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        // Alerta para CLT com mais de 24 meses (verificar se ainda está ativo)
        if (mesesAtivo >= 24) {
          alertasGerados.push({
            id: `emprestimo-clt-longo-${id++}`,
            tipo: 'emprestimo',
            nivel: 'atencao',
            titulo: 'Verificar Empréstimo CLT',
            descricao: `Consignado ativo há ${mesesAtivo} meses - verificar continuidade`,
            dataVencimento: '',
            diasRestantes: 0,
            loja: e.profissionais?.lojas?.nome || 'N/A',
            profissional: e.profissionais?.nome,
            matricula: e.profissionais?.matricula,
            acaoUrl: '/gestao-emprestimos',
            lido: false,
            resolvido: false,
            entidadeId: e.id,
          });
        }
      });

      setAlertas(alertasGerados.sort((a, b) => {
        // Prioridade: críticos primeiro, depois por dias restantes
        const nivelOrder = { critico: 0, urgente: 1, atencao: 2, info: 3 };
        if (nivelOrder[a.nivel] !== nivelOrder[b.nivel]) {
          return nivelOrder[a.nivel] - nivelOrder[b.nivel];
        }
        return a.diasRestantes - b.diasRestantes;
      }));
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolver = async (alertaId: string) => {
    setResolvendo(alertaId);
    try {
      // Se é um alerta do banco de dados (começa com "db-")
      if (alertaId.startsWith('db-')) {
        const dbId = alertaId.replace('db-', '');
        await supabase.from('alertas_sistema').delete().eq('id', dbId);
        // Recarregar dados
        await loadData();
      } else {
        // Para alertas gerados dinamicamente, apenas marcar como resolvido no estado local
        setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, resolvido: true } : a));
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    } finally {
      setResolvendo(null);
    }
  };

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
    emprestimo: alertas.filter(a => a.tipo === 'emprestimo' && !a.resolvido).length,
  }), [alertas]);

  const handleMarcarLido = (id: string) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, lido: true } : a));
  };

  const handleAcaoRapida = async (alerta: Alerta, acao: string) => {
    if (!alerta.entidadeId) {
      toast.error('ID do empréstimo não encontrado');
      return;
    }
    
    setResolvendo(alerta.id);
    try {
      let novoStatus = 'ativo';
      if (acao === 'quitar_emprestimo') novoStatus = 'quitado';
      else if (acao === 'pausar_emprestimo') novoStatus = 'pausado';

      const { error } = await supabase
        .from('emprestimos')
        .update({ status: novoStatus })
        .eq('id', alerta.entidadeId);

      if (error) throw error;

      toast.success(`Empréstimo ${novoStatus === 'quitado' ? 'quitado' : 'pausado'} com sucesso!`);
      setAlertas(prev => prev.map(a => a.id === alerta.id ? { ...a, resolvido: true } : a));
    } catch (error) {
      console.error('Erro na ação rápida:', error);
      toast.error('Erro ao executar ação');
    } finally {
      setResolvendo(null);
    }
  };

  // Handler para delegar alerta
  const handleDelegar = (alerta: Alerta) => {
    setAlertaParaDelegar(alerta);
    setShowDelegarModal(true);
  };

  // Handler para criar ocorrência a partir do alerta
  const handleDelegarSubmit = async (data: DelegarAlertaData) => {
    try {
      // Criar pendência/ocorrência no banco
      const { error } = await supabase
        .from('pendencias')
        .insert({
          tipo: data.alerta.tipo,
          titulo: `[Alerta] ${data.alerta.titulo}`,
          descricao: `${data.alerta.descricao}\n\nLoja: ${data.alerta.loja}\nProfissional: ${data.alerta.profissional || 'N/A'}\n\n${data.observacoes}`,
          prioridade: data.prioridade,
          status: 'pendente',
          executor_id: data.executor_id,
          criado_por: user?.id,
          data_prazo: data.data_prazo,
          profissional_id: null, // Pode ser melhorado para buscar o ID do profissional
          historico: [{
            acao: 'delegado_do_alerta',
            usuario: user?.name || user?.email,
            data: new Date().toISOString(),
            alerta_original: data.alerta.titulo,
          }],
        });

      if (error) throw error;

      toast.success('Alerta delegado como ocorrência!');
      
      // Marcar alerta como resolvido localmente
      setAlertas(prev => prev.map(a => 
        a.id === data.alerta.id ? { ...a, resolvido: true } : a
      ));

      // Se for alerta do BD, remover
      if (data.alerta.id.startsWith('db-')) {
        const dbId = data.alerta.id.replace('db-', '');
        await supabase.from('alertas_sistema').delete().eq('id', dbId);
      }

    } catch (error) {
      console.error('Erro ao delegar alerta:', error);
      toast.error('Erro ao delegar alerta');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-primary" />
            Central de Alertas
          </h1>
          <p className="text-muted-foreground">
            Monitore vencimentos, pendências e ações necessárias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de contadores - clicáveis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className={`bg-destructive/5 border-destructive/20 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${nivelFiltro === 'critico' ? 'ring-2 ring-destructive' : ''}`}
          onClick={() => {
            setNivelFiltro(nivelFiltro === 'critico' ? 'todos' : 'critico');
            setListaAberta(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{contadores.critico}</p>
                <p className="text-sm text-muted-foreground">Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`bg-warning/5 border-warning/20 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${nivelFiltro === 'urgente' ? 'ring-2 ring-warning' : ''}`}
          onClick={() => {
            setNivelFiltro(nivelFiltro === 'urgente' ? 'todos' : 'urgente');
            setListaAberta(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{contadores.urgente}</p>
                <p className="text-sm text-muted-foreground">Urgentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`bg-info/5 border-info/20 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${nivelFiltro === 'atencao' ? 'ring-2 ring-info' : ''}`}
          onClick={() => {
            setNivelFiltro(nivelFiltro === 'atencao' ? 'todos' : 'atencao');
            setListaAberta(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Info className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold text-info">{contadores.atencao}</p>
                <p className="text-sm text-muted-foreground">Atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`bg-primary/5 border-primary/20 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${nivelFiltro === 'todos' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => {
            setNivelFiltro('todos');
            setListaAberta(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{contadores.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Nome, título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aso">ASO</SelectItem>
                  <SelectItem value="ferias">Férias</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="afastamento">Afastamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nível</Label>
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
            <div className="space-y-2">
              <Label>Loja</Label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {lojas.map((loja) => (
                    <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={mostrarResolvidos}
                  onCheckedChange={setMostrarResolvidos}
                />
                <Label>Mostrar resolvidos</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de alertas - colapsável */}
      <Collapsible open={listaAberta} onOpenChange={setListaAberta}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Alertas ({alertasFiltrados.length})
                  {nivelFiltro !== 'todos' && (
                    <Badge variant="secondary" className="ml-2">
                      Filtro: {nivelFiltro}
                    </Badge>
                  )}
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {listaAberta ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Loja</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-center">Prazo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertasFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum alerta encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      alertasFiltrados.map((alerta) => (
                        <AlertaItem 
                          key={alerta.id} 
                          alerta={alerta} 
                          onMarcarLido={handleMarcarLido}
                          onResolver={handleResolver}
                          onAcaoRapida={handleAcaoRapida}
                          onDelegar={handleDelegar}
                          resolvendo={resolvendo}
                          isAdmin={isAdmin}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Modal de Delegação */}
      <DelegarAlertaModal
        open={showDelegarModal}
        onOpenChange={setShowDelegarModal}
        alerta={alertaParaDelegar}
        onDelegar={handleDelegarSubmit}
      />
    </div>
  );
}

// Componente de resumo para o Dashboard - Formato de barra colapsável
export function AlertasResumo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadAlertas();
  }, []);

  const loadAlertas = async () => {
    try {
      const alertasGerados: Alerta[] = [];
      let id = 1;
      const hoje = new Date();

      // Carregar exames ASO vencendo
      const { data: exames } = await supabase
        .from('exames_aso')
        .select(`
          data_proximo_exame,
          profissionais:profissional_id (
            nome,
            lojas:lojas!profissionais_loja_id_fkey (nome)
          )
        `);

      (exames || []).forEach((e: any) => {
        if (!e.data_proximo_exame) return;
        const dataVenc = new Date(e.data_proximo_exame);
        const diasRestantes = Math.floor((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes > 30) return;

        let nivel: NivelAlerta = 'info';
        if (diasRestantes <= 0) nivel = 'critico';
        else if (diasRestantes <= 7) nivel = 'urgente';
        else if (diasRestantes <= 30) nivel = 'atencao';

        alertasGerados.push({
          id: `aso-${id++}`,
          tipo: 'aso',
          nivel,
          titulo: diasRestantes <= 0 ? 'ASO Vencido' : 'ASO Vencendo',
          descricao: `${e.profissionais?.nome || 'Profissional'}`,
          dataVencimento: e.data_proximo_exame,
          diasRestantes,
          loja: e.profissionais?.lojas?.nome || 'N/A',
          profissional: e.profissionais?.nome,
          acaoUrl: '/gestao-aso',
          lido: false,
          resolvido: false,
        });
      });

      setAlertas(alertasGerados.sort((a, b) => a.diasRestantes - b.diasRestantes).slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const alertasCriticos = alertas.filter(a => a.nivel === 'critico').length;
  const alertasUrgentes = alertas.filter(a => a.nivel === 'urgente').length;
  const totalAlertas = alertasCriticos + alertasUrgentes;

  if (loading) {
    return null;
  }

  if (alertas.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`overflow-hidden transition-all duration-300 ${
        alertasCriticos > 0 
          ? 'border-destructive/30 bg-destructive/5' 
          : 'border-warning/30 bg-warning/5'
      }`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${
                  alertasCriticos > 0 ? 'bg-destructive/10' : 'bg-warning/10'
                }`}>
                  <Bell className={`h-4 w-4 ${
                    alertasCriticos > 0 ? 'text-destructive' : 'text-warning'
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  alertasCriticos > 0 ? 'text-destructive' : 'text-warning'
                }`}>
                  {totalAlertas} alerta(s) crítico(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/alertas');
                  }}
                >
                  Ver todos
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <CardContent className="pt-0 pb-4 px-4">
                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-2 pr-2">
                    {alertas.map((alerta, index) => (
                      <motion.div
                        key={alerta.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <AlertaItem alerta={alerta} compact />
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </Collapsible>
  );
}

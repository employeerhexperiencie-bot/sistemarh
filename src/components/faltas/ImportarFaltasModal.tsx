import { useState, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle,
  Loader2, X, CalendarDays, Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportarFaltasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

interface FaltaPreview {
  linha: number;
  matricula: string;
  nome: string;
  dataFalta: string;
  tipo: 'injustificada' | 'justificada' | 'atestado';
  motivo: string;
  profissionalId?: string;
  erro?: string;
  status: 'pendente' | 'ok' | 'erro' | 'duplicada';
}

type Etapa = 'upload' | 'preview' | 'importando' | 'resultado';

export function ImportarFaltasModal({ open, onOpenChange, onImportComplete }: ImportarFaltasModalProps) {
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [previews, setPreviews] = useState<FaltaPreview[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState({ sucesso: 0, erros: 0, duplicadas: 0 });
  const [competencia, setCompetencia] = useState('');

  const resetState = useCallback(() => {
    setEtapa('upload');
    setPreviews([]);
    setProgresso(0);
    setResultado({ sucesso: 0, erros: 0, duplicadas: 0 });
    setCompetencia('');
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'MATRICULA': 'SD18/0522',
        'NOME': 'JODEILSON SILVA DIAS',
        'DATA_FALTA': '2026-03-05',
        'TIPO': 'injustificada',
        'MOTIVO': '',
      },
      {
        'MATRICULA': 'IT02-30',
        'NOME': 'ALEXANDRE ALVES DA SILVA',
        'DATA_FALTA': '2026-03-05',
        'TIPO': 'atestado',
        'MOTIVO': 'Atestado médico 1 dia',
      },
      {
        'MATRICULA': 'LP06/0840',
        'NOME': 'DAMIAO SILVA',
        'DATA_FALTA': '2026-03-10',
        'TIPO': 'justificada',
        'MOTIVO': 'Consulta médica',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Ajustar largura das colunas
    ws['!cols'] = [
      { wch: 15 }, // MATRICULA
      { wch: 40 }, // NOME
      { wch: 12 }, // DATA_FALTA
      { wch: 15 }, // TIPO
      { wch: 30 }, // MOTIVO
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faltas');

    // Aba de instruções
    const instrucoes = [
      { 'Instruções': 'COMO PREENCHER A PLANILHA DE FALTAS' },
      { 'Instruções': '' },
      { 'Instruções': 'Colunas obrigatórias:' },
      { 'Instruções': '  MATRICULA - Matrícula do profissional (ex: SD18/0522)' },
      { 'Instruções': '  DATA_FALTA - Data no formato AAAA-MM-DD ou DD/MM/AAAA' },
      { 'Instruções': '  TIPO - injustificada, justificada ou atestado' },
      { 'Instruções': '' },
      { 'Instruções': 'Colunas opcionais:' },
      { 'Instruções': '  NOME - Nome do profissional (para conferência, não é usado na importação)' },
      { 'Instruções': '  MOTIVO - Descrição ou motivo da falta' },
      { 'Instruções': '' },
      { 'Instruções': 'Tipos aceitos:' },
      { 'Instruções': '  injustificada - Falta sem justificativa (impacta cesta básica e desconto)' },
      { 'Instruções': '  justificada - Falta com justificativa aceita pelo RH' },
      { 'Instruções': '  atestado - Falta com atestado médico (NÃO impacta cesta básica)' },
      { 'Instruções': '' },
      { 'Instruções': 'Dicas:' },
      { 'Instruções': '  - Você pode informar várias faltas do mesmo profissional (uma linha por dia)' },
      { 'Instruções': '  - Faltas duplicadas (mesma matrícula + mesma data) serão ignoradas' },
      { 'Instruções': '  - A coluna NOME é apenas para referência visual, o sistema busca pela MATRÍCULA' },
    ];

    const wsInst = XLSX.utils.json_to_sheet(instrucoes);
    wsInst['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInst, 'Instruções');

    XLSX.writeFile(wb, 'template_importacao_faltas.xlsx');
    toast.success('Template baixado com sucesso');
  };

  const normalizarData = (valor: any): string | null => {
    if (!valor) return null;

    // Se for um número (serial date do Excel)
    if (typeof valor === 'number') {
      const date = XLSX.SSF.parse_date_code(valor);
      if (date) {
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
    }

    const str = String(valor).trim();

    // AAAA-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    // DD/MM/AAAA
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
    }

    // MM/DD/AAAA (formato US)
    const usMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch && parseInt(usMatch[1]) <= 12) {
      return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
    }

    return null;
  };

  const normalizarTipo = (valor: any): 'injustificada' | 'justificada' | 'atestado' | null => {
    if (!valor) return null;
    const str = String(valor).trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (str.includes('injustificada') || str === 'inj' || str === 'i' || str === 'falta') return 'injustificada';
    if (str.includes('atestado') || str === 'at' || str === 'a') return 'atestado';
    if (str.includes('justificada') || str === 'just' || str === 'j') return 'justificada';
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Formato inválido. Use Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (jsonData.length === 0) {
        toast.error('Planilha vazia. Verifique o arquivo.');
        return;
      }

      // Detectar colunas (flexível)
      const firstRow = jsonData[0] as Record<string, any>;
      const keys = Object.keys(firstRow);
      
      const colMatricula = keys.find(k => /matr[ií]cula|matricula|matr/i.test(k));
      const colData = keys.find(k => /data.*falta|data|dia/i.test(k));
      const colTipo = keys.find(k => /tipo|classif|categoria/i.test(k));
      const colNome = keys.find(k => /nome|colaborador|profissional|funcion/i.test(k));
      const colMotivo = keys.find(k => /motivo|obs|descri|justif/i.test(k));

      if (!colMatricula) {
        toast.error('Coluna MATRICULA não encontrada. Verifique o template.');
        return;
      }
      if (!colData) {
        toast.error('Coluna DATA_FALTA não encontrada. Verifique o template.');
        return;
      }

      // Buscar todos profissionais para mapear matrícula → id
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select('id, matricula, nome')
        .eq('status', 'ativo');

      const profMap = new Map<string, { id: string; nome: string }>();
      (profissionais || []).forEach(p => {
        // Normalizar matrícula: remover espaços, traços extras
        const mat = p.matricula.trim().toUpperCase().replace(/\s+/g, '');
        profMap.set(mat, { id: p.id, nome: p.nome });
      });

      // Buscar faltas existentes para detectar duplicatas
      const { data: faltasExistentes } = await supabase
        .from('faltas')
        .select('profissional_id, data_falta');
      
      const faltasSet = new Set(
        (faltasExistentes || []).map(f => `${f.profissional_id}_${f.data_falta}`)
      );

      const previewData: FaltaPreview[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i] as Record<string, any>;
        const matricula = String(row[colMatricula!] || '').trim();
        const dataRaw = row[colData!];
        const tipoRaw = colTipo ? row[colTipo] : 'injustificada';
        const nome = colNome ? String(row[colNome] || '') : '';
        const motivo = colMotivo ? String(row[colMotivo] || '') : '';

        if (!matricula && !dataRaw) continue; // Linha vazia

        const dataFalta = normalizarData(dataRaw);
        const tipo = normalizarTipo(tipoRaw);
        
        const matNorm = matricula.toUpperCase().replace(/\s+/g, '');
        const prof = profMap.get(matNorm);

        const preview: FaltaPreview = {
          linha: i + 2,
          matricula,
          nome: prof?.nome || nome,
          dataFalta: dataFalta || String(dataRaw),
          tipo: tipo || 'injustificada',
          motivo,
          profissionalId: prof?.id,
          status: 'pendente',
        };

        if (!matricula) {
          preview.erro = 'Matrícula vazia';
          preview.status = 'erro';
        } else if (!prof) {
          preview.erro = 'Profissional não encontrado';
          preview.status = 'erro';
        } else if (!dataFalta) {
          preview.erro = `Data inválida: "${dataRaw}"`;
          preview.status = 'erro';
        } else if (!tipo) {
          preview.erro = `Tipo inválido: "${tipoRaw}"`;
          preview.status = 'erro';
        } else if (faltasSet.has(`${prof.id}_${dataFalta}`)) {
          preview.erro = 'Falta já registrada nesta data';
          preview.status = 'duplicada';
        } else {
          preview.status = 'ok';
        }

        previewData.push(preview);
      }

      setPreviews(previewData);
      setEtapa('preview');

    } catch (error) {
      console.error('Erro ao ler planilha:', error);
      toast.error('Erro ao processar o arquivo');
    }

    // Limpar input
    e.target.value = '';
  };

  const importar = async () => {
    const validas = previews.filter(p => p.status === 'ok');
    if (validas.length === 0) {
      toast.error('Nenhuma falta válida para importar');
      return;
    }

    setEtapa('importando');
    let sucesso = 0;
    let erros = 0;

    // Inserir em lotes de 50
    const batchSize = 50;
    for (let i = 0; i < validas.length; i += batchSize) {
      const batch = validas.slice(i, i + batchSize);
      
      const records = batch.map(f => ({
        profissional_id: f.profissionalId!,
        data_falta: f.dataFalta,
        tipo: f.tipo,
        motivo: f.motivo || null,
      }));

      const { error } = await supabase.from('faltas').insert(records);
      
      if (error) {
        console.error('Erro ao inserir lote:', error);
        erros += batch.length;
      } else {
        sucesso += batch.length;
      }

      setProgresso(Math.round(((i + batch.length) / validas.length) * 100));
    }

    const duplicadas = previews.filter(p => p.status === 'duplicada').length;
    setResultado({ sucesso, erros, duplicadas });
    setEtapa('resultado');

    if (sucesso > 0) {
      toast.success(`${sucesso} falta(s) importada(s) com sucesso!`);
      onImportComplete?.();
    }
  };

  const totalOk = previews.filter(p => p.status === 'ok').length;
  const totalErro = previews.filter(p => p.status === 'erro').length;
  const totalDup = previews.filter(p => p.status === 'duplicada').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Faltas em Lote
          </DialogTitle>
          <DialogDescription>
            {etapa === 'upload' && 'Faça upload de uma planilha Excel com as faltas dos profissionais'}
            {etapa === 'preview' && 'Confira os dados antes de importar'}
            {etapa === 'importando' && 'Importando faltas...'}
            {etapa === 'resultado' && 'Importação finalizada'}
          </DialogDescription>
        </DialogHeader>

        {/* ETAPA 1: Upload */}
        {etapa === 'upload' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary transition-colors"
                onClick={downloadTemplate}>
                <CardContent className="pt-6 text-center">
                  <Download className="h-10 w-10 mx-auto text-primary mb-3" />
                  <p className="font-semibold">Baixar Template</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Modelo de planilha com instruções
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById('upload-faltas-file')?.click()}>
                <CardContent className="pt-6 text-center">
                  <Upload className="h-10 w-10 mx-auto text-primary mb-3" />
                  <p className="font-semibold">Fazer Upload</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Excel (.xlsx, .xls) ou CSV
                  </p>
                </CardContent>
              </Card>
            </div>

            <input
              id="upload-faltas-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p><strong>Colunas obrigatórias:</strong> MATRICULA, DATA_FALTA, TIPO</p>
                <p><strong>Colunas opcionais:</strong> NOME (conferência), MOTIVO</p>
                <p><strong>Tipos aceitos:</strong> injustificada, justificada, atestado</p>
                <p className="text-xs text-muted-foreground">
                  O sistema detecta colunas automaticamente e aceita datas em DD/MM/AAAA ou AAAA-MM-DD.
                  Duplicatas (mesma matrícula + data) são identificadas e ignoradas.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* ETAPA 2: Preview */}
        {etapa === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-base py-1 px-3">
                <Users className="h-4 w-4 mr-1" />
                {previews.length} linhas
              </Badge>
              <Badge className="bg-success/10 text-success border-success/20 py-1 px-3">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {totalOk} válidas
              </Badge>
              {totalErro > 0 && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 py-1 px-3">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {totalErro} erros
                </Badge>
              )}
              {totalDup > 0 && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 py-1 px-3">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {totalDup} duplicadas
                </Badge>
              )}
            </div>

            <div className="border rounded-md max-h-[45vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previews.map((p, idx) => (
                    <TableRow key={idx} className={
                      p.status === 'erro' ? 'bg-destructive/5' :
                      p.status === 'duplicada' ? 'bg-amber-50 dark:bg-amber-950/20' :
                      ''
                    }>
                      <TableCell className="text-muted-foreground text-xs">{p.linha}</TableCell>
                      <TableCell className="font-mono text-xs">{p.matricula}</TableCell>
                      <TableCell className="text-sm">{p.nome}</TableCell>
                      <TableCell className="text-sm">{
                        p.dataFalta.includes('-') 
                          ? new Date(p.dataFalta + 'T12:00:00').toLocaleDateString('pt-BR')
                          : p.dataFalta
                      }</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {p.tipo === 'atestado' ? 'Atestado' :
                           p.tipo === 'justificada' ? 'Justificada' : 'Injustificada'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                        {p.motivo || '-'}
                      </TableCell>
                      <TableCell>
                        {p.status === 'ok' && (
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">OK</Badge>
                        )}
                        {p.status === 'erro' && (
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                            {p.erro}
                          </Badge>
                        )}
                        {p.status === 'duplicada' && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                            Duplicada
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={resetState}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={importar} disabled={totalOk === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {totalOk} falta(s)
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 3: Importando */}
        {etapa === 'importando' && (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg font-medium">Importando faltas...</p>
              <p className="text-sm text-muted-foreground">Não feche esta janela</p>
            </div>
            <Progress value={progresso} />
            <p className="text-center text-sm text-muted-foreground">{progresso}%</p>
          </div>
        )}

        {/* ETAPA 4: Resultado */}
        {etapa === 'resultado' && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-success mb-4" />
              <p className="text-xl font-bold">Importação Concluída!</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-success/5 border-success/20">
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-success">{resultado.sucesso}</p>
                  <p className="text-xs text-muted-foreground">Importadas</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200">
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{resultado.duplicadas}</p>
                  <p className="text-xs text-muted-foreground">Duplicadas (ignoradas)</p>
                </CardContent>
              </Card>
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-2xl font-bold text-destructive">{resultado.erros}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button onClick={() => handleClose(false)}>
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

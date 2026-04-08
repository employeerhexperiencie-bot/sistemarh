import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Clock, Eye, Loader2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ImportModuleConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  requiredColumns: string[];
  optionalColumns?: string[];
  templateData: Record<string, any>[];
  tableName: string;
  mapRow: (row: any) => Record<string, any>;
  validateRow?: (row: any) => string | null;
  /** Maps alternative column names from uploaded spreadsheets to the expected field names */
  columnAliases?: Record<string, string[]>;
  /** If true, use upsert with onConflict instead of insert */
  upsertConflict?: string;
}

interface ImportHistory {
  id: string;
  modulo: string;
  nome_arquivo: string;
  total_registros: number;
  registros_sucesso: number;
  registros_erro: number;
  erros: string[];
  usuario: string;
  created_at: string;
}

interface ImportModuleCardProps {
  config: ImportModuleConfig;
  history: ImportHistory[];
  onImportComplete: () => void;
}

export function ImportModuleCard({ config, history, onImportComplete }: ImportModuleCardProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(config.templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.title);
    XLSX.writeFile(wb, `template_${config.id}.xlsx`);
    toast({ title: "Template baixado", description: "Preencha o arquivo e faça o upload." });
  };

  /** Normalize column names using aliases */
  const normalizeRow = (row: Record<string, any>): Record<string, any> => {
    if (!config.columnAliases) return row;
    const normalized: Record<string, any> = {};
    const allExpectedCols = [...config.requiredColumns, ...(config.optionalColumns || [])];

    for (const [rawKey, rawVal] of Object.entries(row)) {
      const trimmedKey = String(rawKey).trim();
      let mapped = false;
      for (const [targetCol, aliases] of Object.entries(config.columnAliases)) {
        if (aliases.some(a => a.toLowerCase() === trimmedKey.toLowerCase())) {
          normalized[targetCol] = rawVal;
          mapped = true;
          break;
        }
      }
      if (!mapped) {
        // Try direct match (case-insensitive)
        const directMatch = allExpectedCols.find(c => c.toLowerCase() === trimmedKey.toLowerCase());
        if (directMatch) {
          normalized[directMatch] = rawVal;
        } else {
          normalized[trimmedKey] = rawVal;
        }
      }
    }
    return normalized;
  };

  /** Find the header row in spreadsheet (skips title/empty rows) */
  const findHeaderRow = (worksheet: XLSX.WorkSheet): number => {
    if (!config.columnAliases) return 0; // default: row 1 is header
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const allAliases = Object.values(config.columnAliases).flat().map(a => a.toLowerCase());
    const requiredAliases = config.requiredColumns.flatMap(col => 
      (config.columnAliases?.[col] || [col]).map(a => a.toLowerCase())
    );
    
    for (let r = range.s.r; r <= Math.min(range.s.r + 10, range.e.r); r++) {
      let matchCount = 0;
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
        if (cell && cell.v) {
          const val = String(cell.v).trim().toLowerCase();
          if (allAliases.includes(val) || requiredAliases.includes(val)) matchCount++;
        }
      }
      if (matchCount >= config.requiredColumns.length) return r;
    }
    return 0;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({ title: "Formato inválido", description: "Envie .xlsx, .xls ou .csv", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Auto-detect header row
    const headerRowIdx = findHeaderRow(worksheet);
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIdx }) as any[];
    
    // Normalize column names via aliases
    const normalizedData = jsonData.map(row => normalizeRow(row));

    // Validate
    const errors: string[] = [];
    normalizedData.forEach((row, idx) => {
      for (const col of config.requiredColumns) {
        if (!row[col] && row[col] !== 0) {
          errors.push(`Linha ${idx + 2 + headerRowIdx}: campo "${col}" obrigatório está vazio`);
        }
      }
      if (config.validateRow) {
        const err = config.validateRow(row);
        if (err) errors.push(`Linha ${idx + 2 + headerRowIdx}: ${err}`);
      }
    });

    setPreviewData(normalizedData);
    setPreviewErrors(errors);
    setPreviewOpen(true);
    e.target.value = "";
  };

  const resolveProfissionalIds = async (rows: any[]): Promise<{ resolved: any[]; errors: string[] }> => {
    const matriculas = [...new Set(rows.filter(r => r._matricula).map(r => r._matricula))];
    if (matriculas.length === 0) return { resolved: rows, errors: [] };

    const { data: profs } = await supabase
      .from("profissionais")
      .select("id, matricula")
      .in("matricula", matriculas);

    const map = new Map((profs || []).map(p => [p.matricula, p.id]));
    const resolved: any[] = [];
    const errors: string[] = [];

    rows.forEach((row, idx) => {
      if (row._matricula) {
        const profId = map.get(row._matricula);
        if (!profId) {
          errors.push(`Linha ${idx + 2}: matrícula "${row._matricula}" não encontrada`);
          return;
        }
        const { _matricula, ...rest } = row;
        resolved.push({ ...rest, profissional_id: profId });
      } else {
        resolved.push(row);
      }
    });

    return { resolved, errors };
  };

  /** Resolve _loja_atuacao / _loja_registro names to loja_id / loja_registro_id */
  const resolveLojaIds = async (rows: any[]): Promise<any[]> => {
    const lojaNames = new Set<string>();
    rows.forEach(r => {
      if (r._loja_atuacao) lojaNames.add(r._loja_atuacao.toUpperCase().trim());
      if (r._loja_registro) lojaNames.add(r._loja_registro.toUpperCase().trim());
    });
    if (lojaNames.size === 0) return rows;

    const { data: lojas } = await supabase.from("lojas").select("id, nome");
    const lojaMap = new Map<string, string>();
    (lojas || []).forEach(l => lojaMap.set(l.nome.toUpperCase().trim(), l.id));

    return rows.map(row => {
      const { _loja_atuacao, _loja_registro, ...rest } = row;
      if (_loja_atuacao) {
        const id = lojaMap.get(_loja_atuacao.toUpperCase().trim());
        if (id) rest.loja_id = id;
      }
      if (_loja_registro) {
        const id = lojaMap.get(_loja_registro.toUpperCase().trim());
        if (id) rest.loja_registro_id = id;
      }
      return rest;
    });
  };

  const confirmImport = async () => {
    if (!selectedFile || previewData.length === 0) return;
    setPreviewOpen(false);
    setIsImporting(true);

    let successCount = 0;
    const importErrors: string[] = [];

    try {
      // Map all rows first
      const allMapped = previewData.map((row, idx) => {
        try {
          return config.mapRow(row);
        } catch (err: any) {
          importErrors.push(`Linha ${idx + 2}: ${err.message}`);
          return null;
        }
      }).filter(Boolean) as any[];

      // Resolve _matricula -> profissional_id if needed
      const { resolved, errors: resolveErrors } = await resolveProfissionalIds(allMapped);
      importErrors.push(...resolveErrors);

      // Resolve _loja_atuacao / _loja_registro -> loja_id / loja_registro_id
      const withLojas = await resolveLojaIds(resolved);

      const BATCH_SIZE = 50;
      for (let i = 0; i < resolved.length; i += BATCH_SIZE) {
        const batch = resolved.slice(i, i + BATCH_SIZE);

        if (batch.length > 0) {
          const query = config.upsertConflict
            ? supabase.from(config.tableName as any).upsert(batch as any, { onConflict: config.upsertConflict }).select()
            : supabase.from(config.tableName as any).insert(batch as any).select();
          const { error, data } = await query;

          if (error) {
            importErrors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
          } else {
            successCount += (data as any[])?.length || 0;
          }
        }
      }

      // Save history
      await supabase.from("historico_importacoes" as any).insert({
        modulo: config.id,
        nome_arquivo: selectedFile.name,
        total_registros: previewData.length,
        registros_sucesso: successCount,
        registros_erro: importErrors.length,
        erros: importErrors,
      });

      toast({
        title: importErrors.length === 0 ? "Importação concluída!" : "Importação com avisos",
        description: `${successCount} registros importados. ${importErrors.length} erros.`,
        variant: importErrors.length === 0 ? "default" : "destructive",
      });

      onImportComplete();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
      setPreviewData([]);
      setPreviewErrors([]);
    }
  };

  const lastImport = history[0];
  const allColumns = [...config.requiredColumns, ...(config.optionalColumns || [])];

  return (
    <>
      <Card className="border border-border/60 hover:border-primary/30 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">{config.icon}</div>
              <div>
                <CardTitle className="text-base">{config.title}</CardTitle>
                <CardDescription className="text-xs mt-0.5">{config.description}</CardDescription>
              </div>
            </div>
            {lastImport && (
              <Badge variant="outline" className="text-2xs whitespace-nowrap">
                <Clock className="h-3 w-3 mr-1" />
                {format(new Date(lastImport.created_at), "dd/MM HH:mm")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="flex-1 min-w-[120px]">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Baixar Exemplo
            </Button>
            <Button
              size="sm"
              onClick={() => document.getElementById(`upload-${config.id}`)?.click()}
              disabled={isImporting}
              className="flex-1 min-w-[120px]"
            >
              {isImporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
              {isImporting ? "Importando..." : "Importar"}
            </Button>
            <input id={`upload-${config.id}`} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
          </div>

          {history.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setHistoryOpen(true)}>
              <History className="h-3.5 w-3.5 mr-1.5" />
              Ver histórico ({history.length} importações)
            </Button>
          )}

          <Alert className="py-2">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs">
              <strong>Obrigatórios:</strong> {config.requiredColumns.join(", ")}
              {config.optionalColumns && config.optionalColumns.length > 0 && (
                <><br /><span className="text-muted-foreground">Opcionais: {config.optionalColumns.join(", ")}</span></>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Pré-visualização — {selectedFile?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex gap-3">
              <Badge variant="secondary">{previewData.length} registros</Badge>
              {previewErrors.length > 0 && (
                <Badge variant="destructive">{previewErrors.length} problemas</Badge>
              )}
              {previewErrors.length === 0 && (
                <Badge className="bg-accent/50 text-accent-foreground border-accent">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Dados válidos
                </Badge>
              )}
            </div>

            {previewErrors.length > 0 && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="text-xs space-y-0.5 max-h-24 overflow-y-auto">
                    {previewErrors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    {previewErrors.length > 10 && <li>...e mais {previewErrors.length - 10} erros</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[350px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-12">#</TableHead>
                    {allColumns.slice(0, 8).map(col => (
                      <TableHead key={col} className="text-xs">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 50).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                      {allColumns.slice(0, 8).map(col => (
                        <TableCell key={col} className="text-xs max-w-[150px] truncate">
                          {row[col] ?? <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {previewData.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Mostrando 50 de {previewData.length} registros
                </p>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancelar</Button>
            <Button onClick={confirmImport} disabled={previewData.length === 0}>
              <Upload className="h-4 w-4 mr-2" />
              Confirmar Importação ({previewData.length} registros)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Importações — {config.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {history.map((h) => (
                <Card key={h.id} className="border-border/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{h.nome_arquivo}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{h.total_registros} total</Badge>
                      <Badge className="bg-accent/50 text-accent-foreground border-accent text-xs">
                        {h.registros_sucesso} sucesso
                      </Badge>
                      {h.registros_erro > 0 && (
                        <Badge variant="destructive" className="text-xs">{h.registros_erro} erros</Badge>
                      )}
                    </div>
                    {h.erros && Array.isArray(h.erros) && h.erros.length > 0 && (
                      <div className="bg-destructive/5 rounded p-2 text-xs text-destructive max-h-20 overflow-y-auto">
                        {(h.erros as string[]).slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {history.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma importação realizada ainda.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

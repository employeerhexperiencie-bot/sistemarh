import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, FileImage, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { ImportarFaltasModal } from '@/components/faltas/ImportarFaltasModal';

interface ImportResult {
  success: number;
  errors: string[];
  documentsUploaded?: number;
}

// ----- Helpers: parsing tolerante a cabeçalhos reais de planilhas -----
const norm = (s: any): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

const SYN = {
  matricula: ['matricula', 'n matricula', 'no matricula', 'numero matricula', 'cod', 'codigo'],
  nome: ['nome', 'nome completo', 'colaborador', 'profissional', 'funcionario'],
  cpf: ['cpf'],
  rg: ['rg'],
  pis: ['pis', 'pis pasep', 'nis'],
  cargo: ['cargo', 'funcao'],
  cbo: ['cbo'],
  loja_trabalho: ['local trabalho', 'local de trabalho', 'loja', 'unidade', 'filial'],
  loja_registro: ['local registro', 'local de registro', 'loja registro', 'loja ctps', 'registro ctps'],
  data_admissao: ['admissao ctps', 'data admissao', 'admissao', 'data de admissao'],
  inicio_loja: ['inicio loja', 'inicio na loja', 'data inicio loja'],
  salario: ['salario ctps', 'salario a receber', 'salario receber', 'salario', 'remuneracao'],
  pensao: ['pensao', 'pensao alimenticia'],
  nascimento: ['nascimento', 'data nascimento', 'data de nascimento', 'dt nasc'],
  genero: ['genero', 'sexo'],
  estado_civil: ['estado civil'],
  nome_mae: ['nome mae', 'nome da mae', 'mae'],
  nome_pai: ['nome pai', 'nome do pai', 'pai'],
  endereco: ['endereco', 'logradouro'],
  numero: ['numero', 'n', 'no'],
  bairro: ['bairro'],
  cidade: ['cidade', 'municipio'],
  estado: ['uf', 'estado'],
  cep: ['cep'],
  telefone: ['telefone', 'celular', 'fone', 'contato'],
  gestor: ['gestor', 'lider', 'supervisor'],
  cor_etnia: ['cor etnia', 'cor', 'etnia', 'raca'],
  escala: ['escala', 'escala trabalho', 'escala de trabalho'],
  horario: ['horario'],
  cnh: ['cnh'],
  validade_cnh: ['validade cnh', 'data vl cnh', 'venc cnh'],
  categoria_cnh: ['categoria cnh', 'cat cnh', 'categoria'],
  banco: ['banco'],
  agencia: ['agencia', 'ag'],
  conta: ['conta', 'conta corrente', 'cc'],
  status: ['status', 'situacao'],
  // Lojas
  loja_nome: ['nome', 'loja', 'unidade', 'filial', 'nome loja', 'nome da loja'],
  cnpj: ['cnpj'],
  email: ['email', 'e mail'],
};

function buildHeaderMap(headerRow: any[]): Map<string, number> {
  const map = new Map<string, number>();
  headerRow.forEach((h, idx) => {
    const n = norm(h);
    if (n && !map.has(n)) map.set(n, idx);
  });
  return map;
}

function pick(row: any[], headerMap: Map<string, number>, key: keyof typeof SYN): any {
  const synonyms = SYN[key] || [];
  for (const syn of synonyms) {
    const idx = headerMap.get(syn);
    if (idx !== undefined && row[idx] !== undefined && row[idx] !== null && String(row[idx]).trim() !== '') {
      return row[idx];
    }
    // partial match
    for (const [hkey, hidx] of headerMap.entries()) {
      if (hkey.includes(syn) || syn.includes(hkey)) {
        const v = row[hidx];
        if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      }
    }
  }
  return undefined;
}

function parseExcelDate(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') {
    const d = new Date((value - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  const s = String(value).trim();
  if (!s) return null;
  // dd/mm/yyyy
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = (parseInt(y) > 50 ? '19' : '20') + y;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
}

function parseSalario(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[R$\s.]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function detectHeaderRow(rows: any[][]): number {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const r = rows[i];
    if (!r) continue;
    const joined = r.map(c => norm(c)).join('|');
    if (joined.includes('matricula') || joined.includes('nome') || joined.includes('cpf') || joined.includes('cnpj')) {
      return i;
    }
  }
  return 0;
}

async function readSheetMatrix(file: File): Promise<any[][]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as any[][];
}

export default function ImportacaoDados() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [documentsFiles, setDocumentsFiles] = useState<FileList | null>(null);
  const [importFaltasOpen, setImportFaltasOpen] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = (type: 'lojas' | 'profissionais') => {
    const templates = {
      lojas: [
        { nome: 'Loja Exemplo 1', cnpj: '00.000.000/0001-00', endereco: 'Rua Exemplo, 123', telefone: '(11) 1234-5678', email: 'loja1@exemplo.com', gerente: 'João Silva' },
        { nome: 'Loja Exemplo 2', cnpj: '00.000.000/0001-01', endereco: 'Av Exemplo, 456', telefone: '(11) 8765-4321', email: 'loja2@exemplo.com', gerente: 'Maria Santos' }
      ],
      profissionais: [
        { matricula: 'MAT001', nome: 'Profissional Exemplo 1', cpf: '000.000.000-00', rg: '00.000.000-0', cargo: 'Vendedor', loja_id: '', data_admissao: '2024-01-01', salario: '3000.00', status: 'ativo', documentos: 'MAT001_cpf.pdf,MAT001_rg.pdf' },
        { matricula: 'MAT002', nome: 'Profissional Exemplo 2', cpf: '000.000.000-01', rg: '00.000.000-1', cargo: 'Gerente', loja_id: '', data_admissao: '2024-01-01', salario: '5000.00', status: 'ativo', documentos: 'MAT002_cpf.pdf,MAT002_ctps.pdf' }
      ]
    };

    const ws = XLSX.utils.json_to_sheet(templates[type]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'lojas' ? 'Lojas' : 'Profissionais');
    XLSX.writeFile(wb, `template_${type}.xlsx`);

    toast({
      title: "Template baixado",
      description: `Preencha o arquivo Excel e faça o upload para importar os dados.`,
    });
  };

  const handleImportLojas = async (file: File) => {
    setIsImporting(true);
    setImportResult(null);
    const result: ImportResult = { success: 0, errors: [] };

    try {
      const rows = await readSheetMatrix(file);
      const headerIdx = detectHeaderRow(rows);
      const headerMap = buildHeaderMap(rows[headerIdx] || []);

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(c => c === null || c === undefined || String(c).trim() === '')) continue;

        const nome = String(pick(row, headerMap, 'loja_nome') ?? pick(row, headerMap, 'nome') ?? '').trim();
        if (!nome) continue;

        try {
          // upsert por nome — evita duplicar lojas existentes
          const { data: existente } = await supabase
            .from('lojas')
            .select('id')
            .eq('nome', nome)
            .maybeSingle();

          const payload: any = {
            nome,
            cnpj: pick(row, headerMap, 'cnpj') ? String(pick(row, headerMap, 'cnpj')).trim() : null,
            endereco: pick(row, headerMap, 'endereco') ? String(pick(row, headerMap, 'endereco')).trim() : null,
            telefone: pick(row, headerMap, 'telefone') ? String(pick(row, headerMap, 'telefone')).trim() : null,
            email: pick(row, headerMap, 'email') ? String(pick(row, headerMap, 'email')).trim() : null,
            gestor: pick(row, headerMap, 'gestor') ? String(pick(row, headerMap, 'gestor')).trim() : null,
          };

          if (existente) {
            const { error } = await supabase.from('lojas').update(payload).eq('id', existente.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('lojas').insert(payload);
            if (error) throw error;
          }
          result.success++;
        } catch (error: any) {
          result.errors.push(`Linha ${i + 1} (${nome}): ${error.message}`);
        }
      }

      setImportResult(result);
      toast({
        title: result.errors.length === 0 ? "Importação concluída!" : "Importação concluída com avisos",
        description: `${result.success} lojas processadas. ${result.errors.length} erros.`,
        variant: result.errors.length === 0 ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const uploadDocuments = async (profissionalId: string, matricula: string, documentNames: string[]) => {
    let uploadedCount = 0;
    
    if (!documentsFiles) return uploadedCount;

    for (const docName of documentNames) {
      const trimmedName = docName.trim();
      if (!trimmedName) continue;

      // Find matching file in uploaded files
      const matchingFile = Array.from(documentsFiles).find(f => f.name === trimmedName);
      
      if (matchingFile) {
        try {
          const fileExt = matchingFile.name.split('.').pop();
          const filePath = `${profissionalId}/${Date.now()}_${matchingFile.name}`;
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('documentos-profissionais')
            .upload(filePath, matchingFile);

          if (uploadError) throw uploadError;

          // Save document metadata
          const tipoDoc = trimmedName.toLowerCase().includes('cpf') ? 'cpf' :
                         trimmedName.toLowerCase().includes('rg') ? 'rg' :
                         trimmedName.toLowerCase().includes('ctps') ? 'ctps' :
                         trimmedName.toLowerCase().includes('comprovante') ? 'comprovante_residencia' :
                         trimmedName.toLowerCase().includes('certificado') ? 'certificados' : 'outros';

          await supabase.from('documentos_profissionais' as any).insert({
            profissional_id: profissionalId,
            nome: matchingFile.name,
            tipo: tipoDoc,
            file_path: filePath,
            file_size: matchingFile.size,
            mime_type: matchingFile.type,
          });

          uploadedCount++;
        } catch (error) {
          console.error(`Erro ao fazer upload do documento ${trimmedName}:`, error);
        }
      }
    }

    return uploadedCount;
  };

  const handleImportProfissionais = async (file: File) => {
    setIsImporting(true);
    setImportResult(null);
    const result: ImportResult = { success: 0, errors: [], documentsUploaded: 0 };

    try {
      const rows = await readSheetMatrix(file);
      const headerIdx = detectHeaderRow(rows);
      const headerMap = buildHeaderMap(rows[headerIdx] || []);

      if (!headerMap.has('matricula') && !headerMap.has('nome') && !headerMap.has('cpf')) {
        throw new Error('Cabeçalho não reconhecido. A planilha precisa conter ao menos colunas MATRICULA, NOME ou CPF.');
      }

      // Cache de lojas (resolve loja por nome → id; cria se não existir)
      const { data: lojasExistentes } = await supabase.from('lojas').select('id, nome');
      const lojasCache = new Map<string, string>();
      (lojasExistentes || []).forEach(l => lojasCache.set(norm(l.nome), l.id));

      const resolveLojaId = async (nomeLoja: any): Promise<string | null> => {
        if (!nomeLoja) return null;
        const key = norm(nomeLoja);
        if (!key) return null;
        if (lojasCache.has(key)) return lojasCache.get(key)!;
        const { data: nova, error } = await supabase
          .from('lojas')
          .insert({ nome: String(nomeLoja).trim() })
          .select('id')
          .single();
        if (error || !nova) return null;
        lojasCache.set(key, nova.id);
        return nova.id;
      };

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.every(c => c === null || c === undefined || String(c).trim() === '')) continue;

        const nome = String(pick(row, headerMap, 'nome') ?? '').trim();
        const matriculaRaw = pick(row, headerMap, 'matricula');
        const matricula = matriculaRaw !== undefined && matriculaRaw !== null
          ? String(matriculaRaw).trim()
          : '';
        const cpf = pick(row, headerMap, 'cpf') ? String(pick(row, headerMap, 'cpf')).replace(/[^\d]/g, '') : null;

        if (!nome) continue;
        if (!matricula && !cpf) {
          result.errors.push(`Linha ${i + 1}: ${nome} sem matrícula nem CPF — ignorado`);
          continue;
        }

        try {
          const lojaTrabId = await resolveLojaId(pick(row, headerMap, 'loja_trabalho'));
          const lojaRegId = await resolveLojaId(pick(row, headerMap, 'loja_registro'));

          const salarioCTPS = parseSalario(pick(row, headerMap, 'salario'));

          const payload: any = {
            matricula: matricula || `SEM-MAT-${cpf || i}`,
            nome,
            cpf: cpf || null,
            rg: pick(row, headerMap, 'rg') ? String(pick(row, headerMap, 'rg')).trim() : null,
            pis: pick(row, headerMap, 'pis') ? String(pick(row, headerMap, 'pis')).trim() : null,
            cargo: pick(row, headerMap, 'cargo') ? String(pick(row, headerMap, 'cargo')).trim() : null,
            cbo: pick(row, headerMap, 'cbo') ? String(pick(row, headerMap, 'cbo')).trim() : null,
            loja_id: lojaTrabId,
            loja_registro_id: lojaRegId,
            data_admissao: parseExcelDate(pick(row, headerMap, 'data_admissao')),
            data_inicio_loja: parseExcelDate(pick(row, headerMap, 'inicio_loja')),
            data_nascimento: parseExcelDate(pick(row, headerMap, 'nascimento')),
            sexo: pick(row, headerMap, 'genero') ? String(pick(row, headerMap, 'genero')).trim() : null,
            estado_civil: pick(row, headerMap, 'estado_civil') ? String(pick(row, headerMap, 'estado_civil')).trim() : null,
            nome_mae: pick(row, headerMap, 'nome_mae') ? String(pick(row, headerMap, 'nome_mae')).trim() : null,
            nome_pai: pick(row, headerMap, 'nome_pai') ? String(pick(row, headerMap, 'nome_pai')).trim() : null,
            endereco: pick(row, headerMap, 'endereco') ? String(pick(row, headerMap, 'endereco')).trim() : null,
            bairro: pick(row, headerMap, 'bairro') ? String(pick(row, headerMap, 'bairro')).trim() : null,
            cidade: pick(row, headerMap, 'cidade') ? String(pick(row, headerMap, 'cidade')).trim() : null,
            estado: pick(row, headerMap, 'estado') ? String(pick(row, headerMap, 'estado')).trim() : null,
            cep: pick(row, headerMap, 'cep') ? String(pick(row, headerMap, 'cep')).trim() : null,
            telefone: pick(row, headerMap, 'telefone') ? String(pick(row, headerMap, 'telefone')).trim() : null,
            cor_etnia: pick(row, headerMap, 'cor_etnia') ? String(pick(row, headerMap, 'cor_etnia')).trim() : null,
            escala_trabalho: pick(row, headerMap, 'escala') ? String(pick(row, headerMap, 'escala')).trim() : null,
            gestor: pick(row, headerMap, 'gestor') ? String(pick(row, headerMap, 'gestor')).trim() : null,
            cnh: pick(row, headerMap, 'cnh') ? String(pick(row, headerMap, 'cnh')).trim() : null,
            categoria_cnh: pick(row, headerMap, 'categoria_cnh') ? String(pick(row, headerMap, 'categoria_cnh')).trim() : null,
            validade_cnh: parseExcelDate(pick(row, headerMap, 'validade_cnh')),
            banco: pick(row, headerMap, 'banco') ? String(pick(row, headerMap, 'banco')).trim() : null,
            agencia: pick(row, headerMap, 'agencia') ? String(pick(row, headerMap, 'agencia')).trim() : null,
            conta: pick(row, headerMap, 'conta') ? String(pick(row, headerMap, 'conta')).trim() : null,
            salario_nominal: salarioCTPS,
            ultimo_salario: salarioCTPS,
            pensao_alimenticia: parseSalario(pick(row, headerMap, 'pensao')),
            status: (pick(row, headerMap, 'status') ? String(pick(row, headerMap, 'status')).toLowerCase().trim() : null) || 'ativo',
          };

          // Remove campos null para não sobrescrever dados existentes ao fazer upsert
          Object.keys(payload).forEach(k => {
            if (payload[k] === null || payload[k] === undefined) delete payload[k];
          });
          // Garantir campos obrigatórios
          payload.matricula = payload.matricula || matricula;
          payload.nome = nome;

          // Upsert por matricula (chave única) - atualiza se existir
          const { data: profissional, error } = await supabase
            .from('profissionais')
            .upsert(payload, { onConflict: 'matricula' })
            .select('id, matricula')
            .single();

          if (error) throw error;
          result.success++;

          // Upload documentos opcionais (mantido)
          const docs = pick(row, headerMap, 'matricula') && (row as any).documentos;
          if (docs && profissional) {
            const documentNames = String(docs).split(',');
            const uploaded = await uploadDocuments(profissional.id, profissional.matricula, documentNames);
            result.documentsUploaded = (result.documentsUploaded || 0) + uploaded;
          }
        } catch (error: any) {
          result.errors.push(`Linha ${i + 1} (${nome}): ${error.message}`);
        }
      }

      setImportResult(result);
      toast({
        title: result.errors.length === 0 ? "Importação concluída!" : "Importação concluída com avisos",
        description: `${result.success} profissionais processados. ${result.errors.length} avisos.`,
        variant: result.errors.length === 0 ? "default" : (result.success > 0 ? "default" : "destructive"),
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setDocumentsFiles(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'lojas' | 'profissionais') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envie um arquivo Excel (.xlsx, .xls) ou CSV.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'lojas') {
      handleImportLojas(file);
    } else {
      handleImportProfissionais(file);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Importação de Dados</h1>
        <p className="text-muted-foreground mt-2">
          Importe lojas e profissionais em massa usando planilhas Excel
        </p>
      </div>

      <Tabs defaultValue="lojas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lojas">Lojas</TabsTrigger>
          <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
          <TabsTrigger value="faltas" className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            Faltas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lojas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Lojas</CardTitle>
              <CardDescription>
                Faça o upload de uma planilha Excel com os dados das lojas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('lojas')}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Template
                </Button>
                <Button
                  variant="default"
                  onClick={() => document.getElementById('upload-lojas')?.click()}
                  disabled={isImporting}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importando...' : 'Fazer Upload'}
                </Button>
                <input
                  id="upload-lojas"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'lojas')}
                />
              </div>

              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  <strong>Campos obrigatórios:</strong> nome, cnpj, endereco, telefone, email, gerente
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profissionais" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Profissionais</CardTitle>
              <CardDescription>
                Faça o upload de uma planilha Excel com os dados dos profissionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={() => downloadTemplate('profissionais')}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Template
                </Button>
                <Button
                  variant="default"
                  onClick={() => document.getElementById('upload-profissionais')?.click()}
                  disabled={isImporting}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importando...' : 'Fazer Upload'}
                </Button>
                <input
                  id="upload-profissionais"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'profissionais')}
                />
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Faça upload dos documentos dos profissionais (opcional)
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Os nomes dos arquivos devem corresponder aos especificados na coluna "documentos" da planilha
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('upload-documentos')?.click()}
                    type="button"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Documentos
                  </Button>
                  <input
                    id="upload-documentos"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setDocumentsFiles(e.target.files)}
                  />
                  {documentsFiles && (
                    <p className="text-sm text-green-600 mt-2">
                      {documentsFiles.length} arquivo(s) selecionado(s)
                    </p>
                  )}
                </div>

                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Campos obrigatórios:</strong> matricula, nome, cpf, rg, cargo, data_admissao, status
                    <br />
                    <strong>Campos opcionais:</strong> loja_id, salario, documentos
                    <br />
                    <strong>Coluna documentos:</strong> Liste os nomes dos arquivos separados por vírgula (ex: MAT001_cpf.pdf,MAT001_rg.pdf)
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faltas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Faltas em Lote</CardTitle>
              <CardDescription>
                Faça upload de uma planilha com as faltas dos profissionais — ideal para quem não usa ponto eletrônico integrado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="default"
                  onClick={() => setImportFaltasOpen(true)}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Abrir Importador de Faltas
                </Button>
              </div>

              <Alert>
                <CalendarDays className="h-4 w-4" />
                <AlertDescription>
                  <p><strong>Como funciona:</strong></p>
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                    <li>Baixe o template Excel com as colunas MATRICULA, DATA_FALTA e TIPO</li>
                    <li>Preencha com as faltas do mês (uma linha por falta/dia)</li>
                    <li>O sistema valida matrículas, detecta duplicatas e mostra preview antes de importar</li>
                    <li>Tipos aceitos: <strong>injustificada</strong>, <strong>justificada</strong> e <strong>atestado</strong></li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportarFaltasModal
        open={importFaltasOpen}
        onOpenChange={setImportFaltasOpen}
      />

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.errors.length === 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Importação Concluída com Sucesso
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Importação Concluída com Avisos
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{importResult.success}</strong> registros importados com sucesso
              </p>
              {importResult.documentsUploaded !== undefined && importResult.documentsUploaded > 0 && (
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{importResult.documentsUploaded}</strong> documentos enviados
                </p>
              )}
              {importResult.errors.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  <strong className="text-destructive">{importResult.errors.length}</strong> erros encontrados
                </p>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Erros:</h4>
                <div className="bg-destructive/10 rounded-md p-4 space-y-1 max-h-60 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

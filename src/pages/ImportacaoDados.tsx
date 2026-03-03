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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      for (const row of jsonData as any[]) {
        try {
          const { error } = await supabase.from('lojas').insert({
            nome: row.nome,
            cnpj: row.cnpj,
            endereco: row.endereco,
            telefone: row.telefone,
            email: row.email,
            gerente: row.gerente,
          });

          if (error) throw error;
          result.success++;
        } catch (error: any) {
          result.errors.push(`Linha ${result.success + result.errors.length + 1}: ${error.message}`);
        }
      }

      setImportResult(result);
      toast({
        title: result.errors.length === 0 ? "Importação concluída!" : "Importação concluída com erros",
        description: `${result.success} lojas importadas. ${result.errors.length} erros.`,
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
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      for (const row of jsonData as any[]) {
        try {
          const { data: profissional, error } = await supabase.from('profissionais').insert({
            matricula: row.matricula,
            nome: row.nome,
            cpf: row.cpf,
            rg: row.rg,
            cargo: row.cargo,
            loja_id: row.loja_id || null,
            data_admissao: row.data_admissao,
            salario: row.salario ? parseFloat(row.salario) : null,
            status: row.status || 'ativo',
          }).select().single();

          if (error) throw error;
          result.success++;

          // Upload documents if specified
          if (row.documentos && profissional) {
            const documentNames = row.documentos.split(',');
            const uploaded = await uploadDocuments(profissional.id, row.matricula, documentNames);
            result.documentsUploaded = (result.documentsUploaded || 0) + uploaded;
          }
        } catch (error: any) {
          result.errors.push(`Linha ${result.success + result.errors.length + 1}: ${error.message}`);
        }
      }

      setImportResult(result);
      toast({
        title: result.errors.length === 0 ? "Importação concluída!" : "Importação concluída com erros",
        description: `${result.success} profissionais e ${result.documentsUploaded} documentos importados. ${result.errors.length} erros.`,
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

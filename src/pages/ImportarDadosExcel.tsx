import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileSpreadsheet, 
  Users, 
  Building2, 
  Stethoscope, 
  Gift,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessedData {
  profissionais: any[];
  lojas: string[];
  examesASO: any[];
  beneficios: any[];
}

interface ImportResult {
  lojas: { inserted: number; errors: string[] };
  profissionais: { inserted: number; errors: string[]; warnings: string[] };
  examesASO: { inserted: number; errors: string[] };
  beneficios: { inserted: number; errors: string[] };
}

const ImportarDadosExcel = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const parseSalario = (valor: any): number | null => {
    if (!valor) return null;
    if (typeof valor === 'number') return valor;
    const strValue = String(valor).replace(/[R$\s.]/g, '').replace(',', '.');
    const parsed = parseFloat(strValue);
    return isNaN(parsed) ? null : parsed;
  };

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    
    if (typeof value === 'string') {
      const dateStr = value.trim();
      
      // Formato m/d/yy ou m/d/yyyy (Excel americano)
      const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (usMatch) {
        let [, month, day, year] = usMatch;
        if (year.length === 2) {
          year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        }
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Formato dd/mm/yyyy
      const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (brMatch) {
        const [, day, month, year] = brMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      
      // Formato yyyy-mm-dd
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr;
      }
      
      try {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        // Ignorar
      }
      
      return null;
    }
    
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    
    return null;
  };

  const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (!value) return false;
    const str = String(value).toUpperCase().trim();
    return str === 'SIM' || str === 'S' || str === '1' || str === 'TRUE' || str === 'YES' || str === 'OPTANTE';
  };

  const carregarArquivos = async () => {
    setLoading(true);
    setProgress(0);
    setStep('Carregando arquivo ATIVOS.xlsx...');
    
    try {
      // 1. Carregar ATIVOS.xlsx
      const ativosResponse = await fetch('/data/ATIVOS.xlsx');
      const ativosBuffer = await ativosResponse.arrayBuffer();
      const ativosWorkbook = XLSX.read(ativosBuffer, { type: 'array' });
      const ativosSheet = ativosWorkbook.Sheets[ativosWorkbook.SheetNames[0]];
      const ativosData = XLSX.utils.sheet_to_json(ativosSheet, { header: 1 }) as any[][];
      
      setProgress(20);
      setStep('Carregando arquivo BASE_ASO.xlsx...');
      
      // 2. Carregar BASE_ASO.xlsx
      const asoResponse = await fetch('/data/BASE_ASO.xlsx');
      const asoBuffer = await asoResponse.arrayBuffer();
      const asoWorkbook = XLSX.read(asoBuffer, { type: 'array' });
      const asoSheet = asoWorkbook.Sheets[asoWorkbook.SheetNames[0]];
      const asoData = XLSX.utils.sheet_to_json(asoSheet, { header: 1 }) as any[][];
      
      setProgress(40);
      setStep('Carregando arquivo BASE_Beneficios.xlsx...');
      
      // 3. Carregar BASE_Beneficios.xlsx
      const beneficiosResponse = await fetch('/data/BASE_Beneficios.xlsx');
      const beneficiosBuffer = await beneficiosResponse.arrayBuffer();
      const beneficiosWorkbook = XLSX.read(beneficiosBuffer, { type: 'array' });
      const beneficiosSheet = beneficiosWorkbook.Sheets[beneficiosWorkbook.SheetNames[0]];
      const beneficiosData = XLSX.utils.sheet_to_json(beneficiosSheet, { header: 1 }) as any[][];
      
      setProgress(60);
      setStep('Processando dados...');
      
      // Processar ATIVOS
      const ativosHeaders = ativosData[3] as string[]; // Linha 4 tem os headers
      const profissionais: any[] = [];
      const lojasSet = new Set<string>();
      
      for (let i = 4; i < ativosData.length; i++) {
        const row = ativosData[i] as any[];
        if (!row || !row[0] || String(row[0]).trim() === '') continue;
        
        const matricula = String(row[0]).trim();
        const nome = String(row[1] || '').trim();
        const localTrabalho = String(row[9] || '').trim();
        
        if (!nome) continue;
        
        if (localTrabalho) {
          lojasSet.add(localTrabalho);
        }
        
        profissionais.push({
          matricula,
          nome,
          obs: row[2],
          seguroDesemprego: row[3],
          admissaoCTPS: row[4],
          inicioLoja: row[5],
          gestor: row[6],
          cbo: String(row[7] || ''),
          cargo: String(row[8] || ''),
          localTrabalho,
          localRegistro: row[10],
          numeroLojaContab: row[11],
          salarioCTPS: row[12],
          salarioReceber: row[13],
          pensao: row[14],
          cpf: String(row[15] || '').replace(/[^\d]/g, ''),
          rg: String(row[16] || ''),
          pis: String(row[17] || ''),
          nascimento: row[18],
          idade: row[19],
          nomeMae: row[20],
          nomePai: row[21],
          genero: row[22],
          estadoCivil: row[23],
          dependente: row[24],
          endereco: row[25],
          numero: row[26],
          bairro: row[27],
          cidade: row[28],
          cep: row[29],
          corEtnia: row[30],
          telefone: String(row[31] || ''),
          escala: row[32],
          horario: row[33],
          cnh: row[34],
          dataVlCNH: row[35],
          categoria: row[36],
        });
      }
      
      // Processar ASO
      const examesASO: any[] = [];
      for (let i = 4; i < asoData.length; i++) {
        const row = asoData[i] as any[];
        if (!row || !row[0] || String(row[0]).trim() === '') continue;
        
        const matricula = String(row[0]).trim();
        const nome = String(row[1] || '').trim();
        const ultimoASO = row[8];
        const proxASO = row[9];
        const statusASO = String(row[10] || '').trim();
        const ultimoExame = row[11];
        const proxExame = row[12];
        const statusExames = String(row[13] || '').trim();
        
        if (!nome) continue;
        
        examesASO.push({
          matricula,
          nome,
          localTrabalho: row[6],
          localRegistro: row[7],
          ultimoASO,
          proxASO,
          statusASO: statusASO === 'EM DIA' ? 'em_dia' : 
                     statusASO === 'VENCIDO' ? 'vencido' : 
                     statusASO === 'A VENCER' ? 'a_vencer' : 'pendente',
          ultimoExame,
          proxExame,
          statusExames: statusExames === 'EM DIA' ? 'em_dia' : 
                        statusExames === 'VENCIDO' ? 'vencido' : 
                        statusExames === 'A VENCER' ? 'a_vencer' : 
                        statusExames === 'NR' ? 'nr' : 'pendente',
        });
      }
      
      // Processar Benefícios
      const beneficios: any[] = [];
      for (let i = 4; i < beneficiosData.length; i++) {
        const row = beneficiosData[i] as any[];
        if (!row || !row[0] || String(row[0]).trim() === '') continue;
        
        const matricula = String(row[0]).trim();
        const nome = String(row[1] || '').trim();
        const vtVcRaw = String(row[8] || '').trim().toUpperCase();
        const vrRaw = String(row[12] || '').trim().toUpperCase();
        const cestaRaw = String(row[13] || '').trim().toUpperCase();
        
        if (!nome) continue;
        
        beneficios.push({
          matricula,
          nome,
          inicioLoja: row[2],
          gestor: row[3],
          cbo: row[4],
          cargo: row[5],
          localTrabalho: row[6],
          localRegistro: row[7],
          vtVc: vtVcRaw === 'OPTANTE' || vtVcRaw === 'SIM' ? 'OPTANTE' : 'NÃO OPTANTE',
          tiposConducao: row[9],
          valorUnit: row[10],
          valorDiario: parseSalario(row[11]),
          vr: vrRaw === 'SIM' ? 'SIM' : 'NÃO',
          cestaBasica: cestaRaw === 'SIM' ? 'SIM' : 'NÃO',
          seguroVida: row[14],
          odonto: row[15],
          bemMais: row[16],
          hipcom: row[17],
        });
      }
      
      setProgress(80);
      setStep('Dados processados!');
      
      setProcessedData({
        profissionais,
        lojas: Array.from(lojasSet),
        examesASO,
        beneficios,
      });
      
      setPreviewData(profissionais.slice(0, 10));
      setProgress(100);
      
      toast.success(`${profissionais.length} profissionais, ${examesASO.length} exames ASO e ${beneficios.length} benefícios carregados`);
      
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
      toast.error('Erro ao carregar arquivos Excel');
    } finally {
      setLoading(false);
    }
  };

  const importarParaSupabase = async () => {
    if (!processedData) return;
    
    setLoading(true);
    setProgress(0);
    setStep('Enviando dados para o banco...');
    
    try {
      // Criar mapa de benefícios por matrícula
      const beneficiosMap = new Map<string, any>();
      for (const ben of processedData.beneficios) {
        beneficiosMap.set(ben.matricula, ben);
      }
      
      // Preparar dados dos profissionais com benefícios cruzados
      const profissionaisComBeneficios = processedData.profissionais.map(prof => {
        const beneficio = beneficiosMap.get(prof.matricula);
        return {
          ...prof,
          valeTransporte: beneficio?.vtVc === 'OPTANTE' || beneficio?.vtVc === 'SIM',
          valeRefeicao: beneficio?.vr === 'SIM',
          cestaBasica: beneficio?.cestaBasica === 'SIM',
          valorDiarioVT: parseSalario(beneficio?.valorDiario),
        };
      });
      
      // Chamar a edge function
      const { data, error } = await supabase.functions.invoke('migrate-excel-data', {
        body: {
          profissionais: profissionaisComBeneficios,
          lojas: processedData.lojas.map(nome => ({ nome })),
          examesASO: processedData.examesASO,
          beneficios: processedData.beneficios,
        }
      });
      
      setProgress(100);
      
      if (error) {
        throw error;
      }
      
      setImportResult(data);
      toast.success('Importação concluída!');
      
    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast.error(`Erro na importação: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Importar Dados Excel</h1>
          <p className="text-muted-foreground">
            Carregue e importe os dados dos arquivos ATIVOS, ASO e Benefícios
          </p>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Profissionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processedData?.profissionais.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">registros carregados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Lojas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processedData?.lojas.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">unidades encontradas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              Exames ASO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processedData?.examesASO.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">registros de ASO</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Benefícios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processedData?.beneficios.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">registros de benefícios</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Processar Arquivos
          </CardTitle>
          <CardDescription>
            Os arquivos devem estar em public/data/ (ATIVOS.xlsx, BASE_ASO.xlsx, BASE_Beneficios.xlsx)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button 
              onClick={carregarArquivos} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Carregar Arquivos
                </>
              )}
            </Button>
            
            <Button 
              onClick={importarParaSupabase} 
              disabled={loading || !processedData}
              variant="default"
            >
              <Database className="h-4 w-4 mr-2" />
              Importar para o Banco
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado da Importação */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Resultado da Importação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Lojas</span>
                  <Badge variant="secondary">{importResult.lojas.inserted}</Badge>
                </div>
                {importResult.lojas.errors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {importResult.lojas.errors.length} erros
                  </p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profissionais</span>
                  <Badge variant="secondary">{importResult.profissionais.inserted}</Badge>
                </div>
                {importResult.profissionais.errors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {importResult.profissionais.errors.length} erros
                  </p>
                )}
                {importResult.profissionais.warnings && importResult.profissionais.warnings.length > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {importResult.profissionais.warnings.length} avisos
                  </p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Exames ASO</span>
                  <Badge variant="secondary">{importResult.examesASO.inserted}</Badge>
                </div>
                {importResult.examesASO.errors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {importResult.examesASO.errors.length} erros
                  </p>
                )}
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Benefícios</span>
                  <Badge variant="secondary">{importResult.beneficios.inserted}</Badge>
                </div>
                {importResult.beneficios.errors.length > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {importResult.beneficios.errors.length} erros
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview dos Dados */}
      {processedData && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia dos Dados</CardTitle>
            <CardDescription>Primeiros 10 registros de cada categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profissionais">
              <TabsList>
                <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
                <TabsTrigger value="lojas">Lojas</TabsTrigger>
                <TabsTrigger value="aso">ASO</TabsTrigger>
                <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profissionais">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Local Trabalho</TableHead>
                        <TableHead>Salário</TableHead>
                        <TableHead>CPF</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.profissionais.slice(0, 20).map((prof, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">{prof.matricula}</TableCell>
                          <TableCell>{prof.nome}</TableCell>
                          <TableCell>{prof.cargo}</TableCell>
                          <TableCell>{prof.localTrabalho}</TableCell>
                          <TableCell>{prof.salarioReceber}</TableCell>
                          <TableCell className="font-mono">{prof.cpf}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="lojas">
                <ScrollArea className="h-[400px]">
                  <div className="grid gap-2 md:grid-cols-3">
                    {processedData.lojas.map((loja, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{loja}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="aso">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Último ASO</TableHead>
                        <TableHead>Próx. ASO</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.examesASO.slice(0, 20).map((aso, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">{aso.matricula}</TableCell>
                          <TableCell>{aso.nome}</TableCell>
                          <TableCell>{aso.ultimoASO}</TableCell>
                          <TableCell>{aso.proxASO}</TableCell>
                          <TableCell>
                            <Badge variant={
                              aso.statusASO === 'em_dia' ? 'default' :
                              aso.statusASO === 'vencido' ? 'destructive' :
                              aso.statusASO === 'a_vencer' ? 'secondary' : 'outline'
                            }>
                              {aso.statusASO}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="beneficios">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>VT/VC</TableHead>
                        <TableHead>Valor Diário</TableHead>
                        <TableHead>VR</TableHead>
                        <TableHead>Cesta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.beneficios.slice(0, 20).map((ben, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono">{ben.matricula}</TableCell>
                          <TableCell>{ben.nome}</TableCell>
                          <TableCell>
                            <Badge variant={ben.vtVc === 'OPTANTE' ? 'default' : 'secondary'}>
                              {ben.vtVc}
                            </Badge>
                          </TableCell>
                          <TableCell>{ben.valorDiario}</TableCell>
                          <TableCell>{ben.vr || '-'}</TableCell>
                          <TableCell>{ben.cestaBasica}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportarDadosExcel;

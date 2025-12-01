import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Check, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function CarregarDadosAdicionais() {
  const [loadingASO, setLoadingASO] = useState(false);
  const [loadingBeneficios, setLoadingBeneficios] = useState(false);
  const [statusASO, setStatusASO] = useState<'idle' | 'loaded' | 'error'>('idle');
  const [statusBeneficios, setStatusBeneficios] = useState<'idle' | 'loaded' | 'error'>('idle');
  const [timestampASO, setTimestampASO] = useState<string | null>(null);
  const [timestampBeneficios, setTimestampBeneficios] = useState<string | null>(null);

  // Carregar status dos dados ao montar o componente
  useState(() => {
    const asoData = localStorage.getItem('dadosASO');
    const beneficiosData = localStorage.getItem('dadosBeneficios');
    const asoTime = localStorage.getItem('dadosASO_timestamp');
    const beneficiosTime = localStorage.getItem('dadosBeneficios_timestamp');
    
    if (asoData) {
      setStatusASO('loaded');
      setTimestampASO(asoTime);
    }
    if (beneficiosData) {
      setStatusBeneficios('loaded');
      setTimestampBeneficios(beneficiosTime);
    }
  });

  const carregarASO = async () => {
    setLoadingASO(true);
    try {
      const response = await fetch('/data/BASE_ASO.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      console.log('Total de linhas no BASE_ASO:', jsonData.length);
      
      // Encontrar a linha do cabeçalho dinamicamente (procurar por "MATRICULA" ou "Matricula")
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(15, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row[0] && String(row[0]).toLowerCase().includes('matricula')) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        throw new Error('Cabeçalho não encontrado na planilha BASE_ASO');
      }
      
      console.log('Cabeçalho encontrado na linha:', headerRowIndex);
      const rows = jsonData.slice(headerRowIndex + 1).filter(row => row && row[0]); // Filtrar linhas com matrícula
      
      const dadosASO = rows.map(row => {
        // Função auxiliar para converter datas do Excel
        const parseExcelDate = (value: any): string => {
          if (!value) return '';
          if (typeof value === 'string') return value;
          if (typeof value === 'number') {
            // Excel armazena datas como números (dias desde 1900)
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
          }
          return String(value);
        };
        
        return {
          matricula: String(row[0] || '').trim(),
          nome: String(row[1] || '').trim(),
          inicioLoja: parseExcelDate(row[2]),
          gestor: String(row[3] || '').trim(),
          cbo: String(row[4] || '').trim(),
          cargo: String(row[5] || '').trim(),
          localTrabalho: String(row[6] || '').trim(),
          localRegistro: String(row[7] || '').trim(),
          ultimoASO: parseExcelDate(row[8]),
          proxASO: parseExcelDate(row[9]),
          statusASO: String(row[10] || '').trim(),
          ultimoExame: parseExcelDate(row[11]),
          proxExame: parseExcelDate(row[12]),
          statusExames: String(row[13] || '').trim(),
        };
      });

      console.log('Registros ASO processados:', dadosASO.length);
      console.log('Exemplo de registro:', dadosASO[0]);
      
      localStorage.setItem('dadosASO', JSON.stringify(dadosASO));
      localStorage.setItem('dadosASO_timestamp', new Date().toISOString());
      setStatusASO('loaded');
      toast.success(`✅ ${dadosASO.length} registros de ASO carregados com sucesso!`);
    } catch (error) {
      console.error('Erro ao carregar ASO:', error);
      setStatusASO('error');
      toast.error(`❌ Erro ao carregar dados de ASO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingASO(false);
    }
  };

  const carregarBeneficios = async () => {
    setLoadingBeneficios(true);
    try {
      const response = await fetch('/data/BASE_Beneficios.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      console.log('Total de linhas no BASE_Beneficios:', jsonData.length);
      
      // Encontrar a linha do cabeçalho dinamicamente
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(15, jsonData.length); i++) {
        const row = jsonData[i];
        if (row && row[0] && String(row[0]).toLowerCase().includes('matricula')) {
          headerRowIndex = i;
          break;
        }
      }
      
      if (headerRowIndex === -1) {
        throw new Error('Cabeçalho não encontrado na planilha BASE_Beneficios');
      }
      
      console.log('Cabeçalho encontrado na linha:', headerRowIndex);
      const rows = jsonData.slice(headerRowIndex + 1).filter(row => row && row[0]); // Filtrar linhas com matrícula
      
      const dadosBeneficios = rows.map(row => {
        // Função auxiliar para converter datas do Excel
        const parseExcelDate = (value: any): string => {
          if (!value) return '';
          if (typeof value === 'string') return value;
          if (typeof value === 'number') {
            const date = new Date((value - 25569) * 86400 * 1000);
            return date.toISOString().split('T')[0];
          }
          return String(value);
        };
        
        // Função para normalizar valores SIM/NÃO
        const normalizeBoolean = (value: any): string => {
          if (!value) return 'NÃO';
          const str = String(value).toUpperCase().trim();
          return str === 'SIM' || str === 'S' || str === '1' || str === 'TRUE' ? 'SIM' : 'NÃO';
        };
        
        return {
          matricula: String(row[0] || '').trim(),
          nome: String(row[1] || '').trim(),
          inicioLoja: parseExcelDate(row[2]),
          gestor: String(row[3] || '').trim(),
          cbo: String(row[4] || '').trim(),
          cargo: String(row[5] || '').trim(),
          localTrabalho: String(row[6] || '').trim(),
          localRegistro: String(row[7] || '').trim(),
          vtVc: normalizeBoolean(row[8]),
          tiposConducao: String(row[9] || '').trim(),
          valorUnit: row[10] || '',
          valorDiario: row[11] || '',
          vr: normalizeBoolean(row[12]),
          cestaBasica: normalizeBoolean(row[13]),
          seguroVida: normalizeBoolean(row[14]),
          odonto: normalizeBoolean(row[15]),
          bemMais: normalizeBoolean(row[16]),
          hipcom: normalizeBoolean(row[17]),
        };
      });

      console.log('Registros Benefícios processados:', dadosBeneficios.length);
      console.log('Exemplo de registro:', dadosBeneficios[0]);
      
      localStorage.setItem('dadosBeneficios', JSON.stringify(dadosBeneficios));
      localStorage.setItem('dadosBeneficios_timestamp', new Date().toISOString());
      setStatusBeneficios('loaded');
      toast.success(`✅ ${dadosBeneficios.length} registros de Benefícios carregados com sucesso!`);
    } catch (error) {
      console.error('Erro ao carregar Benefícios:', error);
      setStatusBeneficios('error');
      toast.error(`❌ Erro ao carregar dados de Benefícios: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingBeneficios(false);
    }
  };

  const carregarTodos = async () => {
    await carregarASO();
    await carregarBeneficios();
  };

  const limparDados = () => {
    localStorage.removeItem('dadosASO');
    localStorage.removeItem('dadosBeneficios');
    setStatusASO('idle');
    setStatusBeneficios('idle');
    toast.success('Dados adicionais removidos');
  };

  const getStatusBadge = (status: 'idle' | 'loaded' | 'error', timestamp: string | null) => {
    switch (status) {
      case 'loaded':
        return (
          <div className="flex flex-col gap-1">
            <Badge className="bg-success/10 text-success border-success/20">
              <Check className="h-3 w-3 mr-1" />Carregado
            </Badge>
            {timestamp && (
              <span className="text-xs text-muted-foreground">
                {new Date(timestamp).toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        );
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">Não carregado</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Carregar Dados Adicionais</h1>
        <p className="text-muted-foreground">Importe dados de ASO e Benefícios das planilhas BASE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card ASO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              BASE_ASO.xlsx
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(statusASO, timestampASO)}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Dados de exames ASO: último exame, próximo exame, status
              </p>
            </div>
            <Button 
              onClick={carregarASO} 
              disabled={loadingASO}
              className="w-full"
            >
              {loadingASO ? 'Carregando...' : 'Carregar ASO'}
            </Button>
          </CardContent>
        </Card>

        {/* Card Benefícios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-success" />
              BASE_Beneficios.xlsx
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(statusBeneficios, timestampBeneficios)}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Dados de benefícios: VT, VR, Cesta Básica, Seguros
              </p>
            </div>
            <Button 
              onClick={carregarBeneficios} 
              disabled={loadingBeneficios}
              className="w-full"
              variant="secondary"
            >
              {loadingBeneficios ? 'Carregando...' : 'Carregar Benefícios'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ações em lote */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Button 
              onClick={carregarTodos}
              disabled={loadingASO || loadingBeneficios}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Carregar Todos os Dados
            </Button>
            <Button 
              onClick={limparDados}
              variant="outline"
              disabled={loadingASO || loadingBeneficios}
            >
              Limpar Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como usar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>1. Clique em "Carregar Todos os Dados" para importar ambas as planilhas</p>
          <p>2. Os dados serão armazenados localmente e usados nas páginas de ASO e Benefícios</p>
          <p>3. Para atualizar os dados, carregue novamente as planilhas</p>
          <p>4. Use "Limpar Dados" para remover todos os dados adicionais</p>
        </CardContent>
      </Card>
    </div>
  );
}

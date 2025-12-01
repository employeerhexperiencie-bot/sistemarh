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

  const carregarASO = async () => {
    setLoadingASO(true);
    try {
      const response = await fetch('/data/BASE_ASO.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Pular as primeiras 2 linhas (título e cabeçalho)
      const headers = jsonData[3] as string[];
      const rows = jsonData.slice(4).filter(row => row[0]); // Filtrar linhas com matrícula
      
      const dadosASO = rows.map(row => ({
        matricula: row[0] || '',
        nome: row[1] || '',
        inicioLoja: row[2] || '',
        gestor: row[3] || '',
        cbo: row[4] || '',
        cargo: row[5] || '',
        localTrabalho: row[6] || '',
        localRegistro: row[7] || '',
        ultimoASO: row[8] || '',
        proxASO: row[9] || '',
        statusASO: row[10] || '',
        ultimoExame: row[11] || '',
        proxExame: row[12] || '',
        statusExames: row[13] || '',
      }));

      localStorage.setItem('dadosASO', JSON.stringify(dadosASO));
      setStatusASO('loaded');
      toast.success(`${dadosASO.length} registros de ASO carregados!`);
    } catch (error) {
      console.error('Erro ao carregar ASO:', error);
      setStatusASO('error');
      toast.error('Erro ao carregar dados de ASO');
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
      
      // Pular as primeiras linhas
      const headers = jsonData[8] as string[];
      const rows = jsonData.slice(9).filter(row => row[0]); // Filtrar linhas com matrícula
      
      const dadosBeneficios = rows.map(row => ({
        matricula: row[0] || '',
        nome: row[1] || '',
        inicioLoja: row[2] || '',
        gestor: row[3] || '',
        cbo: row[4] || '',
        cargo: row[5] || '',
        localTrabalho: row[6] || '',
        localRegistro: row[7] || '',
        vtVc: row[8] || '',
        tiposConducao: row[9] || '',
        valorUnit: row[10] || '',
        valorDiario: row[11] || '',
        vr: row[12] || '',
        cestaBasica: row[13] || '',
        seguroVida: row[14] || '',
        odonto: row[15] || '',
        bemMais: row[16] || '',
        hipcom: row[17] || '',
      }));

      localStorage.setItem('dadosBeneficios', JSON.stringify(dadosBeneficios));
      setStatusBeneficios('loaded');
      toast.success(`${dadosBeneficios.length} registros de Benefícios carregados!`);
    } catch (error) {
      console.error('Erro ao carregar Benefícios:', error);
      setStatusBeneficios('error');
      toast.error('Erro ao carregar dados de Benefícios');
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

  const getStatusBadge = (status: 'idle' | 'loaded' | 'error') => {
    switch (status) {
      case 'loaded':
        return <Badge className="bg-success/10 text-success border-success/20"><Check className="h-3 w-3 mr-1" />Carregado</Badge>;
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
              {getStatusBadge(statusASO)}
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
              {getStatusBadge(statusBeneficios)}
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

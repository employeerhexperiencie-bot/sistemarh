import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Download, Palette, Type } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DadosAtivos {
  headers: string[];
  rows: any[][];
  colunas: string[];
}

export default function AnalisarAtivos() {
  const [dados, setDados] = useState<DadosAtivos | null>(null);
  const [loading, setLoading] = useState(false);
  const [cores, setCores] = useState<string[]>([]);

  const carregarArquivo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/data/ATIVOS.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Pegar a primeira planilha
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        setDados({
          headers,
          rows,
          colunas: headers
        });

        // Tentar extrair cores se houver coluna de cores
        const coresExtraidas: string[] = [];
        const colunaCorIndex = headers.findIndex(h => 
          h?.toLowerCase().includes('cor') || 
          h?.toLowerCase().includes('color') ||
          h?.toLowerCase().includes('hex')
        );

        if (colunaCorIndex !== -1) {
          rows.forEach(row => {
            if (row[colunaCorIndex]) {
              coresExtraidas.push(row[colunaCorIndex]);
            }
          });
        }
        
        setCores(coresExtraidas);
      }
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarArquivo();
  }, []);

  const aplicarCoresAoSistema = () => {
    console.log('Cores encontradas:', cores);
    alert(`Encontradas ${cores.length} cores no arquivo. Esta funcionalidade será implementada para aplicar cores ao tema do sistema.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análise de Ativos</h1>
          <p className="text-muted-foreground">Dados importados do arquivo ATIVOS.xlsx</p>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Análise de Dados
        </Badge>
      </div>

      {/* Cards de Informação */}
      {dados && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold text-primary">{dados.rows.length}</p>
                  <p className="text-xs text-muted-foreground">Linhas de Dados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Type className="h-6 w-6 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold text-accent">{dados.colunas.length}</p>
                  <p className="text-xs text-muted-foreground">Colunas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Palette className="h-6 w-6 text-success" />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-bold text-success">{cores.length}</p>
                  <p className="text-xs text-muted-foreground">Cores Encontradas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <Button onClick={aplicarCoresAoSistema} className="w-full" disabled={cores.length === 0}>
                <Palette className="h-4 w-4 mr-2" />
                Aplicar ao Sistema
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cores Encontradas */}
      {cores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Paleta de Cores Identificada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {cores.slice(0, 20).map((cor, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-border shadow-md"
                    style={{ backgroundColor: cor }}
                  />
                  <code className="text-xs font-mono">{cor}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Dados */}
      {dados && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Completos ({dados.rows.length} registros)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {dados.headers.map((header, index) => (
                      <TableHead key={index} className="font-semibold">
                        {header || `Coluna ${index + 1}`}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {cell !== null && cell !== undefined ? String(cell) : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando arquivo...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

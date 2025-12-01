import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Download, Users, Building2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Profissional {
  matricula: string;
  nome: string;
  obs: string;
  seguroDesemprego: string;
  admissaoCTPS: string;
  inicioLoja: string;
  gestor: string;
  cbo: string;
  cargo: string;
  localTrabalho: string;
  localRegistro: string;
  lojaContab: string;
  salarioCTPS: string;
  salarioReceber: string;
  pensao: string;
  cpf: string;
  rg: string;
  pis: string;
  nascimento: string;
  idade: string;
  nomeMae: string;
  nomePai: string;
  genero: string;
  estadoCivil: string;
  dependente: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  corEtnia: string;
  telefone: string;
  escala: string;
  horario: string;
  cnh: string;
  dataVlCNH: string;
  categoria: string;
}

interface DadosAtivos {
  headers: string[];
  rows: any[][];
  profissionais: Profissional[];
  lojas: string[];
  cargos: string[];
}

export default function AnalisarAtivos() {
  const [dados, setDados] = useState<DadosAtivos | null>(null);
  const [loading, setLoading] = useState(false);

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
      
      if (jsonData.length > 2) {
        // Pula as primeiras 2 linhas (título e linha vazia)
        const headers = jsonData[2] as string[];
        const rows = jsonData.slice(3);
        
        // Processar profissionais
        const profissionais: Profissional[] = rows
          .filter(row => row[0]) // Filtrar linhas com matrícula
          .map(row => ({
            matricula: row[0] || '',
            nome: row[1] || '',
            obs: row[2] || '',
            seguroDesemprego: row[3] || '',
            admissaoCTPS: row[4] || '',
            inicioLoja: row[5] || '',
            gestor: row[6] || '',
            cbo: row[7] || '',
            cargo: row[8] || '',
            localTrabalho: row[9] || '',
            localRegistro: row[10] || '',
            lojaContab: row[11] || '',
            salarioCTPS: row[12] || '',
            salarioReceber: row[13] || '',
            pensao: row[14] || '',
            cpf: row[15] || '',
            rg: row[16] || '',
            pis: row[17] || '',
            nascimento: row[18] || '',
            idade: row[19] || '',
            nomeMae: row[20] || '',
            nomePai: row[21] || '',
            genero: row[22] || '',
            estadoCivil: row[23] || '',
            dependente: row[24] || '',
            endereco: row[25] || '',
            numero: row[26] || '',
            bairro: row[27] || '',
            cidade: row[28] || '',
            cep: row[29] || '',
            corEtnia: row[30] || '',
            telefone: row[31] || '',
            escala: row[32] || '',
            horario: row[33] || '',
            cnh: row[34] || '',
            dataVlCNH: row[35] || '',
            categoria: row[36] || ''
          }));

        // Extrair lojas únicas
        const lojasSet = new Set<string>();
        profissionais.forEach(p => {
          if (p.localTrabalho) lojasSet.add(p.localTrabalho);
        });
        const lojas = Array.from(lojasSet).sort();

        // Extrair cargos únicos
        const cargosSet = new Set<string>();
        profissionais.forEach(p => {
          if (p.cargo) cargosSet.add(p.cargo);
        });
        const cargos = Array.from(cargosSet).sort();
        
        setDados({
          headers,
          rows,
          profissionais,
          lojas,
          cargos
        });

        toast.success(`${profissionais.length} profissionais carregados com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast.error('Erro ao carregar arquivo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarArquivo();
  }, []);

  const popularSistema = () => {
    if (!dados) return;
    
    // Salvar dados no localStorage
    localStorage.setItem('profissionaisImportados', JSON.stringify(dados.profissionais));
    localStorage.setItem('lojasImportadas', JSON.stringify(dados.lojas));
    
    toast.success(`${dados.profissionais.length} profissionais e ${dados.lojas.length} lojas importadas para o sistema!`, {
      description: 'Acesse "Cadastro de Profissionais" para visualizar os dados importados.'
    });
  };

  const exportarJSON = () => {
    if (!dados) return;
    
    const json = JSON.stringify(dados.profissionais, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profissionais-ativos.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados em formato JSON');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análise de Profissionais Ativos</h1>
          <p className="text-muted-foreground">Base de dados completa extraída da planilha ATIVOS.xlsx</p>
        </div>
        <div className="flex gap-2">
          {dados && (
            <>
              <Button onClick={exportarJSON} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar JSON
              </Button>
              <Button onClick={popularSistema} className="bg-primary">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Popular Sistema
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Cards de Informação */}
      {dados && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20 hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-3xl font-bold text-primary">{dados.profissionais.length}</p>
                  <p className="text-sm text-muted-foreground">Profissionais Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20 hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-3xl font-bold text-accent">{dados.lojas.length}</p>
                  <p className="text-sm text-muted-foreground">Lojas Cadastradas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/20 hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Briefcase className="h-6 w-6 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-3xl font-bold text-success">{dados.cargos.length}</p>
                  <p className="text-sm text-muted-foreground">Cargos Diferentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-border hover:shadow-lg transition-all">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <FileSpreadsheet className="h-6 w-6 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-3xl font-bold">{dados.headers.length}</p>
                  <p className="text-sm text-muted-foreground">Campos de Dados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo por Lojas */}
      {dados && dados.lojas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Distribuição por Lojas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dados.lojas.map((loja, index) => {
                const count = dados.profissionais.filter(p => p.localTrabalho === loja).length;
                return (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="font-semibold text-sm truncate" title={loja}>{loja}</p>
                    <p className="text-2xl font-bold text-primary mt-1">{count}</p>
                    <p className="text-xs text-muted-foreground">profissionais</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo por Cargos */}
      {dados && dados.cargos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Cargos no Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {dados.cargos.map((cargo, index) => {
                const count = dados.profissionais.filter(p => p.cargo === cargo).length;
                return (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg border border-border">
                    <p className="font-semibold text-sm truncate" title={cargo}>{cargo}</p>
                    <p className="text-2xl font-bold text-accent mt-1">{count}</p>
                    <p className="text-xs text-muted-foreground">profissionais</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Profissionais */}
      {dados && dados.profissionais.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center justify-between">
                <span>Profissionais Cadastrados ({dados.profissionais.length})</span>
                <Badge variant="outline">{dados.profissionais.length} registros</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Matrícula</TableHead>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Cargo</TableHead>
                    <TableHead className="font-semibold">Loja</TableHead>
                    <TableHead className="font-semibold">Gestor</TableHead>
                    <TableHead className="font-semibold">Salário CTPS</TableHead>
                    <TableHead className="font-semibold">Salário a Receber</TableHead>
                    <TableHead className="font-semibold">Admissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.profissionais.map((prof, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{prof.matricula}</TableCell>
                      <TableCell className="font-medium">{prof.nome}</TableCell>
                      <TableCell>{prof.cargo}</TableCell>
                      <TableCell>{prof.localTrabalho}</TableCell>
                      <TableCell>{prof.gestor}</TableCell>
                      <TableCell className="font-mono">{prof.salarioCTPS}</TableCell>
                      <TableCell className="font-mono text-primary">{prof.salarioReceber}</TableCell>
                      <TableCell>{prof.admissaoCTPS}</TableCell>
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

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSpreadsheet, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface ProfissionalExcel {
  matricula: string;
  nome: string;
  cpf: string;
  rg: string;
  pis: string;
  nascimento: string;
  cargo: string;
  localTrabalho: string;
  salarioReceber: string;
  admissaoCTPS: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  cep: string;
  telefone: string;
  genero: string;
  estadoCivil: string;
  cbo: string;
  escala: string;
  cnh: string;
  dataVlCNH: string;
  categoria: string;
}

interface UpdateResult {
  matricula: string;
  nome: string;
  status: 'updated' | 'not_found' | 'error';
  camposAtualizados: string[];
  erro?: string;
}

function parseExcelDate(dateValue: any): string | null {
  if (!dateValue) return null;
  
  // If it's a number (Excel serial date)
  if (typeof dateValue === 'number') {
    const date = new Date((dateValue - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  // If it's already a string
  const dateStr = String(dateValue).trim();
  if (dateStr === '' || dateStr === 'NÃO' || dateStr === 'NA') return null;
  
  // Try different formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // MM/DD/YY or DD/MM/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year = parseInt(match[3] || match[1]);
      let month = parseInt(match[1] || match[2]);
      let day = parseInt(match[2] || match[3]);
      
      // Adjust for 2-digit years
      if (year < 100) {
        year += year > 50 ? 1900 : 2000;
      }
      
      // Excel often stores dates as MM/DD/YY
      if (month > 12 && day <= 12) {
        [month, day] = [day, month];
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  
  return null;
}

function parseSalary(salaryStr: string): number | null {
  if (!salaryStr) return null;
  const cleaned = salaryStr.replace(/[R$\s.]/g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

function normalizeMatricula(matricula: string): string {
  return matricula.replace(/[\/\-]/g, '').toUpperCase().trim();
}

export default function AtualizarAtivos() {
  const [profissionaisExcel, setProfissionaisExcel] = useState<ProfissionalExcel[]>([]);
  const [resultados, setResultados] = useState<UpdateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [etapa, setEtapa] = useState<'carregar' | 'visualizar' | 'atualizar' | 'concluido'>('carregar');

  const carregarArquivo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/data/ATIVOS.xlsx');
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length > 3) {
        const rows = jsonData.slice(3); // Skip header rows
        
        const profissionais: ProfissionalExcel[] = rows
          .filter(row => row[0] && String(row[0]).trim() !== '')
          .map(row => ({
            matricula: String(row[0] || '').trim(),
            nome: String(row[1] || '').trim(),
            cpf: String(row[15] || '').trim(),
            rg: String(row[16] || '').trim(),
            pis: String(row[17] || '').trim(),
            nascimento: String(row[18] || ''),
            cargo: String(row[8] || '').trim(),
            localTrabalho: String(row[9] || '').trim(),
            salarioReceber: String(row[13] || ''),
            admissaoCTPS: String(row[4] || ''),
            endereco: String(row[25] || '').trim(),
            numero: String(row[26] || '').trim(),
            bairro: String(row[27] || '').trim(),
            cidade: String(row[28] || '').trim(),
            cep: String(row[29] || '').trim(),
            telefone: String(row[31] || '').trim(),
            genero: String(row[22] || '').trim(),
            estadoCivil: String(row[23] || '').trim(),
            cbo: String(row[7] || '').trim(),
            escala: String(row[32] || '').trim(),
            cnh: String(row[37] || '').trim(),
            dataVlCNH: String(row[38] || ''),
            categoria: String(row[39] || '').trim(),
          }));

        setProfissionaisExcel(profissionais);
        setEtapa('visualizar');
        toast.success(`${profissionais.length} profissionais carregados da planilha`);
      }
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast.error('Erro ao carregar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const atualizarBanco = async () => {
    setLoading(true);
    setEtapa('atualizar');
    setProgresso(0);
    const resultadosTemp: UpdateResult[] = [];

    try {
      // Buscar todos os profissionais do banco
      const { data: profissionaisBanco, error } = await supabase
        .from('profissionais')
        .select('id, matricula, nome, cpf, rg, pis, data_nascimento, cargo, salario_nominal, endereco, bairro, cidade, cep, telefone, sexo, estado_civil, cbo, cnh, validade_cnh, categoria_cnh, data_admissao');

      if (error) throw error;

      // Criar mapa de matrículas normalizadas para IDs
      const matriculaMap = new Map<string, typeof profissionaisBanco[0]>();
      profissionaisBanco?.forEach(p => {
        const normalizado = normalizeMatricula(p.matricula);
        matriculaMap.set(normalizado, p);
      });

      for (let i = 0; i < profissionaisExcel.length; i++) {
        const profExcel = profissionaisExcel[i];
        const matriculaNorm = normalizeMatricula(profExcel.matricula);
        const profBanco = matriculaMap.get(matriculaNorm);

        if (!profBanco) {
          resultadosTemp.push({
            matricula: profExcel.matricula,
            nome: profExcel.nome,
            status: 'not_found',
            camposAtualizados: [],
          });
          continue;
        }

        try {
          const updateData: Record<string, any> = {};
          const camposAtualizados: string[] = [];

          // CPF
          if (profExcel.cpf && profExcel.cpf !== 'NA' && !profBanco.cpf) {
            updateData.cpf = profExcel.cpf.replace(/[^\d.-]/g, '');
            camposAtualizados.push('CPF');
          }

          // RG
          if (profExcel.rg && profExcel.rg !== 'NA' && !profBanco.rg) {
            updateData.rg = profExcel.rg;
            camposAtualizados.push('RG');
          }

          // PIS
          if (profExcel.pis && profExcel.pis !== 'NA' && !profBanco.pis) {
            updateData.pis = profExcel.pis;
            camposAtualizados.push('PIS');
          }

          // Data de nascimento
          const dataNasc = parseExcelDate(profExcel.nascimento);
          if (dataNasc && !profBanco.data_nascimento) {
            updateData.data_nascimento = dataNasc;
            camposAtualizados.push('Data Nascimento');
          }

          // Data de admissão
          const dataAdm = parseExcelDate(profExcel.admissaoCTPS);
          if (dataAdm && !profBanco.data_admissao) {
            updateData.data_admissao = dataAdm;
            camposAtualizados.push('Data Admissão');
          }

          // Salário
          const salario = parseSalary(profExcel.salarioReceber);
          if (salario && (!profBanco.salario_nominal || profBanco.salario_nominal === 0)) {
            updateData.salario_nominal = salario;
            camposAtualizados.push('Salário');
          }

          // Endereço
          const enderecoCompleto = profExcel.endereco + (profExcel.numero ? `, ${profExcel.numero}` : '');
          if (enderecoCompleto && enderecoCompleto.length > 2 && !profBanco.endereco) {
            updateData.endereco = enderecoCompleto;
            camposAtualizados.push('Endereço');
          }

          // Bairro
          if (profExcel.bairro && profExcel.bairro !== 'NA' && !profBanco.bairro) {
            updateData.bairro = profExcel.bairro;
            camposAtualizados.push('Bairro');
          }

          // Cidade
          if (profExcel.cidade && profExcel.cidade !== 'NA' && !profBanco.cidade) {
            updateData.cidade = profExcel.cidade;
            camposAtualizados.push('Cidade');
          }

          // CEP
          if (profExcel.cep && profExcel.cep !== 'NA' && !profBanco.cep) {
            updateData.cep = profExcel.cep.replace(/[^\d-]/g, '');
            camposAtualizados.push('CEP');
          }

          // Telefone
          if (profExcel.telefone && profExcel.telefone !== 'NA' && !profBanco.telefone) {
            updateData.telefone = profExcel.telefone;
            camposAtualizados.push('Telefone');
          }

          // Sexo/Gênero
          if (profExcel.genero && profExcel.genero !== 'NA' && !profBanco.sexo) {
            updateData.sexo = profExcel.genero;
            camposAtualizados.push('Sexo');
          }

          // Estado Civil
          if (profExcel.estadoCivil && profExcel.estadoCivil !== 'NA' && !profBanco.estado_civil) {
            updateData.estado_civil = profExcel.estadoCivil;
            camposAtualizados.push('Estado Civil');
          }

          // CBO
          if (profExcel.cbo && profExcel.cbo !== 'NA' && !profBanco.cbo) {
            updateData.cbo = profExcel.cbo;
            camposAtualizados.push('CBO');
          }

          // CNH
          if (profExcel.cnh && profExcel.cnh !== 'NA' && !profBanco.cnh) {
            updateData.cnh = profExcel.cnh;
            camposAtualizados.push('CNH');
          }

          // Validade CNH
          const validadeCNH = parseExcelDate(profExcel.dataVlCNH);
          if (validadeCNH && !profBanco.validade_cnh) {
            updateData.validade_cnh = validadeCNH;
            camposAtualizados.push('Validade CNH');
          }

          // Categoria CNH
          if (profExcel.categoria && profExcel.categoria !== 'NA' && !profBanco.categoria_cnh) {
            updateData.categoria_cnh = profExcel.categoria;
            camposAtualizados.push('Categoria CNH');
          }

          // Executar update se houver campos
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('profissionais')
              .update(updateData)
              .eq('id', profBanco.id);

            if (updateError) throw updateError;

            resultadosTemp.push({
              matricula: profExcel.matricula,
              nome: profExcel.nome,
              status: 'updated',
              camposAtualizados,
            });
          } else {
            resultadosTemp.push({
              matricula: profExcel.matricula,
              nome: profExcel.nome,
              status: 'updated',
              camposAtualizados: ['Nenhum campo precisava atualização'],
            });
          }
        } catch (err: any) {
          resultadosTemp.push({
            matricula: profExcel.matricula,
            nome: profExcel.nome,
            status: 'error',
            camposAtualizados: [],
            erro: err.message,
          });
        }

        setProgresso(((i + 1) / profissionaisExcel.length) * 100);
      }

      setResultados(resultadosTemp);
      setEtapa('concluido');

      const atualizados = resultadosTemp.filter(r => r.status === 'updated' && r.camposAtualizados[0] !== 'Nenhum campo precisava atualização').length;
      const naoEncontrados = resultadosTemp.filter(r => r.status === 'not_found').length;
      const erros = resultadosTemp.filter(r => r.status === 'error').length;

      toast.success(`Atualização concluída: ${atualizados} atualizados, ${naoEncontrados} não encontrados, ${erros} erros`);

    } catch (error: any) {
      console.error('Erro na atualização:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarArquivo();
  }, []);

  const atualizadosCount = resultados.filter(r => r.status === 'updated' && r.camposAtualizados[0] !== 'Nenhum campo precisava atualização').length;
  const naoEncontradosCount = resultados.filter(r => r.status === 'not_found').length;
  const errosCount = resultados.filter(r => r.status === 'error').length;
  const semAlteracaoCount = resultados.filter(r => r.status === 'updated' && r.camposAtualizados[0] === 'Nenhum campo precisava atualização').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atualizar Dados dos Profissionais</h1>
          <p className="text-muted-foreground">Atualiza campos faltantes a partir da planilha ATIVOS.xlsx</p>
        </div>
        <div className="flex gap-2">
          {etapa === 'visualizar' && (
            <Button onClick={atualizarBanco} disabled={loading} className="bg-primary">
              <Upload className="h-4 w-4 mr-2" />
              Atualizar Banco de Dados
            </Button>
          )}
          {etapa === 'concluido' && (
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          )}
        </div>
      </div>

      {/* Progress durante atualização */}
      {etapa === 'atualizar' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <p className="font-medium">Atualizando profissionais...</p>
              </div>
              <Progress value={progresso} className="w-full" />
              <p className="text-sm text-muted-foreground">{Math.round(progresso)}% concluído</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de resumo */}
      {etapa === 'concluido' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-3xl font-bold text-green-500">{atualizadosCount}</p>
                  <p className="text-sm text-muted-foreground">Atualizados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-3xl font-bold text-blue-500">{semAlteracaoCount}</p>
                  <p className="text-sm text-muted-foreground">Já Completos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="text-3xl font-bold text-yellow-500">{naoEncontradosCount}</p>
                  <p className="text-sm text-muted-foreground">Não Encontrados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="text-3xl font-bold text-red-500">{errosCount}</p>
                  <p className="text-sm text-muted-foreground">Erros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados detalhados */}
      {etapa === 'concluido' && resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Atualização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Campos Atualizados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultados.filter(r => r.camposAtualizados.length > 0 && r.camposAtualizados[0] !== 'Nenhum campo precisava atualização').map((resultado, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{resultado.matricula}</TableCell>
                      <TableCell>{resultado.nome}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            resultado.status === 'updated' ? 'default' :
                            resultado.status === 'not_found' ? 'secondary' : 'destructive'
                          }
                        >
                          {resultado.status === 'updated' ? 'Atualizado' :
                           resultado.status === 'not_found' ? 'Não Encontrado' : 'Erro'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {resultado.camposAtualizados.map((campo, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {campo}
                            </Badge>
                          ))}
                          {resultado.erro && (
                            <span className="text-red-500 text-xs">{resultado.erro}</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview dos dados do Excel */}
      {etapa === 'visualizar' && profissionaisExcel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Preview - {profissionaisExcel.length} Profissionais na Planilha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Salário</TableHead>
                    <TableHead>Admissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profissionaisExcel.slice(0, 20).map((prof, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{prof.matricula}</TableCell>
                      <TableCell>{prof.nome}</TableCell>
                      <TableCell>{prof.cpf}</TableCell>
                      <TableCell>{prof.cargo}</TableCell>
                      <TableCell>{prof.localTrabalho}</TableCell>
                      <TableCell>{prof.salarioReceber}</TableCell>
                      <TableCell>{prof.admissaoCTPS}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {profissionaisExcel.length > 20 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Mostrando 20 de {profissionaisExcel.length} registros
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && etapa === 'carregar' && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Carregando planilha...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Banknote, Building, Store, ExternalLink, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { matchesSearch } from '@/lib/searchUtils';
import { useNavigate } from 'react-router-dom';

interface Emprestimo {
  id: string;
  profissional_id: string;
  profissional_nome: string;
  profissional_matricula: string;
  /** Campos extras só para busca na listagem — mantém compatibilidade com o restante da tela. */
  profissional_cpf?: string | null;
  profissional_telefone?: string | null;
  profissional_celular?: string | null;
  loja: string;
  tipo: string;
  valor_total: number;
  valor_parcela: number;
  numero_parcelas: number;
  parcelas_pagas: number;
  saldo_devedor: number;
  status: string;
}

export function EmprestimosResumoTab() {
  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('emprestimos')
        .select(`
          *,
          profissionais:profissional_id(
            matricula, nome, cpf, telefone, celular,
            lojas:lojas!profissionais_loja_id_fkey(nome)
          )
        `)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((e: any) => ({
        id: e.id,
        profissional_id: e.profissional_id,
        profissional_nome: e.profissionais?.nome || '-',
        profissional_matricula: e.profissionais?.matricula || '-',
        profissional_cpf: e.profissionais?.cpf,
        profissional_telefone: e.profissionais?.telefone,
        profissional_celular: e.profissionais?.celular,
        loja: e.profissionais?.lojas?.nome || '-',
        tipo: e.tipo,
        valor_total: e.valor_total || 0,
        valor_parcela: e.valor_parcela || 0,
        numero_parcelas: e.numero_parcelas || 0,
        parcelas_pagas: e.parcelas_pagas || 0,
        saldo_devedor: e.saldo_devedor || 0,
        status: e.status,
      }));

      setEmprestimos(mapped);
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const emprestimosCLT = useMemo(
    () => emprestimos.filter((e) => e.tipo === 'CLT' || e.tipo === 'clt'),
    [emprestimos]
  );
  const emprestimosLoja = useMemo(
    () => emprestimos.filter((e) => e.tipo === 'empresa' || e.tipo === 'loja' || e.tipo === 'Empresa'),
    [emprestimos]
  );

  const emprestimosCLTVisiveis = useMemo(
    () =>
      emprestimosCLT.filter((e) =>
        matchesSearch(searchTerm, [
          e.profissional_nome,
          e.profissional_matricula,
          e.profissional_cpf,
          e.profissional_telefone,
          e.profissional_celular,
          e.loja,
        ])
      ),
    [emprestimosCLT, searchTerm]
  );
  const emprestimosLojaVisiveis = useMemo(
    () =>
      emprestimosLoja.filter((e) =>
        matchesSearch(searchTerm, [
          e.profissional_nome,
          e.profissional_matricula,
          e.profissional_cpf,
          e.profissional_telefone,
          e.profissional_celular,
          e.loja,
        ])
      ),
    [emprestimosLoja, searchTerm]
  );

  const totalCLT = emprestimosCLT.reduce((sum, e) => sum + e.saldo_devedor, 0);
  const totalLoja = emprestimosLoja.reduce((sum, e) => sum + e.saldo_devedor, 0);
  const totalParcelasMes = emprestimos.reduce((sum, e) => sum + e.valor_parcela, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const renderTable = (lista: Emprestimo[]) => (
    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matrícula</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Loja</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-right">Parcela</TableHead>
            <TableHead className="text-center">Parcelas</TableHead>
            <TableHead className="text-right">Saldo Devedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Carregando...
              </TableCell>
            </TableRow>
          ) : lista.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhum empréstimo encontrado
              </TableCell>
            </TableRow>
          ) : (
            lista.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono">{e.profissional_matricula}</TableCell>
                <TableCell className="font-medium">{e.profissional_nome}</TableCell>
                <TableCell>{e.loja}</TableCell>
                <TableCell className="text-right">{formatCurrency(e.valor_total)}</TableCell>
                <TableCell className="text-right">{formatCurrency(e.valor_parcela)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">
                    {e.parcelas_pagas}/{e.numero_parcelas}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  {formatCurrency(e.saldo_devedor)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              Empréstimos CLT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-blue-600">
                {emprestimosCLT.length}
              </span>
              <span className="text-sm">Saldo: {formatCurrency(totalCLT)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Store className="h-4 w-4 text-amber-600" />
              Empréstimos Loja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-amber-600">
                {emprestimosLoja.length}
              </span>
              <span className="text-sm">Saldo: {formatCurrency(totalLoja)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-600" />
              Parcelas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(totalParcelasMes)}
              </span>
              <span className="text-sm">{emprestimos.length} empréstimos ativos</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ação */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/emprestimos')} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Gestão Completa de Empréstimos
        </Button>
      </div>

      {/* Busca */}
      <Input
        placeholder="Buscar por nome, matrícula, CPF, telefone ou loja..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {/* Tabs */}
      <Tabs defaultValue="clt">
        <TabsList>
          <TabsTrigger value="clt" className="gap-2">
            <Building className="h-4 w-4" />
            CLT ({emprestimosCLT.length})
          </TabsTrigger>
          <TabsTrigger value="loja" className="gap-2">
            <Store className="h-4 w-4" />
            Loja ({emprestimosLoja.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clt">
          <Card>
            <CardHeader>
              <CardTitle>Empréstimos CLT (Desconto em Folha)</CardTitle>
              <CardDescription>Empréstimos com desconto automático na folha de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(emprestimosCLTVisiveis)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loja">
          <Card>
            <CardHeader>
              <CardTitle>Empréstimos Loja</CardTitle>
              <CardDescription>Empréstimos concedidos diretamente pela empresa</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(emprestimosLojaVisiveis)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

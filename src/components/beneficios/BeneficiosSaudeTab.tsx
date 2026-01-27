import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Stethoscope, Heart, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfissionalSaude {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  odonto: boolean;
  seguro_vida: boolean;
  bem_mais: boolean;
  valor_odonto: number;
  valor_seguro_vida: number;
  valor_bem_mais: number;
}

export function BeneficiosSaudeTab() {
  const [profissionais, setProfissionais] = useState<ProfissionalSaude[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          id, matricula, nome,
          odonto, seguro_vida, bem_mais,
          valor_odonto, valor_seguro_vida, valor_bem_mais,
          lojas:lojas!profissionais_loja_id_fkey(nome)
        `)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        matricula: p.matricula,
        nome: p.nome,
        loja: p.lojas?.nome || '-',
        odonto: p.odonto || false,
        seguro_vida: p.seguro_vida || false,
        bem_mais: p.bem_mais || false,
        valor_odonto: p.valor_odonto || 0,
        valor_seguro_vida: p.valor_seguro_vida || 0,
        valor_bem_mais: p.valor_bem_mais || 0,
      }));

      setProfissionais(mapped);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProfissionais = profissionais.filter(p =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.matricula.includes(searchTerm)
  );

  const totalOdonto = profissionais.filter(p => p.odonto).reduce((sum, p) => sum + p.valor_odonto, 0);
  const totalSeguroVida = profissionais.filter(p => p.seguro_vida).reduce((sum, p) => sum + p.valor_seguro_vida, 0);
  const totalBemMais = profissionais.filter(p => p.bem_mais).reduce((sum, p) => sum + p.valor_bem_mais, 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-4">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              Odontológico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">
                {profissionais.filter(p => p.odonto).length}
              </span>
              <span className="text-lg font-semibold">{formatCurrency(totalOdonto)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">beneficiários</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-600" />
              Seguro de Vida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-red-600">
                {profissionais.filter(p => p.seguro_vida).length}
              </span>
              <span className="text-lg font-semibold">{formatCurrency(totalSeguroVida)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">beneficiários</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Bem Mais (Sindicato)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-purple-600">
                {profissionais.filter(p => p.bem_mais).length}
              </span>
              <span className="text-lg font-semibold">{formatCurrency(totalBemMais)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">beneficiários</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios de Saúde por Profissional</CardTitle>
          <CardDescription>Odonto, Seguro Vida e Bem Mais</CardDescription>
          <Input
            placeholder="Buscar por nome ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm mt-2"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-center">Odonto</TableHead>
                  <TableHead className="text-center">Seguro Vida</TableHead>
                  <TableHead className="text-center">Bem Mais</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredProfissionais.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfissionais.slice(0, 50).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono">{p.matricula}</TableCell>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>{p.loja}</TableCell>
                      <TableCell className="text-center">
                        {p.odonto ? (
                          <Badge className="bg-blue-100 text-blue-700">{formatCurrency(p.valor_odonto)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.seguro_vida ? (
                          <Badge className="bg-red-100 text-red-700">{formatCurrency(p.valor_seguro_vida)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {p.bem_mais ? (
                          <Badge className="bg-purple-100 text-purple-700">{formatCurrency(p.valor_bem_mais)}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(
                          (p.odonto ? p.valor_odonto : 0) +
                          (p.seguro_vida ? p.valor_seguro_vida : 0) +
                          (p.bem_mais ? p.valor_bem_mais : 0)
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

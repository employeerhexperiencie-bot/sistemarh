import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserX, DollarSign, TrendingUp, Building2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LojaAfastamento {
  loja: string;
  total: number;
  maternidade: number;
  acidente: number;
  outros: number;
}

interface LojaBeneficio {
  loja: string;
  vt: number;
  vr: number;
  cesta: number;
  total: number;
  profissionais: number;
}

export function LojaComparison() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rankingAfastamentos, setRankingAfastamentos] = useState<LojaAfastamento[]>([]);
  const [rankingBeneficios, setRankingBeneficios] = useState<LojaBeneficio[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar afastamentos
      const { data: afastamentos } = await supabase
        .from('afastamentos')
        .select(`
          tipo,
          status,
          profissionais:profissional_id (
            lojas:loja_id (nome)
          )
        `)
        .eq('status', 'ativo');

      // Agrupar afastamentos por loja
      const afastamentosPorLoja: Record<string, LojaAfastamento> = {};
      (afastamentos || []).forEach((a: any) => {
        const loja = a.profissionais?.lojas?.nome || 'Sem Loja';
        if (!afastamentosPorLoja[loja]) {
          afastamentosPorLoja[loja] = { loja, total: 0, maternidade: 0, acidente: 0, outros: 0 };
        }
        afastamentosPorLoja[loja].total += 1;
        if (a.tipo === 'licenca_maternidade') {
          afastamentosPorLoja[loja].maternidade += 1;
        } else if (a.tipo?.includes('acidente')) {
          afastamentosPorLoja[loja].acidente += 1;
        } else {
          afastamentosPorLoja[loja].outros += 1;
        }
      });

      setRankingAfastamentos(
        Object.values(afastamentosPorLoja)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      );

      // Carregar profissionais para calcular benefícios
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select(`
          id,
          salario_nominal,
          vale_transporte,
          vale_refeicao,
          cesta_basica,
          valor_diario_rota,
          lojas:loja_id (nome)
        `)
        .eq('status', 'ativo');

      // Agrupar benefícios por loja - valores padronizados
      const DIAS_UTEIS = 22;
      const VALOR_DIARIO_VR = 25;
      const VALOR_CESTA = 180;
      const VALOR_DIARIO_VT_PADRAO = 4.40;
      
      const beneficiosPorLoja: Record<string, LojaBeneficio> = {};
      (profissionais || []).forEach((p: any) => {
        const loja = p.lojas?.nome || 'Sem Loja';
        
        if (!beneficiosPorLoja[loja]) {
          beneficiosPorLoja[loja] = { loja, vt: 0, vr: 0, cesta: 0, total: 0, profissionais: 0 };
        }
        
        // VT: usar valor_diario_rota do banco ou valor padrão × dias úteis
        const valorDiarioRota = p.valor_diario_rota || VALOR_DIARIO_VT_PADRAO;
        const vt = p.vale_transporte ? valorDiarioRota * DIAS_UTEIS : 0;
        const vr = p.vale_refeicao ? VALOR_DIARIO_VR * DIAS_UTEIS : 0;
        const cesta = p.cesta_basica ? VALOR_CESTA : 0;
        
        beneficiosPorLoja[loja].vt += vt;
        beneficiosPorLoja[loja].vr += vr;
        beneficiosPorLoja[loja].cesta += cesta;
        beneficiosPorLoja[loja].total += vt + vr + cesta;
        beneficiosPorLoja[loja].profissionais += 1;
      });

      setRankingBeneficios(
        Object.values(beneficiosPorLoja)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
      );
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPositionColor = (index: number) => {
    if (index === 0) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (index === 1) return 'bg-slate-400/10 text-slate-400 border-slate-400/20';
    if (index === 2) return 'bg-orange-600/10 text-orange-600 border-orange-600/20';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className="card-interactive">
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-interactive">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          Ranking de Lojas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="afastamentos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="afastamentos" className="text-xs sm:text-sm">
              <UserX className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Afastamentos
            </TabsTrigger>
            <TabsTrigger value="beneficios" className="text-xs sm:text-sm">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Benefícios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="afastamentos" className="space-y-2">
            {rankingAfastamentos.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum afastamento ativo registrado
              </div>
            ) : (
              rankingAfastamentos.map((item, index) => (
                <div
                  key={item.loja}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/painel-loja?loja=${encodeURIComponent(item.loja)}`)}
                >
                  <Badge 
                    variant="outline" 
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-bold ${getPositionColor(index)}`}
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-sm truncate">{item.loja}</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {item.maternidade > 0 && (
                        <span className="text-xs text-pink-400">
                          {item.maternidade} maternidade
                        </span>
                      )}
                      {item.acidente > 0 && (
                        <span className="text-xs text-destructive">
                          {item.acidente} acidente
                        </span>
                      )}
                      {item.outros > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {item.outros} outros
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-warning">{item.total}</p>
                    <p className="text-xs text-muted-foreground">afastados</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="beneficios" className="space-y-2">
            {rankingBeneficios.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum dado de benefícios disponível
              </div>
            ) : (
              rankingBeneficios.map((item, index) => (
                <div
                  key={item.loja}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/painel-loja?loja=${encodeURIComponent(item.loja)}`)}
                >
                  <Badge 
                    variant="outline" 
                    className={`h-7 w-7 rounded-full flex items-center justify-center font-bold ${getPositionColor(index)}`}
                  >
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-sm truncate">{item.loja}</p>
                    </div>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-primary">VT: {formatCurrency(item.vt)}</span>
                      <span className="text-orange-500">VR: {formatCurrency(item.vr)}</span>
                      <span className="text-green-600">Cesta: {formatCurrency(item.cesta)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success">{formatCurrency(item.total)}</p>
                    <p className="text-xs text-muted-foreground">{item.profissionais} prof.</p>
                  </div>
                </div>
              ))
            )}
            
            {rankingBeneficios.length > 0 && (
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Total geral:</span>
                  <span className="font-bold text-sm text-success">
                    {formatCurrency(rankingBeneficios.reduce((sum, item) => sum + item.total, 0))}
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

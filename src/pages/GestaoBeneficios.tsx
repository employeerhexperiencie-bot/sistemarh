import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bus, Utensils, Heart, CreditCard, Scale, Banknote, 
  Stethoscope, ShoppingBasket
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import tabs components
import { BeneficiosSaudeTab } from '@/components/beneficios/BeneficiosSaudeTab';
import { BeneficiosAlimentacaoTab } from '@/components/beneficios/BeneficiosAlimentacaoTab';
import { BeneficiosVTTab } from '@/components/beneficios/BeneficiosVTTab';
import { PensaoAlimenticiaTab } from '@/components/beneficios/PensaoAlimenticiaTab';
import { EmprestimosResumoTab } from '@/components/beneficios/EmprestimosResumoTab';

interface ResumoData {
  totalProfissionais: number;
  totalVT: number;
  totalVR: number;
  totalCesta: number;
  totalOdonto: number;
  totalSeguroVida: number;
  totalBemMais: number;
  totalValeAlimentacao: number;
  totalValeCarne: number;
  totalPensoes: number;
  totalEmprestimosAtivos: number;
}

export default function GestaoBeneficios() {
  const [resumo, setResumo] = useState<ResumoData>({
    totalProfissionais: 0,
    totalVT: 0,
    totalVR: 0,
    totalCesta: 0,
    totalOdonto: 0,
    totalSeguroVida: 0,
    totalBemMais: 0,
    totalValeAlimentacao: 0,
    totalValeCarne: 0,
    totalPensoes: 0,
    totalEmprestimosAtivos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResumo();
  }, []);

  const loadResumo = async () => {
    setIsLoading(true);
    try {
      // Carregar profissionais com benefícios
      const { data: profissionais } = await supabase
        .from('profissionais')
        .select('vale_transporte, vale_refeicao, cesta_basica, odonto, seguro_vida, bem_mais, vale_alimentacao, vale_carne')
        .eq('status', 'ativo');

      // Carregar pensões ativas
      const { count: pensoes } = await supabase
        .from('pensoes_alimenticias')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // Carregar empréstimos ativos
      const { count: emprestimos } = await supabase
        .from('emprestimos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      const profs = profissionais || [];
      
      setResumo({
        totalProfissionais: profs.length,
        totalVT: profs.filter(p => p.vale_transporte).length,
        totalVR: profs.filter(p => p.vale_refeicao).length,
        totalCesta: profs.filter(p => p.cesta_basica).length,
        totalOdonto: profs.filter(p => p.odonto).length,
        totalSeguroVida: profs.filter(p => p.seguro_vida).length,
        totalBemMais: profs.filter(p => p.bem_mais).length,
        totalValeAlimentacao: profs.filter(p => p.vale_alimentacao).length,
        totalValeCarne: profs.filter(p => p.vale_carne).length,
        totalPensoes: pensoes || 0,
        totalEmprestimosAtivos: emprestimos || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Benefícios</h1>
          <Badge className="bg-success/10 text-success border-success/20">
            {resumo.totalProfissionais} Ativos
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Saúde, Alimentação, Transporte, Pensões e Empréstimos
        </p>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Bus className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">VT</span>
            </div>
            <p className="text-xl font-bold">{resumo.totalVT}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">VR</span>
            </div>
            <p className="text-xl font-bold">{resumo.totalVR}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Cesta</span>
            </div>
            <p className="text-xl font-bold">{resumo.totalCesta}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Pensões</span>
            </div>
            <p className="text-xl font-bold">{resumo.totalPensoes}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Empréstimos</span>
            </div>
            <p className="text-xl font-bold">{resumo.totalEmprestimosAtivos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Benefícios */}
      <Tabs defaultValue="vt" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
          <TabsTrigger value="vt" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Bus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Vale</span> Transporte
          </TabsTrigger>
          <TabsTrigger value="alimentacao" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
            Alimentação
          </TabsTrigger>
          <TabsTrigger value="saude" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
            Saúde
          </TabsTrigger>
          <TabsTrigger value="pensao" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Scale className="h-3 w-3 sm:h-4 sm:w-4" />
            Pensão
          </TabsTrigger>
          <TabsTrigger value="emprestimos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Banknote className="h-3 w-3 sm:h-4 sm:w-4" />
            Empréstimos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vt">
          <BeneficiosVTTab />
        </TabsContent>

        <TabsContent value="alimentacao">
          <BeneficiosAlimentacaoTab />
        </TabsContent>

        <TabsContent value="saude">
          <BeneficiosSaudeTab />
        </TabsContent>

        <TabsContent value="pensao">
          <PensaoAlimenticiaTab />
        </TabsContent>

        <TabsContent value="emprestimos">
          <EmprestimosResumoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

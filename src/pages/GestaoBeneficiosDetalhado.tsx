import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Search, ChevronRight, Building2, User } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Beneficio {
  id: string;
  profissional_id: string;
  mes_referencia: string;
  valor_diario_vr: number;
  valor_diario_vt: number;
  dias_trabalhados_vr: number;
  dias_trabalhados_vt: number;
  valor_total_vr: number;
  valor_total_vt: number;
  descontos_vr: number;
  descontos_vt: number;
  valor_liquido_vr: number;
  valor_liquido_vt: number;
  valor_cesta: number;
  elegivel_cesta: boolean;
  profissional?: {
    nome: string;
    matricula: string;
    cargo: string;
    loja_id: string;
  };
}

interface LojaAgrupada {
  loja_id: string;
  loja_nome: string;
  total_vr: number;
  total_vt: number;
  total_cesta: number;
  total_geral: number;
  profissionais_count: number;
}

const GestaoBeneficiosDetalhado = () => {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [lojasAgrupadas, setLojasAgrupadas] = useState<LojaAgrupada[]>([]);
  const [lojas, setLojas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoja, setSelectedLoja] = useState<string | null>(null);
  const [selectedProfissional, setSelectedProfissional] = useState<Beneficio | null>(null);
  const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadData();
  }, [mesReferencia]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar lojas
      const { data: lojasData } = await supabase
        .from('lojas')
        .select('*')
        .order('nome');
      
      if (lojasData) setLojas(lojasData);

      // Calcular início e fim do mês corretamente
      const [year, month] = mesReferencia.split('-').map(Number);
      const inicioMes = `${mesReferencia}-01`;
      const proximoMes = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

      // Carregar benefícios com profissionais
      const { data: beneficiosData, error } = await supabase
        .from('beneficios')
        .select(`
          *,
          profissional:profissionais(nome, matricula, cargo, loja_id)
        `)
        .gte('mes_referencia', inicioMes)
        .lt('mes_referencia', proximoMes);

      if (error) throw error;
      
      if (beneficiosData) {
        setBeneficios(beneficiosData as any);
        agruparPorLoja(beneficiosData as any, lojasData || []);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar benefícios: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const agruparPorLoja = (beneficios: Beneficio[], lojas: any[]) => {
    const agrupado = new Map<string, LojaAgrupada>();

    beneficios.forEach((b) => {
      const lojaId = b.profissional?.loja_id || 'sem-loja';
      
      if (!agrupado.has(lojaId)) {
        const loja = lojas.find(l => l.id === lojaId);
        agrupado.set(lojaId, {
          loja_id: lojaId,
          loja_nome: loja?.nome || 'Sem Loja',
          total_vr: 0,
          total_vt: 0,
          total_cesta: 0,
          total_geral: 0,
          profissionais_count: 0
        });
      }

      const grupo = agrupado.get(lojaId)!;
      grupo.total_vr += b.valor_liquido_vr || 0;
      grupo.total_vt += b.valor_liquido_vt || 0;
      grupo.total_cesta += b.elegivel_cesta ? (b.valor_cesta || 0) : 0;
      grupo.total_geral += (b.valor_liquido_vr || 0) + (b.valor_liquido_vt || 0) + (b.elegivel_cesta ? (b.valor_cesta || 0) : 0);
      grupo.profissionais_count++;
    });

    setLojasAgrupadas(Array.from(agrupado.values()).sort((a, b) => b.total_geral - a.total_geral));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const exportarCSV = () => {
    const headers = ['Loja', 'Vale Refeição', 'Vale Transporte', 'Cesta Básica', 'Total', 'Profissionais'];
    const rows = lojasAgrupadas.map(l => [
      l.loja_nome,
      formatCurrency(l.total_vr),
      formatCurrency(l.total_vt),
      formatCurrency(l.total_cesta),
      formatCurrency(l.total_geral),
      l.profissionais_count
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beneficios-${mesReferencia}.csv`;
    a.click();
    toast.success('CSV exportado com sucesso!');
  };

  const gerarHoleriteBeneficio = (beneficio: Beneficio) => {
    const doc = new jsPDF();
    const prof = beneficio.profissional;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE BENEFÍCIOS', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Competência: ${new Date(beneficio.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, 105, 28, { align: 'center' });

    // Dados do profissional
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PROFISSIONAL', 14, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${prof?.nome || 'N/A'}`, 14, 48);
    doc.text(`Matrícula: ${prof?.matricula || 'N/A'}`, 14, 54);
    doc.text(`Cargo: ${prof?.cargo || 'N/A'}`, 14, 60);

    // Tabela de benefícios
    autoTable(doc, {
      startY: 70,
      head: [['Benefício', 'Valor Diário', 'Dias', 'Total Bruto', 'Descontos', 'Valor Líquido']],
      body: [
        [
          'Vale Refeição',
          formatCurrency(beneficio.valor_diario_vr || 0),
          (beneficio.dias_trabalhados_vr || 0).toString(),
          formatCurrency(beneficio.valor_total_vr || 0),
          formatCurrency(beneficio.descontos_vr || 0),
          formatCurrency(beneficio.valor_liquido_vr || 0)
        ],
        [
          'Vale Transporte',
          formatCurrency(beneficio.valor_diario_vt || 0),
          (beneficio.dias_trabalhados_vt || 0).toString(),
          formatCurrency(beneficio.valor_total_vt || 0),
          formatCurrency(beneficio.descontos_vt || 0),
          formatCurrency(beneficio.valor_liquido_vt || 0)
        ],
        [
          'Cesta Básica',
          beneficio.elegivel_cesta ? formatCurrency(beneficio.valor_cesta || 0) : 'Não elegível',
          '-',
          beneficio.elegivel_cesta ? formatCurrency(beneficio.valor_cesta || 0) : 'R$ 0,00',
          'R$ 0,00',
          beneficio.elegivel_cesta ? formatCurrency(beneficio.valor_cesta || 0) : 'R$ 0,00'
        ]
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Total geral
    const totalGeral = (beneficio.valor_liquido_vr || 0) + (beneficio.valor_liquido_vt || 0) + (beneficio.elegivel_cesta ? (beneficio.valor_cesta || 0) : 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL DE BENEFÍCIOS: ${formatCurrency(totalGeral)}`, 14, finalY);

    // Assinatura
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('_____________________________', 14, finalY + 30);
    doc.text('Assinatura do Profissional', 14, finalY + 36);
    doc.text(`Data: ____/____/________`, 14, finalY + 42);

    doc.text('_____________________________', 120, finalY + 30);
    doc.text('Responsável RH', 120, finalY + 36);

    // Salvar PDF
    doc.save(`beneficios-${prof?.matricula}-${mesReferencia}.pdf`);
    toast.success('Comprovante gerado com sucesso!');
  };

  const beneficiosFiltrados = beneficios.filter(b => {
    if (selectedLoja && b.profissional?.loja_id !== selectedLoja) return false;
    if (searchTerm && !b.profissional?.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totaisGerais = {
    vr: lojasAgrupadas.reduce((sum, l) => sum + l.total_vr, 0),
    vt: lojasAgrupadas.reduce((sum, l) => sum + l.total_vt, 0),
    cesta: lojasAgrupadas.reduce((sum, l) => sum + l.total_cesta, 0),
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão Detalhada de Benefícios</h1>
          <p className="text-muted-foreground">
            Navegação hierárquica: Visão Geral → Por Loja → Por Profissional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="month"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
            className="w-48"
          />
          <Button onClick={exportarCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Breadcrumb de navegação */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setSelectedLoja(null);
            setSelectedProfissional(null);
          }}
          className={!selectedLoja && !selectedProfissional ? "text-primary" : ""}
        >
          Visão Geral
        </Button>
        {selectedLoja && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedProfissional(null)}
              className={selectedLoja && !selectedProfissional ? "text-primary" : ""}
            >
              {lojas.find(l => l.id === selectedLoja)?.nome || 'Loja'}
            </Button>
          </>
        )}
        {selectedProfissional && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-primary">{selectedProfissional.profissional?.nome}</span>
          </>
        )}
      </div>

      {/* Visão Geral */}
      {!selectedLoja && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totaisGerais.vr + totaisGerais.vt + totaisGerais.cesta)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vale Refeição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totaisGerais.vr)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vale Transporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totaisGerais.vt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cesta Básica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totaisGerais.cesta)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Benefícios por Loja</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lojasAgrupadas.map((loja) => (
                  <div
                    key={loja.loja_id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedLoja(loja.loja_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{loja.loja_nome}</p>
                        <p className="text-sm text-muted-foreground">{loja.profissionais_count} profissionais</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">VR</p>
                        <p className="font-semibold text-blue-600">{formatCurrency(loja.total_vr)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">VT</p>
                        <p className="font-semibold text-green-600">{formatCurrency(loja.total_vt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Cesta</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(loja.total_cesta)}</p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold text-lg">{formatCurrency(loja.total_geral)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Visão por Loja - Lista de Profissionais */}
      {selectedLoja && !selectedProfissional && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profissionais - {lojas.find(l => l.id === selectedLoja)?.nome}</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar profissional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {beneficiosFiltrados.map((beneficio) => (
                <div
                  key={beneficio.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => setSelectedProfissional(beneficio)}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{beneficio.profissional?.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        Matrícula: {beneficio.profissional?.matricula} | {beneficio.profissional?.cargo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">VR</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(beneficio.valor_liquido_vr || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">VT</p>
                      <p className="font-semibold text-green-600">{formatCurrency(beneficio.valor_liquido_vt || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Cesta</p>
                      <p className="font-semibold text-orange-600">
                        {beneficio.elegivel_cesta ? formatCurrency(beneficio.valor_cesta || 0) : 'N/A'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhamento Individual do Profissional */}
      {selectedProfissional && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedProfissional.profissional?.nome}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Matrícula: {selectedProfissional.profissional?.matricula} | {selectedProfissional.profissional?.cargo}
                </p>
              </div>
              <Button onClick={() => gerarHoleriteBeneficio(selectedProfissional)}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Comprovante PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="vr">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="vr">Vale Refeição</TabsTrigger>
                <TabsTrigger value="vt">Vale Transporte</TabsTrigger>
                <TabsTrigger value="cesta">Cesta Básica</TabsTrigger>
              </TabsList>

              <TabsContent value="vr" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Valor Diário</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedProfissional.valor_diario_vr || 0)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Dias Trabalhados</p>
                    <p className="text-xl font-bold">{selectedProfissional.dias_trabalhados_vr || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Bruto</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedProfissional.valor_total_vr || 0)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Descontos</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedProfissional.descontos_vr || 0)}</p>
                  </div>
                </div>
                <div className="p-6 bg-primary/5 border border-primary rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Valor Líquido</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(selectedProfissional.valor_liquido_vr || 0)}</p>
                </div>
              </TabsContent>

              <TabsContent value="vt" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Valor Diário</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedProfissional.valor_diario_vt || 0)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Dias Trabalhados</p>
                    <p className="text-xl font-bold">{selectedProfissional.dias_trabalhados_vt || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Total Bruto</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedProfissional.valor_total_vt || 0)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Descontos</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedProfissional.descontos_vt || 0)}</p>
                  </div>
                </div>
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Valor Líquido</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(selectedProfissional.valor_liquido_vt || 0)}</p>
                </div>
              </TabsContent>

              <TabsContent value="cesta" className="space-y-4">
                {selectedProfissional.elegivel_cesta ? (
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Valor da Cesta Básica</p>
                        <p className="text-3xl font-bold text-orange-600">{formatCurrency(selectedProfissional.valor_cesta || 0)}</p>
                      </div>
                      <Badge variant="default" className="bg-green-500">Elegível</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground">Profissional não elegível para cesta básica neste período</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestaoBeneficiosDetalhado;

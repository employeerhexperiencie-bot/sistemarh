import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search, ChevronRight, Building2, User, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Valores padrão de benefícios (podem vir de configuracoes_sistema)
const VALOR_DIARIO_VR = 25.00;
const VALOR_CESTA_BASICA = 180.00;
const DIAS_UTEIS_MES = 22;

interface Profissional {
  id: string;
  nome: string;
  matricula: string;
  cargo: string;
  loja_id: string;
  vale_refeicao: boolean;
  vale_transporte: boolean;
  cesta_basica: boolean;
  valor_diario_rota: number | null;
  salario_nominal: number | null;
  loja?: {
    id: string;
    nome: string;
  };
}

interface BeneficioCalculado {
  profissional: Profissional;
  valor_vr: number;
  valor_vt: number;
  valor_cesta: number;
  total: number;
}

interface LojaAgrupada {
  loja_id: string;
  loja_nome: string;
  total_vr: number;
  total_vt: number;
  total_cesta: number;
  total_geral: number;
  profissionais_count: number;
  beneficios: BeneficioCalculado[];
}

const GestaoBeneficiosDetalhado = () => {
  const [lojasAgrupadas, setLojasAgrupadas] = useState<LojaAgrupada[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoja, setSelectedLoja] = useState<string | null>(null);
  const [selectedProfissional, setSelectedProfissional] = useState<BeneficioCalculado | null>(null);
  const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadData();
  }, [mesReferencia]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar profissionais ativos com dados de benefícios
      const { data: profissionaisData, error } = await supabase
        .from('profissionais')
        .select(`
          id, nome, matricula, cargo, loja_id,
          vale_refeicao, vale_transporte, cesta_basica,
          valor_diario_rota, salario_nominal,
          loja:lojas(id, nome)
        `)
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;

      if (profissionaisData) {
        calcularBeneficiosPorLoja(profissionaisData as any);
      }
    } catch (error: any) {
      toast.error(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calcularBeneficiosPorLoja = (profissionais: Profissional[]) => {
    const agrupado = new Map<string, LojaAgrupada>();

    profissionais.forEach((prof) => {
      const lojaId = prof.loja_id || 'sem-loja';
      const lojaNome = prof.loja?.nome || 'Sem Loja';

      // Calcular benefícios individuais
      const valor_vr = prof.vale_refeicao ? VALOR_DIARIO_VR * DIAS_UTEIS_MES : 0;
      const valor_vt = prof.vale_transporte ? (prof.valor_diario_rota || 0) * DIAS_UTEIS_MES : 0;
      const valor_cesta = prof.cesta_basica ? VALOR_CESTA_BASICA : 0;
      const total = valor_vr + valor_vt + valor_cesta;

      const beneficio: BeneficioCalculado = {
        profissional: prof,
        valor_vr,
        valor_vt,
        valor_cesta,
        total
      };

      if (!agrupado.has(lojaId)) {
        agrupado.set(lojaId, {
          loja_id: lojaId,
          loja_nome: lojaNome,
          total_vr: 0,
          total_vt: 0,
          total_cesta: 0,
          total_geral: 0,
          profissionais_count: 0,
          beneficios: []
        });
      }

      const grupo = agrupado.get(lojaId)!;
      grupo.total_vr += valor_vr;
      grupo.total_vt += valor_vt;
      grupo.total_cesta += valor_cesta;
      grupo.total_geral += total;
      grupo.profissionais_count++;
      grupo.beneficios.push(beneficio);
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

  const gerarComprovanteBeneficio = (beneficio: BeneficioCalculado) => {
    const doc = new jsPDF();
    const prof = beneficio.profissional;

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPROVANTE DE BENEFÍCIOS', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const mesFormatado = new Date(mesReferencia + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    doc.text(`Competência: ${mesFormatado}`, 105, 28, { align: 'center' });

    // Dados do profissional
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PROFISSIONAL', 14, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Nome: ${prof.nome}`, 14, 48);
    doc.text(`Matrícula: ${prof.matricula}`, 14, 54);
    doc.text(`Cargo: ${prof.cargo || 'N/A'}`, 14, 60);
    doc.text(`Loja: ${prof.loja?.nome || 'N/A'}`, 14, 66);

    // Tabela de benefícios
    autoTable(doc, {
      startY: 76,
      head: [['Benefício', 'Elegível', 'Valor Diário', 'Dias', 'Valor Mensal']],
      body: [
        [
          'Vale Refeição',
          prof.vale_refeicao ? 'Sim' : 'Não',
          prof.vale_refeicao ? formatCurrency(VALOR_DIARIO_VR) : '-',
          prof.vale_refeicao ? DIAS_UTEIS_MES.toString() : '-',
          formatCurrency(beneficio.valor_vr)
        ],
        [
          'Vale Transporte',
          prof.vale_transporte ? 'Sim' : 'Não',
          prof.vale_transporte ? formatCurrency(prof.valor_diario_rota || 0) : '-',
          prof.vale_transporte ? DIAS_UTEIS_MES.toString() : '-',
          formatCurrency(beneficio.valor_vt)
        ],
        [
          'Cesta Básica',
          prof.cesta_basica ? 'Sim' : 'Não',
          '-',
          '-',
          formatCurrency(beneficio.valor_cesta)
        ]
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Total geral
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL DE BENEFÍCIOS: ${formatCurrency(beneficio.total)}`, 14, finalY);

    // Assinatura
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('_____________________________', 14, finalY + 30);
    doc.text('Assinatura do Profissional', 14, finalY + 36);
    doc.text(`Data: ____/____/________`, 14, finalY + 42);

    doc.text('_____________________________', 120, finalY + 30);
    doc.text('Responsável RH', 120, finalY + 36);

    // Salvar PDF
    doc.save(`beneficios-${prof.matricula}-${mesReferencia}.pdf`);
    toast.success('Comprovante gerado com sucesso!');
  };

  const lojaAtual = lojasAgrupadas.find(l => l.loja_id === selectedLoja);
  
  const beneficiosFiltrados = lojaAtual?.beneficios.filter(b => {
    if (searchTerm && !b.profissional.nome.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) || [];

  const totaisGerais = {
    vr: lojasAgrupadas.reduce((sum, l) => sum + l.total_vr, 0),
    vt: lojasAgrupadas.reduce((sum, l) => sum + l.total_vt, 0),
    cesta: lojasAgrupadas.reduce((sum, l) => sum + l.total_cesta, 0),
  };

  const profissionaisComBeneficios = lojasAgrupadas.reduce((sum, l) => 
    sum + l.beneficios.filter(b => b.total > 0).length, 0
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

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
      <div className="flex items-center gap-2 text-sm">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setSelectedLoja(null);
            setSelectedProfissional(null);
          }}
          className={!selectedLoja && !selectedProfissional ? "text-primary font-semibold" : "text-muted-foreground"}
        >
          Visão Geral
        </Button>
        {selectedLoja && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedProfissional(null)}
              className={selectedLoja && !selectedProfissional ? "text-primary font-semibold" : "text-muted-foreground"}
            >
              {lojaAtual?.loja_nome || 'Loja'}
            </Button>
          </>
        )}
        {selectedProfissional && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-primary font-semibold">{selectedProfissional.profissional.nome}</span>
          </>
        )}
      </div>

      {/* Visão Geral */}
      {!selectedLoja && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totaisGerais.vr + totaisGerais.vt + totaisGerais.cesta)}</p>
                <p className="text-xs text-muted-foreground mt-1">{profissionaisComBeneficios} profissionais</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vale Refeição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totaisGerais.vr)}</p>
                <p className="text-xs text-muted-foreground mt-1">R$ {VALOR_DIARIO_VR}/dia</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Vale Transporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totaisGerais.vt)}</p>
                <p className="text-xs text-muted-foreground mt-1">Valor diário por rota</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Cesta Básica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totaisGerais.cesta)}</p>
                <p className="text-xs text-muted-foreground mt-1">R$ {VALOR_CESTA_BASICA}/mês</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lojas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{lojasAgrupadas.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Com profissionais</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Benefícios por Loja
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lojasAgrupadas.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum profissional com benefícios encontrado</p>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Visão por Loja - Lista de Profissionais */}
      {selectedLoja && !selectedProfissional && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedLoja(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Profissionais - {lojaAtual?.loja_nome}</CardTitle>
              </div>
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
            {beneficiosFiltrados.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum profissional encontrado</p>
            ) : (
              <div className="space-y-2">
                {beneficiosFiltrados.map((beneficio) => (
                  <div
                    key={beneficio.profissional.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedProfissional(beneficio)}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold">{beneficio.profissional.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Matrícula: {beneficio.profissional.matricula} | {beneficio.profissional.cargo || 'Sem cargo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">VR</p>
                        <p className={`font-semibold ${beneficio.valor_vr > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {beneficio.valor_vr > 0 ? formatCurrency(beneficio.valor_vr) : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">VT</p>
                        <p className={`font-semibold ${beneficio.valor_vt > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {beneficio.valor_vt > 0 ? formatCurrency(beneficio.valor_vt) : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Cesta</p>
                        <p className={`font-semibold ${beneficio.valor_cesta > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                          {beneficio.valor_cesta > 0 ? formatCurrency(beneficio.valor_cesta) : '-'}
                        </p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold">{formatCurrency(beneficio.total)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detalhamento Individual do Profissional */}
      {selectedProfissional && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedProfissional(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>{selectedProfissional.profissional.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Matrícula: {selectedProfissional.profissional.matricula} | {selectedProfissional.profissional.cargo || 'Sem cargo'}
                  </p>
                </div>
              </div>
              <Button onClick={() => gerarComprovanteBeneficio(selectedProfissional)}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Comprovante PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vale Refeição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${selectedProfissional.valor_vr > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                    {formatCurrency(selectedProfissional.valor_vr)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProfissional.profissional.vale_refeicao 
                      ? `${DIAS_UTEIS_MES} dias × R$ ${VALOR_DIARIO_VR}`
                      : 'Não elegível'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Vale Transporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${selectedProfissional.valor_vt > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {formatCurrency(selectedProfissional.valor_vt)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProfissional.profissional.vale_transporte 
                      ? `${DIAS_UTEIS_MES} dias × R$ ${selectedProfissional.profissional.valor_diario_rota || 0}`
                      : 'Não elegível'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cesta Básica</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-2xl font-bold ${selectedProfissional.valor_cesta > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {formatCurrency(selectedProfissional.valor_cesta)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedProfissional.profissional.cesta_basica ? 'Elegível' : 'Não elegível'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Benefícios</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(selectedProfissional.total)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Competência: {mesReferencia}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Benefício</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                        <th className="text-right py-3 px-4 font-medium">Valor Diário</th>
                        <th className="text-right py-3 px-4 font-medium">Dias</th>
                        <th className="text-right py-3 px-4 font-medium">Valor Mensal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-3 px-4">Vale Refeição</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${selectedProfissional.profissional.vale_refeicao ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedProfissional.profissional.vale_refeicao ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">{selectedProfissional.profissional.vale_refeicao ? formatCurrency(VALOR_DIARIO_VR) : '-'}</td>
                        <td className="py-3 px-4 text-right">{selectedProfissional.profissional.vale_refeicao ? DIAS_UTEIS_MES : '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(selectedProfissional.valor_vr)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Vale Transporte</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${selectedProfissional.profissional.vale_transporte ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedProfissional.profissional.vale_transporte ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">{selectedProfissional.profissional.vale_transporte ? formatCurrency(selectedProfissional.profissional.valor_diario_rota || 0) : '-'}</td>
                        <td className="py-3 px-4 text-right">{selectedProfissional.profissional.vale_transporte ? DIAS_UTEIS_MES : '-'}</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(selectedProfissional.valor_vt)}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-3 px-4">Cesta Básica</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${selectedProfissional.profissional.cesta_basica ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {selectedProfissional.profissional.cesta_basica ? 'Elegível' : 'Não elegível'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">-</td>
                        <td className="py-3 px-4 text-right">-</td>
                        <td className="py-3 px-4 text-right font-semibold">{formatCurrency(selectedProfissional.valor_cesta)}</td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td colSpan={4} className="py-3 px-4 font-bold text-right">TOTAL</td>
                        <td className="py-3 px-4 text-right font-bold text-lg text-primary">{formatCurrency(selectedProfissional.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestaoBeneficiosDetalhado;

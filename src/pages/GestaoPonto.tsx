import { useState, useCallback } from "react";
import { Clock, Search, Calendar, User, RefreshCw, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Batida {
  nomeFuncionario: string;
  pis: string;
  matriculaFuncionario: string;
  data: string;
  hora: string;
  nomeRep: string;
}

interface EspelhoDia {
  data: string;
  horario: string;
  batidas: string;
  cargaHoraria: string;
  horasTrabalhadasDiurnas: string;
  falta: string;
  atraso: string;
  extraDiurna: string;
  extraNoturna: string;
}

interface EspelhoTotal {
  cargaHoraria: string;
  horasTrabalhadasDiurnas: string;
  falta: string;
  atraso: string;
  extraDiurna: string;
}

interface FuncionarioEzpoint {
  id: string;
  matricula: string;
  nome: string;
  cpf?: string;
  cargo?: string;
}

async function callEzpoint(action: string, body: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("ezpoint-proxy", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message || "Erro ao conectar com EzPoint");
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function GestaoPonto() {
  const today = new Date().toISOString().split("T")[0];
  const [dataInicio, setDataInicio] = useState(today);
  const [dataFim, setDataFim] = useState(today);
  const [batidas, setBatidas] = useState<Batida[]>([]);
  const [espelho, setEspelho] = useState<{ dias: EspelhoDia[]; totais: EspelhoTotal | null }>({ dias: [], totais: null });
  const [funcionarios, setFuncionarios] = useState<FuncionarioEzpoint[]>([]);
  const [selectedFunc, setSelectedFunc] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("batidas");
  const [filtroNome, setFiltroNome] = useState("");

  const carregarFuncionarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callEzpoint("listar-funcionarios", { ocultarDemitidos: true });
      setFuncionarios(data.listaDeFuncionarios || []);
      toast.success(`${(data.listaDeFuncionarios || []).length} funcionários carregados do EzPoint`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const consultarBatidas = useCallback(async () => {
    if (!dataInicio || !dataFim) return toast.error("Selecione período");
    setLoading(true);
    try {
      const data = await callEzpoint("consultar-batidas", { dataInicio, dataFim });
      setBatidas(data.listaDeBatidas || []);
      toast.success(`${(data.listaDeBatidas || []).length} batidas encontradas`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  const consultarEspelho = useCallback(async () => {
    if (!selectedFunc || !dataInicio || !dataFim) return toast.error("Selecione funcionário e período");
    setLoading(true);
    try {
      const data = await callEzpoint("espelho-ponto", {
        idFuncionario: selectedFunc,
        dataInicio,
        dataFim,
      });
      setEspelho({
        dias: data.dias || [],
        totais: data.totalColunas || null,
      });
      toast.success("Espelho de ponto carregado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedFunc, dataInicio, dataFim]);

  const batidasFiltradas = filtroNome
    ? batidas.filter((b) => b.nomeFuncionario?.toLowerCase().includes(filtroNome.toLowerCase()))
    : batidas;

  // Agrupar batidas por funcionário + data
  const batidasAgrupadas = batidasFiltradas.reduce<Record<string, Batida[]>>((acc, b) => {
    const key = `${b.nomeFuncionario}|${b.data}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Ponto</h1>
          <p className="text-sm text-muted-foreground">
            Consulte batidas e espelho de ponto via EzPoint
          </p>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Data Início</label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Data Fim</label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-[160px]" />
            </div>
            <Button onClick={carregarFuncionarios} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Carregar Funcionários
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="batidas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Batidas Diárias
          </TabsTrigger>
          <TabsTrigger value="espelho" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Espelho de Ponto
          </TabsTrigger>
        </TabsList>

        {/* Aba Batidas */}
        <TabsContent value="batidas" className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por nome..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={consultarBatidas} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Consultar Batidas
            </Button>
          </div>

          {batidas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">Nenhuma batida carregada</p>
                <p className="text-sm">Selecione o período e clique em "Consultar Batidas"</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {batidasFiltradas.length} batidas — {Object.keys(batidasAgrupadas).length} registros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Marcações</TableHead>
                        <TableHead>Dispositivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(batidasAgrupadas).map(([key, group]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{group[0].nomeFuncionario}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{group[0].matriculaFuncionario}</Badge>
                          </TableCell>
                          <TableCell>{group[0].data?.split("-").reverse().join("/")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 flex-wrap">
                              {group.map((b, i) => (
                                <Badge key={i} variant="secondary" className="font-mono text-xs">
                                  {b.hora?.substring(0, 5)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{group[0].nomeRep}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Espelho */}
        <TabsContent value="espelho" className="space-y-4">
          <div className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5 min-w-[200px]">
              <label className="text-sm font-medium text-muted-foreground">Funcionário EzPoint</label>
              <Select value={selectedFunc} onValueChange={setSelectedFunc}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} ({f.matricula})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={consultarEspelho} disabled={loading || !selectedFunc}>
              <FileText className="h-4 w-4 mr-2" />
              Consultar Espelho
            </Button>
          </div>

          {funcionarios.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">Carregue os funcionários primeiro</p>
                <p className="text-sm">Clique em "Carregar Funcionários" no topo da página</p>
              </CardContent>
            </Card>
          )}

          {espelho.dias.length > 0 && (
            <>
              {/* Totais */}
              {espelho.totais && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "Carga Horária", value: espelho.totais.cargaHoraria },
                    { label: "Trabalhadas", value: espelho.totais.horasTrabalhadasDiurnas },
                    { label: "Faltas", value: espelho.totais.falta },
                    { label: "Atrasos", value: espelho.totais.atraso },
                    { label: "Extras", value: espelho.totais.extraDiurna },
                  ].map((item) => (
                    <Card key={item.label}>
                      <CardContent className="pt-4 pb-3 text-center">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-bold font-mono">{item.value || "00:00"}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Espelho de Ponto — {espelho.dias.length} dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Horário</TableHead>
                          <TableHead>Batidas</TableHead>
                          <TableHead>CH</TableHead>
                          <TableHead>Trab.</TableHead>
                          <TableHead>Falta</TableHead>
                          <TableHead>Atraso</TableHead>
                          <TableHead>Extra</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {espelho.dias.map((dia, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">{dia.data}</TableCell>
                            <TableCell className="font-mono text-xs">{dia.horario}</TableCell>
                            <TableCell className="font-mono text-xs">{dia.batidas}</TableCell>
                            <TableCell className="font-mono text-xs">{dia.cargaHoraria}</TableCell>
                            <TableCell className="font-mono text-xs">{dia.horasTrabalhadasDiurnas}</TableCell>
                            <TableCell>
                              {dia.falta && dia.falta !== "00:00" ? (
                                <Badge variant="destructive" className="text-xs">{dia.falta}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {dia.atraso && dia.atraso !== "00:00" ? (
                                <Badge variant="outline" className="text-xs border-accent">{dia.atraso}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {dia.extraDiurna && dia.extraDiurna !== "00:00" ? (
                                <Badge className="bg-green-500/20 text-green-700 text-xs">{dia.extraDiurna}</Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

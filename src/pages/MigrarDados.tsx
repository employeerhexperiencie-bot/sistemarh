import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database, Upload, CheckCircle2, XCircle, Loader2, AlertTriangle, Calendar, UserX, Plane } from "lucide-react";
import { toast } from "sonner";

interface MigrationResults {
  lojas: { inserted: number; errors: string[] };
  profissionais: { inserted: number; errors: string[]; warnings?: string[] };
  examesASO: { inserted: number; errors: string[] };
  beneficios: { inserted: number; errors: string[] };
  ferias: { inserted: number; errors: string[] };
  faltas: { inserted: number; errors: string[] };
  afastamentos: { inserted: number; errors: string[] };
}

const MigrarDados = () => {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [clearing, setClearing] = useState(false);
  const [dbStatus, setDbStatus] = useState({ 
    profissionais: 0, 
    lojas: 0,
    ferias: 0,
    faltas: 0,
    afastamentos: 0
  });

  // Carregar status do banco ao montar
  useEffect(() => {
    const loadDbStatus = async () => {
      const [profResult, lojaResult, feriasResult, faltasResult, afastamentosResult] = await Promise.all([
        supabase.from('profissionais').select('id', { count: 'exact', head: true }),
        supabase.from('lojas').select('id', { count: 'exact', head: true }),
        supabase.from('ferias').select('id', { count: 'exact', head: true }),
        supabase.from('faltas').select('id', { count: 'exact', head: true }),
        supabase.from('afastamentos').select('id', { count: 'exact', head: true })
      ]);
      
      setDbStatus({
        profissionais: profResult.count || 0,
        lojas: lojaResult.count || 0,
        ferias: feriasResult.count || 0,
        faltas: faltasResult.count || 0,
        afastamentos: afastamentosResult.count || 0
      });
    };
    
    loadDbStatus();
  }, []);

  const handleClearDatabase = async () => {
    if (!confirm("⚠️ Tem certeza? Isso irá DELETAR TODOS os dados do banco de dados!")) {
      return;
    }

    setClearing(true);
    try {
      // Deletar todos os dados em ordem reversa (devido às foreign keys)
      await supabase.from('beneficios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('exames_aso').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('faltas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('ferias').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('afastamentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('professional_vales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('professional_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('loja_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('historico_salarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('profissionais').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lojas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success("Banco de dados limpo com sucesso!");
      setResults(null);
      setDbStatus({ profissionais: 0, lojas: 0, ferias: 0, faltas: 0, afastamentos: 0 });
    } catch (error: any) {
      toast.error(`Erro ao limpar banco: ${error.message}`);
    } finally {
      setClearing(false);
    }
  };

  const handleMigration = async () => {
    setMigrating(true);
    setResults(null);

    try {
      // Carregar dados do localStorage
      const profissionaisImportados = localStorage.getItem('profissionaisImportados');
      const lojasData = localStorage.getItem('lojas');
      const dadosASO = localStorage.getItem('dadosASO');
      const dadosBeneficios = localStorage.getItem('dadosBeneficios');
      const dadosFerias = localStorage.getItem('dadosFerias');
      const dadosFaltas = localStorage.getItem('dadosFaltas');
      const dadosAfastamentos = localStorage.getItem('dadosAfastamentos');

      if (!profissionaisImportados) {
        toast.error("Dados não encontrados! Carregue os arquivos Excel primeiro.");
        return;
      }

      const profissionais = JSON.parse(profissionaisImportados);
      const lojas = lojasData ? JSON.parse(lojasData) : [];
      const examesASO = dadosASO ? JSON.parse(dadosASO).dados : [];
      const beneficios = dadosBeneficios ? JSON.parse(dadosBeneficios).dados : [];
      const ferias = dadosFerias ? JSON.parse(dadosFerias).dados : [];
      const faltas = dadosFaltas ? JSON.parse(dadosFaltas).dados : [];
      const afastamentos = dadosAfastamentos ? JSON.parse(dadosAfastamentos).dados : [];

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('migrate-excel-data', {
        body: {
          profissionais,
          lojas,
          examesASO,
          beneficios,
          ferias,
          faltas,
          afastamentos
        }
      });

      if (error) {
        toast.error(`Erro na migração: ${error.message}`);
        console.error('Erro:', error);
        return;
      }

      if (data && data.success) {
        setResults(data.results);
        toast.success("Migração concluída com sucesso!");
        
        // Atualizar status do banco
        const [profResult, lojaResult, feriasResult, faltasResult, afastamentosResult] = await Promise.all([
          supabase.from('profissionais').select('id', { count: 'exact', head: true }),
          supabase.from('lojas').select('id', { count: 'exact', head: true }),
          supabase.from('ferias').select('id', { count: 'exact', head: true }),
          supabase.from('faltas').select('id', { count: 'exact', head: true }),
          supabase.from('afastamentos').select('id', { count: 'exact', head: true })
        ]);
        
        setDbStatus({
          profissionais: profResult.count || 0,
          lojas: lojaResult.count || 0,
          ferias: feriasResult.count || 0,
          faltas: faltasResult.count || 0,
          afastamentos: afastamentosResult.count || 0
        });
      } else {
        toast.error("Erro na migração dos dados");
      }
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
      console.error('Erro na migração:', error);
    } finally {
      setMigrating(false);
    }
  };

  const verificarDadosLocalStorage = () => {
    const profissionaisImportados = localStorage.getItem('profissionaisImportados');
    const lojasData = localStorage.getItem('lojas');
    const dadosASO = localStorage.getItem('dadosASO');
    const dadosBeneficios = localStorage.getItem('dadosBeneficios');
    const dadosFerias = localStorage.getItem('dadosFerias');
    const dadosFaltas = localStorage.getItem('dadosFaltas');
    const dadosAfastamentos = localStorage.getItem('dadosAfastamentos');

    return {
      profissionais: profissionaisImportados ? JSON.parse(profissionaisImportados).length : 0,
      lojas: lojasData ? JSON.parse(lojasData).length : 0,
      aso: dadosASO ? JSON.parse(dadosASO).dados?.length || 0 : 0,
      beneficios: dadosBeneficios ? JSON.parse(dadosBeneficios).dados?.length || 0 : 0,
      ferias: dadosFerias ? JSON.parse(dadosFerias).dados?.length || 0 : 0,
      faltas: dadosFaltas ? JSON.parse(dadosFaltas).dados?.length || 0 : 0,
      afastamentos: dadosAfastamentos ? JSON.parse(dadosAfastamentos).dados?.length || 0 : 0
    };
  };

  const dadosDisponiveis = verificarDadosLocalStorage();
  const temDados = dadosDisponiveis.profissionais > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Migrar Dados para Banco de Dados</h1>
        <p className="text-muted-foreground">
          Migre os dados das planilhas Excel para o banco de dados Lovable Cloud
        </p>
      </div>

      {/* Status dos dados disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Dados Disponíveis no LocalStorage
          </CardTitle>
          <CardDescription>
            Verifique os dados carregados das planilhas Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profissionais</p>
              <p className="text-2xl font-bold">{dadosDisponiveis.profissionais}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lojas</p>
              <p className="text-2xl font-bold">{dadosDisponiveis.lojas}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Exames ASO</p>
              <p className="text-2xl font-bold">{dadosDisponiveis.aso}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Benefícios</p>
              <p className="text-2xl font-bold">{dadosDisponiveis.beneficios}</p>
            </div>
            <div className="space-y-1 flex items-center gap-2">
              <Plane className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Férias</p>
                <p className="text-2xl font-bold">{dadosDisponiveis.ferias}</p>
              </div>
            </div>
            <div className="space-y-1 flex items-center gap-2">
              <UserX className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Faltas</p>
                <p className="text-2xl font-bold">{dadosDisponiveis.faltas}</p>
              </div>
            </div>
            <div className="space-y-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Afastamentos</p>
                <p className="text-2xl font-bold">{dadosDisponiveis.afastamentos}</p>
              </div>
            </div>
          </div>

          {!temDados && (
            <Alert>
              <AlertDescription>
                Nenhum dado encontrado no localStorage. Por favor, carregue os arquivos Excel primeiro 
                na página <a href="/analisar-ativos" className="underline font-medium">Analisar Ativos</a>.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status do Banco de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Status Atual do Banco de Dados
          </CardTitle>
          <CardDescription>
            Dados já migrados para o banco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profissionais</p>
              <p className="text-2xl font-bold text-green-600">{dbStatus.profissionais}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lojas</p>
              <p className="text-2xl font-bold text-green-600">{dbStatus.lojas}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Férias</p>
              <p className="text-2xl font-bold text-blue-600">{dbStatus.ferias}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Faltas</p>
              <p className="text-2xl font-bold text-orange-600">{dbStatus.faltas}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Afastamentos</p>
              <p className="text-2xl font-bold text-purple-600">{dbStatus.afastamentos}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de migração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Iniciar Migração
          </CardTitle>
          <CardDescription>
            Esta operação irá transferir todos os dados para o banco de dados.
            Os dados do localStorage serão mantidos como backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleMigration}
            disabled={!temDados || migrating}
            size="lg"
            className="w-full"
          >
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Migrando dados...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Migrar Dados para Banco de Dados
              </>
            )}
          </Button>

          <Button
            onClick={handleClearDatabase}
            disabled={clearing}
            size="lg"
            variant="destructive"
            className="w-full"
          >
            {clearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Limpando banco...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Limpar Banco de Dados (Resetar)
              </>
            )}
          </Button>

          <Alert>
            <AlertDescription>
              💡 <strong>Dica:</strong> Após a migração, todos os dados estarão disponíveis no banco de dados 
              e poderão ser acessados por todas as funcionalidades do sistema.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Resultados da migração */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Resultados da Migração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Lojas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Lojas</h3>
                <Badge variant={results.lojas.errors.length > 0 ? "destructive" : "default"}>
                  {results.lojas.inserted} inseridas
                </Badge>
              </div>
              {results.lojas.errors.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded-md space-y-1">
                  {results.lojas.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-destructive flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Profissionais */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Profissionais</h3>
                <div className="flex gap-2">
                  {results.profissionais.warnings && results.profissionais.warnings.length > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                      {results.profissionais.warnings.length} avisos
                    </Badge>
                  )}
                  <Badge variant={results.profissionais.errors.length > 0 ? "destructive" : "default"}>
                    {results.profissionais.inserted} inseridos
                  </Badge>
                </div>
              </div>
              
              {/* Warnings - para RH revisar */}
              {results.profissionais.warnings && results.profissionais.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md space-y-1 max-h-60 overflow-y-auto">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    ⚠️ Registros para revisão do RH:
                  </p>
                  {results.profissionais.warnings.slice(0, 20).map((warning, idx) => (
                    <p key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {warning}
                    </p>
                  ))}
                  {results.profissionais.warnings.length > 20 && (
                    <p className="text-sm text-amber-600 italic">
                      ... e mais {results.profissionais.warnings.length - 20} avisos
                    </p>
                  )}
                </div>
              )}
              
              {/* Errors */}
              {results.profissionais.errors.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded-md space-y-1 max-h-60 overflow-y-auto">
                  {results.profissionais.errors.slice(0, 10).map((error, idx) => (
                    <p key={idx} className="text-sm text-destructive flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                  {results.profissionais.errors.length > 10 && (
                    <p className="text-sm text-muted-foreground italic">
                      ... e mais {results.profissionais.errors.length - 10} erros
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Exames ASO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Exames ASO</h3>
                <Badge variant={results.examesASO.errors.length > 0 ? "destructive" : "default"}>
                  {results.examesASO.inserted} inseridos
                </Badge>
              </div>
              {results.examesASO.errors.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded-md space-y-1 max-h-40 overflow-y-auto">
                  {results.examesASO.errors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-sm text-destructive flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                  {results.examesASO.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground italic">
                      ... e mais {results.examesASO.errors.length - 5} erros
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Benefícios */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Benefícios</h3>
                <Badge variant={results.beneficios.errors.length > 0 ? "destructive" : "default"}>
                  {results.beneficios.inserted} inseridos
                </Badge>
              </div>
            </div>

            {/* Férias */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Plane className="h-4 w-4 text-blue-500" />
                  Férias
                </h3>
                <Badge variant={results.ferias.errors.length > 0 ? "destructive" : "default"} className="bg-blue-100 text-blue-800">
                  {results.ferias.inserted} inseridas
                </Badge>
              </div>
              {results.ferias.errors.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md space-y-1 max-h-40 overflow-y-auto">
                  {results.ferias.errors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                  {results.ferias.errors.length > 5 && (
                    <p className="text-sm text-blue-600 italic">
                      ... e mais {results.ferias.errors.length - 5} erros
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Faltas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserX className="h-4 w-4 text-orange-500" />
                  Faltas
                </h3>
                <Badge variant={results.faltas.errors.length > 0 ? "destructive" : "default"} className="bg-orange-100 text-orange-800">
                  {results.faltas.inserted} inseridas
                </Badge>
              </div>
              {results.faltas.errors.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 p-3 rounded-md space-y-1 max-h-40 overflow-y-auto">
                  {results.faltas.errors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-sm text-orange-700 flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                  {results.faltas.errors.length > 5 && (
                    <p className="text-sm text-orange-600 italic">
                      ... e mais {results.faltas.errors.length - 5} erros
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Afastamentos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-500" />
                  Afastamentos
                </h3>
                <Badge variant={results.afastamentos.errors.length > 0 ? "destructive" : "default"} className="bg-purple-100 text-purple-800">
                  {results.afastamentos.inserted} inseridos
                </Badge>
              </div>
              {results.afastamentos.errors.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-md space-y-1 max-h-40 overflow-y-auto">
                  {results.afastamentos.errors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </p>
                  ))}
                  {results.afastamentos.errors.length > 5 && (
                    <p className="text-sm text-purple-600 italic">
                      ... e mais {results.afastamentos.errors.length - 5} erros
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MigrarDados;

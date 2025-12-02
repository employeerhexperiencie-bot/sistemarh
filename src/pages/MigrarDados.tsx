import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Database, Upload, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface MigrationResults {
  lojas: { inserted: number; errors: string[] };
  profissionais: { inserted: number; errors: string[]; warnings?: string[] };
  examesASO: { inserted: number; errors: string[] };
  beneficios: { inserted: number; errors: string[] };
}

const MigrarDados = () => {
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [clearing, setClearing] = useState(false);
  const [dbStatus, setDbStatus] = useState({ profissionais: 0, lojas: 0 });

  // Carregar status do banco ao montar
  useEffect(() => {
    const loadDbStatus = async () => {
      const [profResult, lojaResult] = await Promise.all([
        supabase.from('profissionais').select('id', { count: 'exact', head: true }),
        supabase.from('lojas').select('id', { count: 'exact', head: true })
      ]);
      
      setDbStatus({
        profissionais: profResult.count || 0,
        lojas: lojaResult.count || 0
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
      await supabase.from('profissionais').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('lojas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast.success("Banco de dados limpo com sucesso!");
      setResults(null);
      setDbStatus({ profissionais: 0, lojas: 0 });
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

      if (!profissionaisImportados) {
        toast.error("Dados não encontrados! Carregue os arquivos Excel primeiro.");
        return;
      }

      const profissionais = JSON.parse(profissionaisImportados);
      const lojas = lojasData ? JSON.parse(lojasData) : [];
      const examesASO = dadosASO ? JSON.parse(dadosASO).dados : [];
      const beneficios = dadosBeneficios ? JSON.parse(dadosBeneficios).dados : [];

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke('migrate-excel-data', {
        body: {
          profissionais,
          lojas,
          examesASO,
          beneficios
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
        const [profResult, lojaResult] = await Promise.all([
          supabase.from('profissionais').select('id', { count: 'exact', head: true }),
          supabase.from('lojas').select('id', { count: 'exact', head: true })
        ]);
        
        setDbStatus({
          profissionais: profResult.count || 0,
          lojas: lojaResult.count || 0
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

    return {
      profissionais: profissionaisImportados ? JSON.parse(profissionaisImportados).length : 0,
      lojas: lojasData ? JSON.parse(lojasData).length : 0,
      aso: dadosASO ? JSON.parse(dadosASO).dados?.length || 0 : 0,
      beneficios: dadosBeneficios ? JSON.parse(dadosBeneficios).dados?.length || 0 : 0
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Profissionais no BD</p>
              <p className="text-2xl font-bold text-green-600">{dbStatus.profissionais}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Lojas no BD</p>
              <p className="text-2xl font-bold text-green-600">{dbStatus.lojas}</p>
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
            {results.examesASO.inserted > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Exames ASO</h3>
                  <Badge variant={results.examesASO.errors.length > 0 ? "destructive" : "default"}>
                    {results.examesASO.inserted} inseridos
                  </Badge>
                </div>
              </div>
            )}

            {/* Benefícios */}
            {results.beneficios.inserted > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Benefícios</h3>
                  <Badge variant={results.beneficios.errors.length > 0 ? "destructive" : "default"}>
                    {results.beneficios.inserted} inseridos
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MigrarDados;

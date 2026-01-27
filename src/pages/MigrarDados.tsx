import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database, Upload, CheckCircle2, Loader2, AlertTriangle, Calendar, UserX, Plane, ShieldAlert } from "lucide-react";
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
  const { user } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [dbStatus, setDbStatus] = useState({ 
    profissionais: 0, 
    lojas: 0,
    ferias: 0,
    faltas: 0,
    afastamentos: 0
  });

  // Verificar se usuário é admin
  const isAdmin = user?.role === 'admin';

  // Carregar status do banco ao montar
  useEffect(() => {
    const loadDbStatus = async () => {
      try {
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
      } catch (error) {
        console.error('Erro ao carregar status do banco:', error);
      }
    };
    
    loadDbStatus();
  }, []);

  const handleMigration = async () => {
    if (!isAdmin) {
      toast.error("Acesso negado. Apenas administradores podem executar migrações.");
      return;
    }

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
        setMigrating(false);
        return;
      }

      const profissionais = JSON.parse(profissionaisImportados);
      const lojas = lojasData ? JSON.parse(lojasData) : [];
      
      const parsedASO = dadosASO ? JSON.parse(dadosASO) : null;
      const examesASO = parsedASO ? (Array.isArray(parsedASO) ? parsedASO : parsedASO.dados || []) : [];
      
      const parsedBeneficios = dadosBeneficios ? JSON.parse(dadosBeneficios) : null;
      const beneficios = parsedBeneficios ? (Array.isArray(parsedBeneficios) ? parsedBeneficios : parsedBeneficios.dados || []) : [];
      
      const parsedFerias = dadosFerias ? JSON.parse(dadosFerias) : null;
      const ferias = parsedFerias ? (Array.isArray(parsedFerias) ? parsedFerias : parsedFerias.dados || []) : [];
      
      const parsedFaltas = dadosFaltas ? JSON.parse(dadosFaltas) : null;
      const faltas = parsedFaltas ? (Array.isArray(parsedFaltas) ? parsedFaltas : parsedFaltas.dados || []) : [];
      
      const parsedAfastamentos = dadosAfastamentos ? JSON.parse(dadosAfastamentos) : null;
      const afastamentos = parsedAfastamentos ? (Array.isArray(parsedAfastamentos) ? parsedAfastamentos : parsedAfastamentos.dados || []) : [];
      
      console.log('Dados para migração:', {
        profissionais: profissionais.length,
        lojas: lojas.length,
        examesASO: examesASO.length,
        beneficios: beneficios.length,
        ferias: ferias.length,
        faltas: faltas.length,
        afastamentos: afastamentos.length
      });

      // Chamar edge function com autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        setMigrating(false);
        return;
      }

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
        setMigrating(false);
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
        toast.error(data?.error || "Erro na migração dos dados");
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

    const parseData = (data: string | null) => {
      if (!data) return 0;
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed.length;
        if (parsed.dados && Array.isArray(parsed.dados)) return parsed.dados.length;
        return 0;
      } catch {
        return 0;
      }
    };

    return {
      profissionais: profissionaisImportados ? JSON.parse(profissionaisImportados).length : 0,
      lojas: lojasData ? JSON.parse(lojasData).length : 0,
      aso: parseData(dadosASO),
      beneficios: parseData(dadosBeneficios),
      ferias: parseData(dadosFerias),
      faltas: parseData(dadosFaltas),
      afastamentos: parseData(dadosAfastamentos)
    };
  };

  const dadosDisponiveis = verificarDadosLocalStorage();
  const temDados = dadosDisponiveis.profissionais > 0;

  // Se não é admin, mostrar mensagem de acesso negado
  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Migrar Dados</h1>
          <p className="text-muted-foreground">
            Migração de dados das planilhas Excel
          </p>
        </div>

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>Acesso Restrito</strong>
            <p className="mt-1">
              Esta funcionalidade está disponível apenas para administradores do sistema.
              Entre em contato com o administrador se precisar migrar dados.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Migrar Dados para Banco de Dados</h1>
        <p className="text-muted-foreground">
          Migre os dados das planilhas Excel para o banco de dados (somente administradores)
        </p>
      </div>

      {/* Aviso de Segurança */}
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <strong>Área Administrativa Protegida</strong>
          <p className="text-sm mt-1">
            Esta operação é registrada no log de auditoria do sistema. Todas as ações são rastreadas.
          </p>
        </AlertDescription>
      </Alert>

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
              <AlertTriangle className="h-4 w-4" />
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
                  {results.lojas.errors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                  {results.lojas.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      ... e mais {results.lojas.errors.length - 5} erros
                    </p>
                  )}
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
              {results.profissionais.errors.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded-md space-y-1">
                  {results.profissionais.errors.slice(0, 5).map((error, idx) => (
                    <p key={idx} className="text-sm text-destructive">
                      {error}
                    </p>
                  ))}
                  {results.profissionais.errors.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      ... e mais {results.profissionais.errors.length - 5} erros
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
            </div>

            {/* Férias */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Férias</h3>
                <Badge variant={results.ferias.errors.length > 0 ? "destructive" : "default"}>
                  {results.ferias.inserted} inseridas
                </Badge>
              </div>
            </div>

            {/* Faltas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Faltas</h3>
                <Badge variant={results.faltas.errors.length > 0 ? "destructive" : "default"}>
                  {results.faltas.inserted} inseridas
                </Badge>
              </div>
            </div>

            {/* Afastamentos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Afastamentos</h3>
                <Badge variant={results.afastamentos.errors.length > 0 ? "destructive" : "default"}>
                  {results.afastamentos.inserted} inseridos
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MigrarDados;

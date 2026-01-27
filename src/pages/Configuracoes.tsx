import { useState, useEffect } from 'react';
import { Settings, Save, Users, Phone, Mail, Sparkles, RotateCcw, HelpCircle, Shield, UserPlus, Store, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppearanceCustomizer } from '@/components/AppearanceCustomizer';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Configuracoes() {
  const { resetTour, hasSeenTour } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lojas, setLojas] = useState<any[]>([]);
  const [loadingLojas, setLoadingLojas] = useState(true);
  const [novaLoja, setNovaLoja] = useState({
    id: '',
    nome: '',
    telefone: '',
    email: '',
  });

  // Carregar lojas do Supabase
  useEffect(() => {
    const fetchLojas = async () => {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('nome');
      
      if (!error && data) {
        setLojas(data);
      }
      setLoadingLojas(false);
    };
    fetchLojas();
  }, []);

  const handleAddLoja = () => {
    if (!novaLoja.id || !novaLoja.nome) return;
    
    console.log('Adicionando loja:', novaLoja);
    
    setNovaLoja({
      id: '',
      nome: '',
      telefone: '',
      email: '',
    });
  };

  const handleResetTour = () => {
    resetTour();
    toast.success('Tour reiniciado! Atualize a página para começar.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <Badge variant="outline" className="bg-accent/10">
          <Settings className="h-4 w-4 mr-2" />
          Sistema
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Card de Gestão de Usuários - Acesso Rápido */}
          {user?.role === 'admin' && (
            <Card className="bg-primary/5 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={() => navigate('/gestao-usuarios')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Gestão de Usuários
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Convide novos usuários, defina papéis e permissões de acesso ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-2" onClick={(e) => { e.stopPropagation(); navigate('/gestao-usuarios'); }}>
                    <UserPlus className="h-4 w-4" />
                    Convidar Usuário
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={(e) => { e.stopPropagation(); navigate('/gestao-usuarios'); }}>
                    <Users className="h-4 w-4" />
                    Ver Usuários
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <AppearanceCustomizer />

          {/* Onboarding Card */}
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Tour de Onboarding
              </CardTitle>
              <CardDescription>
                Reveja o tour guiado pelas funcionalidades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Status do Tour</p>
                    <p className="text-xs text-muted-foreground">
                      {hasSeenTour ? 'Concluído' : 'Pendente'}
                    </p>
                  </div>
                </div>
                <Badge variant={hasSeenTour ? 'secondary' : 'default'}>
                  {hasSeenTour ? 'Visto' : 'Novo'}
                </Badge>
              </div>
              
              <Button 
                onClick={handleResetTour}
                variant="outline"
                className="w-full gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reiniciar Tour de Onboarding
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Após reiniciar, atualize a página para ver o tour novamente
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Lojas Cadastradas
              </CardTitle>
              <CardDescription>
                {loadingLojas ? 'Carregando...' : `${lojas.length} loja(s) registrada(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLojas ? (
                <div className="text-center py-8 text-muted-foreground">Carregando lojas...</div>
              ) : lojas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma loja cadastrada. Use a seção abaixo para adicionar.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lojas.map((loja) => (
                      <TableRow key={loja.id}>
                        <TableCell className="font-medium">{loja.nome}</TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {loja.telefone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {loja.telefone}
                              </div>
                            )}
                            {loja.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {loja.email}
                              </div>
                            )}
                            {!loja.telefone && !loja.email && (
                              <span className="text-muted-foreground">Sem contato</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="text-accent">Adicionar Nova Loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lojaId">ID da Loja</Label>
                  <Input
                    id="lojaId"
                    placeholder="CENTRO"
                    value={novaLoja.id}
                    onChange={(e) => setNovaLoja(prev => ({ ...prev, id: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lojaNome">Nome</Label>
                  <Input
                    id="lojaNome"
                    placeholder="Centro"
                    value={novaLoja.nome}
                    onChange={(e) => setNovaLoja(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lojaTelefone">Telefone</Label>
                <Input
                  id="lojaTelefone"
                  placeholder="(11) 99999-4444"
                  value={novaLoja.telefone}
                  onChange={(e) => setNovaLoja(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lojaEmail">E-mail</Label>
                <Input
                  id="lojaEmail"
                  type="email"
                  placeholder="centro@empresa.com"
                  value={novaLoja.email}
                  onChange={(e) => setNovaLoja(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <Button 
                onClick={handleAddLoja}
                disabled={!novaLoja.id || !novaLoja.nome}
                className="w-full"
                variant="outline"
              >
                Adicionar Loja
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
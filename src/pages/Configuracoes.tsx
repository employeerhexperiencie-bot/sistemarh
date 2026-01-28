import { useState } from 'react';
import { Settings, Sparkles, RotateCcw, HelpCircle, Shield, UserPlus, Users, ChevronRight, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppearanceCustomizer } from '@/components/AppearanceCustomizer';
import { ConfiguracoesRH } from '@/components/configuracoes/ConfiguracoesRH';
import { HistoricoFechamentos } from '@/components/historico/HistoricoFechamentos';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Configuracoes() {
  const { resetTour, hasSeenTour } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleResetTour = () => {
    resetTour();
    localStorage.removeItem('rh_initial_setup_completed');
    toast.success('Tour e configuração inicial reiniciados! Atualize a página para começar.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Personalize o sistema de RH para sua empresa</p>
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Settings className="h-4 w-4 mr-2" />
          Sistema
        </Badge>
      </div>

      <Tabs defaultValue="rh" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rh">Configurações RH</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        {/* Tab: Configurações de RH */}
        <TabsContent value="rh">
          <ConfiguracoesRH />
        </TabsContent>

        {/* Tab: Aparência */}
        <TabsContent value="aparencia">
          <AppearanceCustomizer />
        </TabsContent>

        {/* Tab: Histórico de Fechamentos */}
        <TabsContent value="historico">
          <HistoricoFechamentos />
        </TabsContent>

        {/* Tab: Sistema */}
        <TabsContent value="sistema" className="space-y-6">
          {/* Card de Gestão de Usuários - APENAS super_admin */}
          {user?.role === 'super_admin' && (
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

          {/* Onboarding Card */}
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Tour e Configuração Inicial
              </CardTitle>
              <CardDescription>
                Reveja o tour guiado e a configuração inicial do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Status do Onboarding</p>
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
                Reiniciar Tour e Configuração Inicial
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Após reiniciar, atualize a página para ver o assistente novamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
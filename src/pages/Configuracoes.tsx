import { Settings, Palette, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppearanceCustomizer } from '@/components/AppearanceCustomizer';
import { ConfiguracoesRH } from '@/components/configuracoes/ConfiguracoesRH';
import { useAuth } from '@/contexts/AuthContext';

export default function Configuracoes() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Personalize o sistema e regras de negócio</p>
        </div>
      </div>

      <Tabs defaultValue="aparencia">
        <TabsList>
          <TabsTrigger value="aparencia" className="gap-2">
            <Palette className="h-4 w-4" />
            Aparência
          </TabsTrigger>
          <TabsTrigger value="rh" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Regras RH & Tributos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Tema e Cores
              </CardTitle>
              <CardDescription>
                Escolha as cores que combinam com sua empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceCustomizer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rh">
          <ConfiguracoesRH />
        </TabsContent>
      </Tabs>
    </div>
  );
}
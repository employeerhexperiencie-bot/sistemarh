import { Settings, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppearanceCustomizer } from '@/components/AppearanceCustomizer';
import { useAuth } from '@/contexts/AuthContext';

export default function Configuracoes() {
  const { user } = useAuth();
  
  // Cliente vê apenas personalização visual
  // Super admin vê configurações completas em rotas separadas
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Personalize a aparência do sistema</p>
        </div>
        <Badge variant="outline" className="bg-accent/10">
          <Palette className="h-4 w-4 mr-2" />
          Aparência
        </Badge>
      </div>

      {/* Apenas customização de aparência para o cliente */}
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
    </div>
  );
}
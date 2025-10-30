import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearance } from '@/contexts/AppearanceContext';
import { Palette, Image as ImageIcon, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const presetColors = [
  { name: 'Padrão', value: 'hsl(var(--background))' },
  { name: 'Azul Suave', value: 'linear-gradient(135deg, hsl(220, 70%, 97%) 0%, hsl(210, 60%, 95%) 100%)' },
  { name: 'Rosa RH', value: 'linear-gradient(135deg, hsl(340, 60%, 97%) 0%, hsl(210, 70%, 97%) 100%)' },
  { name: 'Menta', value: 'linear-gradient(135deg, hsl(160, 60%, 97%) 0%, hsl(180, 50%, 95%) 100%)' },
  { name: 'Lavanda', value: 'linear-gradient(135deg, hsl(270, 50%, 97%) 0%, hsl(240, 60%, 96%) 100%)' },
  { name: 'Pêssego', value: 'linear-gradient(135deg, hsl(20, 70%, 97%) 0%, hsl(40, 60%, 95%) 100%)' },
];

const presetImages = [
  { name: 'Padrão Sutil', url: 'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E' },
  { name: 'Ondas', url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Cg fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath opacity=".5" d="M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z"/%3E%3Cpath d="M6 5V0H5v5H0v1h5v94h1V6h94V5H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E' },
];

export function AppearanceCustomizer() {
  const { config, updateBackground } = useAppearance();
  const { toast } = useToast();
  const [customColor, setCustomColor] = useState('#f0f4f8');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleSaveCustomColor = () => {
    updateBackground('color', customColor);
    toast({
      title: 'Cor aplicada',
      description: 'A cor de fundo personalizada foi aplicada com sucesso.',
    });
  };

  const handleSaveCustomImage = () => {
    if (!customImageUrl) {
      toast({
        title: 'URL inválida',
        description: 'Por favor, insira uma URL válida para a imagem.',
        variant: 'destructive',
      });
      return;
    }
    updateBackground('image', customImageUrl);
    toast({
      title: 'Imagem aplicada',
      description: 'A imagem de fundo foi aplicada com sucesso.',
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Personalização Visual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="color">Cores</TabsTrigger>
            <TabsTrigger value="image">Imagens</TabsTrigger>
          </TabsList>
          
          <TabsContent value="color" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Presets de Cores</Label>
              <div className="grid grid-cols-2 gap-2">
                {presetColors.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-20 relative overflow-hidden"
                    style={{ background: preset.value }}
                    onClick={() => {
                      updateBackground('color', preset.value);
                      toast({
                        title: 'Tema aplicado',
                        description: `Tema "${preset.name}" foi aplicado com sucesso.`,
                      });
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm text-sm font-medium">
                      {preset.name}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="customColor">Cor Personalizada</Label>
              <div className="flex gap-2">
                <Input
                  id="customColor"
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#f0f4f8"
                  className="flex-1"
                />
                <Button onClick={handleSaveCustomColor} size="icon">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Padrões Sutis</Label>
              <div className="grid grid-cols-2 gap-2">
                {presetImages.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    className="h-20 relative overflow-hidden"
                    style={{ 
                      backgroundImage: `url("${preset.url}")`,
                      backgroundRepeat: 'repeat',
                    }}
                    onClick={() => {
                      updateBackground('image', preset.url);
                      toast({
                        title: 'Padrão aplicado',
                        description: `Padrão "${preset.name}" foi aplicado com sucesso.`,
                      });
                    }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm text-sm font-medium">
                      {preset.name}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="customImage">
                <ImageIcon className="h-4 w-4 inline mr-1" />
                URL da Imagem Personalizada
              </Label>
              <div className="flex gap-2">
                <Input
                  id="customImage"
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="flex-1"
                />
                <Button onClick={handleSaveCustomImage} size="icon">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dica: Use imagens sutis ou padrões para não prejudicar a legibilidade
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

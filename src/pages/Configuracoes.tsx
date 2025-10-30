import { useState } from 'react';
import { Settings, Save, Users, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppearanceCustomizer } from '@/components/AppearanceCustomizer';

const mockLojas = [
  { id: 'BROOKLIN', nome: 'Brooklin', telefone: '(11) 99999-1111', email: 'brooklin@empresa.com' },
  { id: 'TATUAPE', nome: 'Tatuapé', telefone: '(11) 99999-2222', email: 'tatuape@empresa.com' },
  { id: 'VILA_MADALENA', nome: 'Vila Madalena', telefone: '(11) 99999-3333', email: 'vilamadalena@empresa.com' },
];

export default function Configuracoes() {
  const [novaLoja, setNovaLoja] = useState({
    id: '',
    nome: '',
    telefone: '',
    email: '',
  });

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
          <AppearanceCustomizer />
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestão de Lojas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLojas.map((loja, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{loja.id}</TableCell>
                      <TableCell className="font-medium">{loja.nome}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {loja.telefone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {loja.email}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
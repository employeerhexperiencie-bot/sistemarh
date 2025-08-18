import { useState } from 'react';
import { Settings, Save, Users, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useN8NAction } from '@/hooks/useN8NAction';

const mockLojas = [
  { id: 'BROOKLIN', nome: 'Brooklin', telefone: '(11) 99999-1111', email: 'brooklin@empresa.com' },
  { id: 'TATUAPE', nome: 'Tatuapé', telefone: '(11) 99999-2222', email: 'tatuape@empresa.com' },
  { id: 'VILA_MADALENA', nome: 'Vila Madalena', telefone: '(11) 99999-3333', email: 'vilamadalena@empresa.com' },
];

export default function Configuracoes() {
  const [config, setConfig] = useState({
    faltasMode: 'NAO_CALCULA' as 'NAO_CALCULA' | 'CALCULA',
    dsrAtivo: false,
    webhookToken: '',
    webhookBase: '',
  });

  const [novaLoja, setNovaLoja] = useState({
    id: '',
    nome: '',
    telefone: '',
    email: '',
  });

  const { execute, loading } = useN8NAction();

  const handleSaveConfig = async () => {
    // Simular salvamento das configurações
    console.log('Salvando configurações:', config);
    
    // Em uma implementação real, isso seria enviado para o n8n
    await execute('config_save', config, {
      successMessage: 'Configurações salvas com sucesso',
    });
  };

  const handleAddLoja = () => {
    if (!novaLoja.id || !novaLoja.nome) return;
    
    // Simular adição de nova loja
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
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Faltas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faltasMode">Modo de Cálculo de Faltas</Label>
                <Select 
                  value={config.faltasMode} 
                  onValueChange={(value: 'NAO_CALCULA' | 'CALCULA') => 
                    setConfig(prev => ({ ...prev, faltasMode: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NAO_CALCULA">NÃO_CALCULA - Apenas registra</SelectItem>
                    <SelectItem value="CALCULA">CALCULA - Desconta 1/30 do salário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="dsrAtivo"
                  checked={config.dsrAtivo}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, dsrAtivo: checked }))
                  }
                />
                <Label htmlFor="dsrAtivo">DSR Ativo (desconto adicional em faltas injustificadas)</Label>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                <h4 className="font-medium mb-2">Como funciona:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li><strong>NÃO_CALCULA:</strong> Faltas injustificadas são apenas registradas</li>
                  <li><strong>CALCULA:</strong> Desconta 1/30 do salário base</li>
                  <li><strong>DSR Ativo:</strong> Adiciona desconto proporcional do DSR</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Configurações de API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookBase">URL Base do N8N</Label>
                <Input
                  id="webhookBase"
                  placeholder="https://n8n.suaempresa.com/webhook"
                  value={config.webhookBase}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookBase: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookToken">Token de Autenticação</Label>
                <Input
                  id="webhookToken"
                  type="password"
                  placeholder="Bearer token para autenticação"
                  value={config.webhookToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookToken: e.target.value }))}
                />
              </div>

              <Button onClick={handleSaveConfig} disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </CardContent>
          </Card>
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
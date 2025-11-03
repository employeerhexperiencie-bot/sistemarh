import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/FileUploader';
import { EntradaEstoqueEPI } from '@/components/EntradaEstoqueEPI';
import { ShoppingCart, Package, Truck, FileText, Plus, Eye, CheckCircle, AlertTriangle, Building2 } from 'lucide-react';
import { useN8NAction } from '@/hooks/useN8NAction';

interface EPIStock {
  id: string;
  nome: string;
  categoria: string;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  valorUnitario: string;
  fornecedor: string;
}

interface EPIRequest {
  id: string;
  solicitante: string;
  loja: string;
  itens: { nome: string; quantidade: number }[];
  status: 'PENDENTE' | 'APROVADO' | 'SEPARADO' | 'ENTREGUE';
  dataSolicitacao: string;
  observacao?: string;
}

interface EPIDelivery {
  id: string;
  matricula: string;
  nome: string;
  loja: string;
  item: string;
  quantidade: number;
  dataEntrega: string;
  termoAssinado: boolean;
  fileId?: string;
}

export default function GestaoEPI() {
  const [activeTab, setActiveTab] = useState('estoque');
  
  // Estados do Estoque
  const [epiStock, setEpiStock] = useState<EPIStock[]>([
    {
      id: '1',
      nome: 'Uniforme Completo',
      categoria: 'Vestuário',
      quantidadeTotal: 100,
      quantidadeDisponivel: 45,
      valorUnitario: 'R$ 85,00',
      fornecedor: 'Fornecedor A'
    },
    {
      id: '2',
      nome: 'Touca Descartável',
      categoria: 'Proteção',
      quantidadeTotal: 500,
      quantidadeDisponivel: 320,
      valorUnitario: 'R$ 2,50',
      fornecedor: 'Fornecedor B'
    }
  ]);

  // Estados dos Pedidos
  const [epiRequests, setEpiRequests] = useState<EPIRequest[]>([
    {
      id: 'REQ001',
      solicitante: 'Gerente Centro',
      loja: 'CENTRO',
      itens: [{ nome: 'Uniforme Completo', quantidade: 5 }],
      status: 'PENDENTE',
      dataSolicitacao: '2025-08-29'
    }
  ]);

  // Estados das Entregas
  const [epiDeliveries, setEpiDeliveries] = useState<EPIDelivery[]>([
    {
      id: 'ENT001',
      matricula: '001',
      nome: 'João Silva',
      loja: 'CENTRO',
      item: 'Uniforme Completo',
      quantidade: 2,
      dataEntrega: '2025-08-25',
      termoAssinado: true
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'stock' | 'request' | 'delivery'>('stock');

  const { execute, loading } = useN8NAction();

  const openDialog = (type: 'stock' | 'request' | 'delivery') => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'APROVADO':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Aprovado</Badge>;
      case 'SEPARADO':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Separado</Badge>;
      case 'ENTREGUE':
        return <Badge className="bg-success/10 text-success border-success/20">Entregue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoriaColor = (categoria: string) => {
    switch (categoria) {
      case 'Vestuário':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Proteção':
        return 'bg-accent/10 text-accent border-accent/20';
      default:
        return 'bg-secondary/10 text-secondary border-secondary/20';
    }
  };

  const totalItens = epiStock.reduce((acc, item) => acc + item.quantidadeTotal, 0);
  const totalDisponivel = epiStock.reduce((acc, item) => acc + item.quantidadeDisponivel, 0);
  const pedidosPendentes = epiRequests.filter(req => req.status === 'PENDENTE').length;
  const entregasRecentes = epiDeliveries.filter(delivery => {
    const deliveryDate = new Date(delivery.dataEntrega);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return deliveryDate >= thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Uniformes e EPIs</h1>
          <p className="text-muted-foreground">Controle de estoque, pedidos e entregas via WhatsApp</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{totalItens}</p>
                <p className="text-sm text-muted-foreground">Total em estoque</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{totalDisponivel}</p>
                <p className="text-sm text-muted-foreground">Disponível</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{pedidosPendentes}</p>
                <p className="text-sm text-muted-foreground">Pedidos pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Truck className="h-8 w-8 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{entregasRecentes}</p>
                <p className="text-sm text-muted-foreground">Entregas (30 dias)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="estoque" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="entradas" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Entrada de Produtos
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="entregas" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Entregas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estoque">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Controle de Estoque</CardTitle>
              <Button onClick={() => openDialog('stock')}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Disponível</TableHead>
                    <TableHead>Valor Unit.</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epiStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>
                        <Badge className={getCategoriaColor(item.categoria)}>
                          {item.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.quantidadeTotal}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={item.quantidadeDisponivel < item.quantidadeTotal * 0.2 ? 'text-destructive' : ''}>
                            {item.quantidadeDisponivel}
                          </span>
                          {item.quantidadeDisponivel < item.quantidadeTotal * 0.2 && (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.valorUnitario}</TableCell>
                      <TableCell>{item.fornecedor}</TableCell>
                      <TableCell>
                        {item.quantidadeDisponivel === 0 ? (
                          <Badge variant="destructive">Esgotado</Badge>
                        ) : item.quantidadeDisponivel < item.quantidadeTotal * 0.2 ? (
                          <Badge className="bg-warning/10 text-warning border-warning/20">Baixo</Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success border-success/20">Disponível</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas">
          <EntradaEstoqueEPI />
        </TabsContent>

        <TabsContent value="pedidos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pedidos via WhatsApp</CardTitle>
              <Button onClick={() => openDialog('request')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epiRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-mono">{request.id}</TableCell>
                      <TableCell>{request.solicitante}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-accent/10">
                          <Building2 className="h-3 w-3 mr-1" />
                          {request.loja}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.itens.map((item, index) => (
                            <div key={index}>
                              {item.nome} ({item.quantidade}x)
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(request.dataSolicitacao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'PENDENTE' && (
                            <Button size="sm" variant="ghost">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Registro de Entregas</CardTitle>
              <Button onClick={() => openDialog('delivery')}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Entrega
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead>Termo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {epiDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-mono">{delivery.matricula}</TableCell>
                      <TableCell className="font-medium">{delivery.nome}</TableCell>
                      <TableCell>{delivery.loja}</TableCell>
                      <TableCell>{delivery.item}</TableCell>
                      <TableCell>{delivery.quantidade}</TableCell>
                      <TableCell>{new Date(delivery.dataEntrega).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        {delivery.termoAssinado ? (
                          <Badge className="bg-success/10 text-success border-success/20">Assinado</Badge>
                        ) : (
                          <Badge variant="destructive">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {!delivery.termoAssinado && (
                            <Button size="sm" variant="ghost">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'stock' && 'Adicionar Item ao Estoque'}
              {dialogType === 'request' && 'Novo Pedido de EPI'}
              {dialogType === 'delivery' && 'Registrar Entrega'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === 'stock' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Item</Label>
                <Input placeholder="Ex: Uniforme Completo" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input placeholder="Ex: Vestuário" />
              </div>
              <div className="space-y-2">
                <Label>Quantidade Total</Label>
                <Input type="number" placeholder="100" />
              </div>
              <div className="space-y-2">
                <Label>Valor Unitário</Label>
                <Input placeholder="R$ 0,00" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Fornecedor</Label>
                <Input placeholder="Nome do fornecedor" />
              </div>
            </div>
          )}

          {dialogType === 'request' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loja *</Label>
                  <Input placeholder="CENTRO" required />
                </div>
                <div className="space-y-2">
                  <Label>Matrícula do Profissional *</Label>
                  <Input placeholder="001" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome do Profissional *</Label>
                <Input placeholder="João Silva" required />
              </div>
              <div className="space-y-2">
                <Label>Item Solicitado *</Label>
                <Input placeholder="Uniforme Completo" required />
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" placeholder="2" required />
              </div>
              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea placeholder="Detalhes adicionais do pedido" rows={3} />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Pedido
                </Button>
              </div>
            </div>
          )}

          {dialogType === 'delivery' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Matrícula *</Label>
                  <Input placeholder="001" required />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Profissional *</Label>
                  <Input placeholder="João Silva" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Loja *</Label>
                <Input placeholder="CENTRO" required />
              </div>
              <div className="space-y-2">
                <Label>Item Entregue *</Label>
                <Input placeholder="Uniforme Completo" required />
              </div>
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input type="number" placeholder="1" required />
              </div>
              <div className="space-y-2">
                <Label>Data da Entrega *</Label>
                <Input type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Termo de Responsabilidade Assinado</Label>
                <FileUploader onFileUploaded={() => {}} />
                <p className="text-xs text-muted-foreground">
                  Upload do termo de responsabilidade assinado pelo profissional
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Registrar Entrega
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
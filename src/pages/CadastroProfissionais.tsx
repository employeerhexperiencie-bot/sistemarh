import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit, Trash2, Users, UserCheck, UserX, Building2, FileText, Folder, Car, Briefcase, Heart, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { DocumentUploader } from '@/components/DocumentUploader';
import { ValesManager } from '@/components/ValesManager';
import { ValeTransporteManager } from '@/components/ValeTransporteManager';
import { formatCurrency, parseCurrencyToCentavos } from '@/lib/utils';

interface Professional {
  id: string;
  matricula: string;
  nome: string;
  cpf?: string;
  rg?: string;
  loja_id?: string;
  loja?: { nome: string };
  cargo?: string;
  salario: number;
  status: 'ativo' | 'demitido' | 'afastado';
  data_admissao?: string;
  data_demissao?: string;
  created_at: string;
}

interface Loja {
  id: string;
  nome: string;
}

// FormData completo baseado na ficha cadastral
interface FormDataCompleto {
  // Dados Pessoais
  matricula: string;
  nome: string;
  cpf: string;
  rg: string;
  rg_data_emissao: string;
  ctps: string;
  ctps_digital: boolean;
  ctps_data_emissao: string;
  pis: string;
  data_nascimento: string;
  sexo: string;
  estado_civil: string;
  cor: string;
  escolaridade: string;
  nome_mae: string;
  nome_pai: string;
  titulo_eleitoral: string;
  apelido: string;
  
  // Endereço
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  celular: string;
  
  // CNH
  cnh_numero: string;
  cnh_categoria: string;
  cnh_validade: string;
  cnh_primeira_habilitacao: string;
  
  // Dados Profissionais
  loja_id: string;
  departamento: string;
  setor: string;
  cargo: string;
  funcao: string;
  registro_ctps: string;
  data_admissao: string;
  numero_seguro: string;
  numero_registro: string;
  cbo: string;
  registrado_na_loja: string;
  registrado_em: string;
  cracha_numero: string;
  condutor: boolean;
  
  // Benefícios
  recebe_cesta: boolean;
  entrega_cesta_loja: string;
  vale_transporte: boolean;
  vale_carne: boolean;
  vale_refeicao: boolean;
  sindicato: string;
  pensao_alimenticia: boolean;
  
  // Salários
  primeiro_salario: string;
  ultimo_salario: string;
  salario_nominal: string;
  segundo_sabado: string;
  sem_registro_jornada: boolean;
  
  // Contratação
  motivo_contratacao: string;
  
  // Demissão
  status: 'ativo' | 'demitido' | 'afastado';
  data_demissao: string;
  motivo_demissao: string;
  aviso_trabalhado: boolean;
  homologacao: string;
  data_homologacao: string;
  local_homologacao: string;
  realizado_por: string;
  arquivado_em: string;
  aviso_previo_de: string;
  opcao_aviso: string;
  data_cumprir_aviso: string;
  acordo: boolean;
  
  // Férias
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  gozo_ferias_inicio: string;
  gozo_ferias_fim: string;
  ferias_contabil_inicio: string;
  ferias_contabil_fim: string;
  data_prog_ferias_inicio: string;
  data_prog_ferias_fim: string;
  retorno_loja: string;
  
  // Afastamento
  tipo_afastamento: string;
  afastamento_inicio: string;
  termino_beneficio: string;
  data_udt: string;
  alta_medica: string;
  
  // Observações
  observacoes: string;
  
  // Campo legado
  valor_rota_diaria: string;
}

const initialFormData: FormDataCompleto = {
  matricula: '',
  nome: '',
  cpf: '',
  rg: '',
  rg_data_emissao: '',
  ctps: '',
  ctps_digital: false,
  ctps_data_emissao: '',
  pis: '',
  data_nascimento: '',
  sexo: '',
  estado_civil: '',
  cor: '',
  escolaridade: '',
  nome_mae: '',
  nome_pai: '',
  titulo_eleitoral: '',
  apelido: '',
  endereco: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  telefone: '',
  celular: '',
  cnh_numero: '',
  cnh_categoria: '',
  cnh_validade: '',
  cnh_primeira_habilitacao: '',
  loja_id: '',
  departamento: '',
  setor: '',
  cargo: '',
  funcao: '',
  registro_ctps: '',
  data_admissao: '',
  numero_seguro: '',
  numero_registro: '',
  cbo: '',
  registrado_na_loja: '',
  registrado_em: '',
  cracha_numero: '',
  condutor: false,
  recebe_cesta: false,
  entrega_cesta_loja: '',
  vale_transporte: false,
  vale_carne: false,
  vale_refeicao: false,
  sindicato: '',
  pensao_alimenticia: false,
  primeiro_salario: '',
  ultimo_salario: '',
  salario_nominal: '',
  segundo_sabado: '',
  sem_registro_jornada: false,
  motivo_contratacao: '',
  status: 'ativo',
  data_demissao: '',
  motivo_demissao: '',
  aviso_trabalhado: false,
  homologacao: '',
  data_homologacao: '',
  local_homologacao: '',
  realizado_por: '',
  arquivado_em: '',
  aviso_previo_de: '',
  opcao_aviso: '',
  data_cumprir_aviso: '',
  acordo: false,
  periodo_aquisitivo_inicio: '',
  periodo_aquisitivo_fim: '',
  gozo_ferias_inicio: '',
  gozo_ferias_fim: '',
  ferias_contabil_inicio: '',
  ferias_contabil_fim: '',
  data_prog_ferias_inicio: '',
  data_prog_ferias_fim: '',
  retorno_loja: '',
  tipo_afastamento: '',
  afastamento_inicio: '',
  termino_beneficio: '',
  data_udt: '',
  alta_medica: '',
  observacoes: '',
  valor_rota_diaria: '',
};

export const CadastroProfissionais: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dados');
  const [formData, setFormData] = useState<FormDataCompleto>(initialFormData);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select(`
          *,
          loja:lojas(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfessionals((data || []) as Professional[]);
    } catch (error) {
      console.error('Load professionals error:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar profissionais",
        variant: "destructive"
      });
    }
  };

  const loadLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Load lojas error:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.matricula) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios (Nome e Matrícula)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Dados principais para salvar no banco (campos existentes)
      const professionalData = {
        matricula: formData.matricula,
        nome: formData.nome,
        cpf: formData.cpf || null,
        rg: formData.rg || null,
        loja_id: formData.loja_id || null,
        cargo: formData.cargo || null,
        salario: parseCurrencyToCentavos(formData.salario_nominal || formData.primeiro_salario),
        status: formData.status,
        data_admissao: formData.data_admissao || null,
        data_demissao: formData.data_demissao || null,
      };

      if (editingProfessional) {
        const { error } = await supabase
          .from('profissionais')
          .update(professionalData)
          .eq('id', editingProfessional.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Profissional atualizado com sucesso"
        });
      } else {
        const { error } = await supabase
          .from('profissionais')
          .insert([professionalData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Profissional cadastrado com sucesso"
        });
      }

      handleCloseDialog();
      loadProfessionals();
    } catch (error) {
      console.error('Save professional error:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar profissional",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (professional: Professional) => {
    setEditingProfessional(professional);
    setFormData({
      ...initialFormData,
      matricula: professional.matricula,
      nome: professional.nome,
      cpf: professional.cpf || '',
      rg: professional.rg || '',
      loja_id: professional.loja_id || '',
      cargo: professional.cargo || '',
      salario_nominal: formatCurrency((professional.salario || 0).toString()),
      status: professional.status as 'ativo' | 'demitido' | 'afastado',
      data_admissao: professional.data_admissao || '',
      data_demissao: professional.data_demissao || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;

    try {
      const { error } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Profissional excluído com sucesso"
      });

      loadProfessionals();
    } catch (error) {
      console.error('Delete professional error:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir profissional",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessional(null);
    setFormData(initialFormData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-success/10 text-success border-success/20">Ativo</Badge>;
      case 'demitido':
        return <Badge variant="destructive">Demitido</Badge>;
      case 'afastado':
        return <Badge variant="secondary">Afastado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  useEffect(() => {
    loadProfessionals();
    loadLojas();
  }, []);

  const activeProfessionals = professionals.filter(p => p.status === 'ativo');
  const dismissedProfessionals = professionals.filter(p => p.status === 'demitido');
  const uniqueStores = new Set(professionals.map(p => p.loja?.nome).filter(Boolean)).size;

  // View de pasta do profissional
  if (selectedProfessionalId) {
    const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);
    return (
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Pasta do Profissional</h1>
            <p className="text-muted-foreground">
              {selectedProfessional?.nome} - {selectedProfessional?.matricula}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedProfessionalId(null)}>
            Voltar à Lista
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
            <TabsTrigger value="dados" className="text-xs sm:text-sm py-2">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs sm:text-sm py-2">Documentos</TabsTrigger>
            <TabsTrigger value="vales" className="text-xs sm:text-sm py-2">Vales</TabsTrigger>
            <TabsTrigger value="transporte" className="text-xs sm:text-sm py-2">VT</TabsTrigger>
            <TabsTrigger value="epi" className="text-xs sm:text-sm py-2">EPI</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome Completo</Label>
                  <p className="font-medium">{selectedProfessional?.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Matrícula</Label>
                  <p className="font-medium font-mono">{selectedProfessional?.matricula}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">CPF</Label>
                  <p className="font-medium">{selectedProfessional?.cpf || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">RG</Label>
                  <p className="font-medium">{selectedProfessional?.rg || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Loja</Label>
                  <p className="font-medium">{selectedProfessional?.loja?.nome || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cargo</Label>
                  <p className="font-medium">{selectedProfessional?.cargo || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Salário</Label>
                  <p className="font-medium">
                    {formatCurrency((selectedProfessional?.salario || 0).toString())}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedProfessional?.status || '')}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data de Admissão</Label>
                  <p className="font-medium">
                    {selectedProfessional?.data_admissao 
                      ? new Date(selectedProfessional.data_admissao).toLocaleDateString('pt-BR')
                      : '-'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <DocumentUploader
              bucket="professional-documents"
              folder="profissionais"
              entityId={selectedProfessionalId}
              entityType="professional"
            />
          </TabsContent>

          <TabsContent value="vales">
            <ValesManager 
              professionalId={selectedProfessionalId}
              professionalName={selectedProfessional?.nome || ''}
            />
          </TabsContent>

          <TabsContent value="transporte">
            <ValeTransporteManager
              profissionalId={selectedProfessionalId}
              valorRotaDiaria={1250}
            />
          </TabsContent>

          <TabsContent value="epi">
            <Card>
              <CardHeader>
                <CardTitle>Controle de EPI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema de controle de EPI em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // View principal - Lista de profissionais
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Cadastro de Profissionais</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Gerencie colaboradores e seus documentos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProfessional(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>
                {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </DialogTitle>
              <DialogDescription>
                {editingProfessional ? 'Atualize as informações do profissional' : 'Preencha a ficha cadastral completa'}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[calc(95vh-180px)]">
              <div className="p-6 pt-4">
                <Tabs defaultValue="pessoais" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto mb-4">
                    <TabsTrigger value="pessoais" className="text-xs py-2">Pessoais</TabsTrigger>
                    <TabsTrigger value="endereco" className="text-xs py-2">Endereço</TabsTrigger>
                    <TabsTrigger value="profissionais" className="text-xs py-2">Profissional</TabsTrigger>
                    <TabsTrigger value="salarios" className="text-xs py-2">Salários</TabsTrigger>
                    <TabsTrigger value="beneficios" className="text-xs py-2">Benefícios</TabsTrigger>
                    <TabsTrigger value="cnh" className="text-xs py-2">CNH</TabsTrigger>
                    <TabsTrigger value="demissao" className="text-xs py-2">Demissão</TabsTrigger>
                  </TabsList>

                  {/* DADOS PESSOAIS */}
                  <TabsContent value="pessoais" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="matricula">Matrícula *</Label>
                        <Input
                          id="matricula"
                          value={formData.matricula}
                          onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                          placeholder="001"
                          disabled={!!editingProfessional}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          placeholder="Nome completo do profissional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apelido">Apelido</Label>
                        <Input
                          id="apelido"
                          value={formData.apelido}
                          onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rg">RG</Label>
                        <Input
                          id="rg"
                          value={formData.rg}
                          onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                          placeholder="00.000.000-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rg_data_emissao">Data Emissão RG</Label>
                        <Input
                          id="rg_data_emissao"
                          type="date"
                          value={formData.rg_data_emissao}
                          onChange={(e) => setFormData({ ...formData, rg_data_emissao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                        <Input
                          id="data_nascimento"
                          type="date"
                          value={formData.data_nascimento}
                          onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sexo">Sexo</Label>
                        <Select value={formData.sexo} onValueChange={(value) => setFormData({ ...formData, sexo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado_civil">Estado Civil</Label>
                        <Select value={formData.estado_civil} onValueChange={(value) => setFormData({ ...formData, estado_civil: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                            <SelectItem value="casado">Casado(a)</SelectItem>
                            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                            <SelectItem value="uniao_estavel">União Estável</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cor">Cor/Raça</Label>
                        <Select value={formData.cor} onValueChange={(value) => setFormData({ ...formData, cor: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="branca">Branca</SelectItem>
                            <SelectItem value="preta">Preta</SelectItem>
                            <SelectItem value="parda">Parda</SelectItem>
                            <SelectItem value="amarela">Amarela</SelectItem>
                            <SelectItem value="indigena">Indígena</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="escolaridade">Escolaridade</Label>
                        <Select value={formData.escolaridade} onValueChange={(value) => setFormData({ ...formData, escolaridade: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fundamental_incompleto">Fundamental Incompleto</SelectItem>
                            <SelectItem value="fundamental_completo">Fundamental Completo</SelectItem>
                            <SelectItem value="medio_incompleto">Médio Incompleto</SelectItem>
                            <SelectItem value="medio_completo">Médio Completo</SelectItem>
                            <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                            <SelectItem value="superior_completo">Superior Completo</SelectItem>
                            <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="nome_mae">Nome da Mãe</Label>
                        <Input
                          id="nome_mae"
                          value={formData.nome_mae}
                          onChange={(e) => setFormData({ ...formData, nome_mae: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <Label htmlFor="nome_pai">Nome do Pai</Label>
                        <Input
                          id="nome_pai"
                          value={formData.nome_pai}
                          onChange={(e) => setFormData({ ...formData, nome_pai: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="titulo_eleitoral">Título Eleitoral</Label>
                        <Input
                          id="titulo_eleitoral"
                          value={formData.titulo_eleitoral}
                          onChange={(e) => setFormData({ ...formData, titulo_eleitoral: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ctps">CTPS</Label>
                        <Input
                          id="ctps"
                          value={formData.ctps}
                          onChange={(e) => setFormData({ ...formData, ctps: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ctps_data_emissao">Data Emissão CTPS</Label>
                        <Input
                          id="ctps_data_emissao"
                          type="date"
                          value={formData.ctps_data_emissao}
                          onChange={(e) => setFormData({ ...formData, ctps_data_emissao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 flex items-end gap-2">
                        <div className="flex items-center gap-2 h-10">
                          <Checkbox
                            id="ctps_digital"
                            checked={formData.ctps_digital}
                            onCheckedChange={(checked) => setFormData({ ...formData, ctps_digital: checked as boolean })}
                          />
                          <Label htmlFor="ctps_digital" className="text-sm">CTPS Digital</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pis">PIS</Label>
                        <Input
                          id="pis"
                          value={formData.pis}
                          onChange={(e) => setFormData({ ...formData, pis: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ENDEREÇO */}
                  <TabsContent value="endereco" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2 col-span-full sm:col-span-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Input
                          id="endereco"
                          value={formData.endereco}
                          onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                          placeholder="Rua, número, complemento"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bairro">Bairro</Label>
                        <Input
                          id="bairro"
                          value={formData.bairro}
                          onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cidade">Cidade</Label>
                        <Input
                          id="cidade"
                          value={formData.cidade}
                          onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cep">CEP</Label>
                        <Input
                          id="cep"
                          value={formData.cep}
                          onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          value={formData.telefone}
                          onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="celular">Celular</Label>
                        <Input
                          id="celular"
                          value={formData.celular}
                          onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* DADOS PROFISSIONAIS */}
                  <TabsContent value="profissionais" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="loja">Loja</Label>
                        <Select value={formData.loja_id} onValueChange={(value) => setFormData({ ...formData, loja_id: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a loja" />
                          </SelectTrigger>
                          <SelectContent>
                            {lojas.map((loja) => (
                              <SelectItem key={loja.id} value={loja.id}>
                                {loja.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departamento">Departamento</Label>
                        <Input
                          id="departamento"
                          value={formData.departamento}
                          onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="setor">Setor</Label>
                        <Input
                          id="setor"
                          value={formData.setor}
                          onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo</Label>
                        <Input
                          id="cargo"
                          value={formData.cargo}
                          onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="funcao">Função</Label>
                        <Input
                          id="funcao"
                          value={formData.funcao}
                          onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registro_ctps">Registro CTPS</Label>
                        <Input
                          id="registro_ctps"
                          value={formData.registro_ctps}
                          onChange={(e) => setFormData({ ...formData, registro_ctps: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_admissao">Data de Admissão</Label>
                        <Input
                          id="data_admissao"
                          type="date"
                          value={formData.data_admissao}
                          onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cbo">CBO</Label>
                        <Input
                          id="cbo"
                          value={formData.cbo}
                          onChange={(e) => setFormData({ ...formData, cbo: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero_seguro">Nº Seguro</Label>
                        <Input
                          id="numero_seguro"
                          value={formData.numero_seguro}
                          onChange={(e) => setFormData({ ...formData, numero_seguro: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero_registro">Nº Registro</Label>
                        <Input
                          id="numero_registro"
                          value={formData.numero_registro}
                          onChange={(e) => setFormData({ ...formData, numero_registro: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registrado_na_loja">Registrado na Loja</Label>
                        <Input
                          id="registrado_na_loja"
                          value={formData.registrado_na_loja}
                          onChange={(e) => setFormData({ ...formData, registrado_na_loja: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="registrado_em">Registrado em</Label>
                        <Input
                          id="registrado_em"
                          type="date"
                          value={formData.registrado_em}
                          onChange={(e) => setFormData({ ...formData, registrado_em: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cracha_numero">Crachá Nº</Label>
                        <Input
                          id="cracha_numero"
                          value={formData.cracha_numero}
                          onChange={(e) => setFormData({ ...formData, cracha_numero: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="motivo_contratacao">Motivo Contratação</Label>
                        <Select value={formData.motivo_contratacao} onValueChange={(value) => setFormData({ ...formData, motivo_contratacao: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aumento_quadro">Aumento de Quadro</SelectItem>
                            <SelectItem value="substituicao">Substituição</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 flex items-end">
                        <div className="flex items-center gap-2 h-10">
                          <Checkbox
                            id="condutor"
                            checked={formData.condutor}
                            onCheckedChange={(checked) => setFormData({ ...formData, condutor: checked as boolean })}
                          />
                          <Label htmlFor="condutor" className="text-sm">Condutor</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="demitido">Demitido</SelectItem>
                            <SelectItem value="afastado">Afastado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* SALÁRIOS */}
                  <TabsContent value="salarios" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primeiro_salario">Primeiro Salário</Label>
                        <Input
                          id="primeiro_salario"
                          value={formData.primeiro_salario}
                          onChange={(e) => setFormData({ ...formData, primeiro_salario: formatCurrency(e.target.value) })}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ultimo_salario">Último Salário</Label>
                        <Input
                          id="ultimo_salario"
                          value={formData.ultimo_salario}
                          onChange={(e) => setFormData({ ...formData, ultimo_salario: formatCurrency(e.target.value) })}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="salario_nominal">Salário Nominal</Label>
                        <Input
                          id="salario_nominal"
                          value={formData.salario_nominal}
                          onChange={(e) => setFormData({ ...formData, salario_nominal: formatCurrency(e.target.value) })}
                          placeholder="R$ 0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="segundo_sabado">2º Sábado (Intervalo)</Label>
                        <Input
                          id="segundo_sabado"
                          value={formData.segundo_sabado}
                          onChange={(e) => setFormData({ ...formData, segundo_sabado: e.target.value })}
                          placeholder="07:30 / 30 min de intervalo / 13:45"
                        />
                      </div>
                      <div className="space-y-2 flex items-end">
                        <div className="flex items-center gap-2 h-10">
                          <Checkbox
                            id="sem_registro_jornada"
                            checked={formData.sem_registro_jornada}
                            onCheckedChange={(checked) => setFormData({ ...formData, sem_registro_jornada: checked as boolean })}
                          />
                          <Label htmlFor="sem_registro_jornada" className="text-sm">Sem Registro de Jornada</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* BENEFÍCIOS */}
                  <TabsContent value="beneficios" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-3 col-span-full">
                        <Label className="text-sm font-medium">Benefícios</Label>
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="vale_transporte"
                              checked={formData.vale_transporte}
                              onCheckedChange={(checked) => setFormData({ ...formData, vale_transporte: checked as boolean })}
                            />
                            <Label htmlFor="vale_transporte">VT - Vale Transporte</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="vale_carne"
                              checked={formData.vale_carne}
                              onCheckedChange={(checked) => setFormData({ ...formData, vale_carne: checked as boolean })}
                            />
                            <Label htmlFor="vale_carne">VC - Vale Carne</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="vale_refeicao"
                              checked={formData.vale_refeicao}
                              onCheckedChange={(checked) => setFormData({ ...formData, vale_refeicao: checked as boolean })}
                            />
                            <Label htmlFor="vale_refeicao">VR - Vale Refeição</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="recebe_cesta"
                          checked={formData.recebe_cesta}
                          onCheckedChange={(checked) => setFormData({ ...formData, recebe_cesta: checked as boolean })}
                        />
                        <Label htmlFor="recebe_cesta">Recebe Cesta</Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="entrega_cesta_loja">Entrega Cesta na Loja</Label>
                        <Input
                          id="entrega_cesta_loja"
                          value={formData.entrega_cesta_loja}
                          onChange={(e) => setFormData({ ...formData, entrega_cesta_loja: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sindicato">Sindicato</Label>
                        <Input
                          id="sindicato"
                          value={formData.sindicato}
                          onChange={(e) => setFormData({ ...formData, sindicato: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="pensao_alimenticia"
                          checked={formData.pensao_alimenticia}
                          onCheckedChange={(checked) => setFormData({ ...formData, pensao_alimenticia: checked as boolean })}
                        />
                        <Label htmlFor="pensao_alimenticia">Pensão Alimentícia</Label>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="valor_rota_diaria">Valor Diário Rota (VT)</Label>
                      <Input
                        id="valor_rota_diaria"
                        value={formData.valor_rota_diaria}
                        onChange={(e) => setFormData({ ...formData, valor_rota_diaria: formatCurrency(e.target.value) })}
                        placeholder="R$ 0,00"
                        className="max-w-xs"
                      />
                      <p className="text-xs text-muted-foreground">Valor da passagem ida + volta para cálculo de VT</p>
                    </div>
                  </TabsContent>

                  {/* CNH */}
                  <TabsContent value="cnh" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cnh_numero">CNH Nº</Label>
                        <Input
                          id="cnh_numero"
                          value={formData.cnh_numero}
                          onChange={(e) => setFormData({ ...formData, cnh_numero: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnh_categoria">Categoria</Label>
                        <Select value={formData.cnh_categoria} onValueChange={(value) => setFormData({ ...formData, cnh_categoria: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {['A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE'].map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnh_validade">Validade</Label>
                        <Input
                          id="cnh_validade"
                          type="date"
                          value={formData.cnh_validade}
                          onChange={(e) => setFormData({ ...formData, cnh_validade: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnh_primeira_habilitacao">1ª Habilitação</Label>
                        <Input
                          id="cnh_primeira_habilitacao"
                          type="date"
                          value={formData.cnh_primeira_habilitacao}
                          onChange={(e) => setFormData({ ...formData, cnh_primeira_habilitacao: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* DEMISSÃO */}
                  <TabsContent value="demissao" className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="data_demissao">Data Demissão</Label>
                        <Input
                          id="data_demissao"
                          type="date"
                          value={formData.data_demissao}
                          onChange={(e) => setFormData({ ...formData, data_demissao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="motivo_demissao">Motivo Demissão</Label>
                        <Input
                          id="motivo_demissao"
                          value={formData.motivo_demissao}
                          onChange={(e) => setFormData({ ...formData, motivo_demissao: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center gap-2 h-10">
                          <Checkbox
                            id="aviso_trabalhado"
                            checked={formData.aviso_trabalhado}
                            onCheckedChange={(checked) => setFormData({ ...formData, aviso_trabalhado: checked as boolean })}
                          />
                          <Label htmlFor="aviso_trabalhado">Aviso Trabalhado</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="homologacao">Homologação</Label>
                        <Input
                          id="homologacao"
                          value={formData.homologacao}
                          onChange={(e) => setFormData({ ...formData, homologacao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_homologacao">Data Homologação</Label>
                        <Input
                          id="data_homologacao"
                          type="date"
                          value={formData.data_homologacao}
                          onChange={(e) => setFormData({ ...formData, data_homologacao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="local_homologacao">Local</Label>
                        <Input
                          id="local_homologacao"
                          value={formData.local_homologacao}
                          onChange={(e) => setFormData({ ...formData, local_homologacao: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="realizado_por">Realizado por</Label>
                        <Input
                          id="realizado_por"
                          value={formData.realizado_por}
                          onChange={(e) => setFormData({ ...formData, realizado_por: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arquivado_em">Arquivado em</Label>
                        <Input
                          id="arquivado_em"
                          type="date"
                          value={formData.arquivado_em}
                          onChange={(e) => setFormData({ ...formData, arquivado_em: e.target.value })}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="aviso_previo_de">Aviso Prévio de</Label>
                        <Input
                          id="aviso_previo_de"
                          value={formData.aviso_previo_de}
                          onChange={(e) => setFormData({ ...formData, aviso_previo_de: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="opcao_aviso">Opção do Aviso</Label>
                        <Select value={formData.opcao_aviso} onValueChange={(value) => setFormData({ ...formData, opcao_aviso: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2_horas">2 Horas</SelectItem>
                            <SelectItem value="7_dias">7 Dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data_cumprir_aviso">Data Cumprir Aviso</Label>
                        <Input
                          id="data_cumprir_aviso"
                          type="date"
                          value={formData.data_cumprir_aviso}
                          onChange={(e) => setFormData({ ...formData, data_cumprir_aviso: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex items-center gap-2 h-10">
                          <Checkbox
                            id="acordo"
                            checked={formData.acordo}
                            onCheckedChange={(checked) => setFormData({ ...formData, acordo: checked as boolean })}
                          />
                          <Label htmlFor="acordo">Acordo</Label>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        placeholder="Observações gerais sobre o profissional..."
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 p-6 pt-0 border-t">
              <Button onClick={handleCloseDialog} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-success/5 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-success">{activeProfessionals.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-destructive">{dismissedProfessionals.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Demitidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-primary">{professionals.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
              <div className="min-w-0 flex-1">
                <p className="text-xl sm:text-2xl font-bold text-secondary">{uniqueStores}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Lojas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle>Profissionais Cadastrados</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">CPF</TableHead>
                <TableHead className="hidden md:table-cell">Loja</TableHead>
                <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                <TableHead className="hidden lg:table-cell">Salário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell className="font-mono">{professional.matricula}</TableCell>
                  <TableCell className="font-medium">{professional.nome}</TableCell>
                  <TableCell className="hidden sm:table-cell">{professional.cpf || '-'}</TableCell>
                  <TableCell className="hidden md:table-cell">{professional.loja?.nome || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{professional.cargo || '-'}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatCurrency((professional.salario || 0).toString())}
                  </TableCell>
                  <TableCell>{getStatusBadge(professional.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedProfessionalId(professional.id)}
                        title="Ver pasta"
                      >
                        <Folder className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(professional)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(professional.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {professionals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum profissional cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

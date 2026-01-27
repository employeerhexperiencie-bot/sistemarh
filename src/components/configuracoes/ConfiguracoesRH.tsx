import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, DollarSign, Clock, Bus, Utensils, ShoppingBasket, 
  Plane, Banknote, Save, AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConfiguracaoItem {
  chave: string;
  valor: string;
  tipo: string;
  descricao: string;
  categoria: string;
  editavel: boolean;
}

const defaultConfigs: ConfiguracaoItem[] = [
  // Datas de Pagamento
  { chave: 'dia_adiantamento', valor: '20', tipo: 'number', descricao: 'Dia do adiantamento (40%)', categoria: 'pagamento', editavel: true },
  { chave: 'dia_pagamento', valor: '5', tipo: 'number', descricao: 'Dia do pagamento (saldo)', categoria: 'pagamento', editavel: true },
  { chave: 'percentual_adiantamento', valor: '40', tipo: 'number', descricao: 'Percentual do adiantamento', categoria: 'pagamento', editavel: true },
  
  // Escalas
  { chave: 'escala_padrao', valor: '6x1', tipo: 'select', descricao: 'Escala padrão de trabalho', categoria: 'escala', editavel: true },
  { chave: 'dias_uteis_mes', valor: '26', tipo: 'number', descricao: 'Dias úteis padrão no mês', categoria: 'escala', editavel: true },
  
  // Benefícios - VT
  { chave: 'vt_valor_diario', valor: '12.00', tipo: 'currency', descricao: 'Valor diário do VT', categoria: 'beneficios', editavel: true },
  { chave: 'vt_desconto_percentual', valor: '6', tipo: 'number', descricao: 'Percentual de desconto VT', categoria: 'beneficios', editavel: true },
  
  // Benefícios - VR
  { chave: 'vr_valor_diario', valor: '25.00', tipo: 'currency', descricao: 'Valor diário do VR', categoria: 'beneficios', editavel: true },
  { chave: 'vr_desconto_percentual', valor: '0', tipo: 'number', descricao: 'Percentual de desconto VR', categoria: 'beneficios', editavel: true },
  
  // Benefícios - Cesta Básica
  { chave: 'cesta_valor', valor: '200.00', tipo: 'currency', descricao: 'Valor da cesta básica', categoria: 'beneficios', editavel: true },
  { chave: 'cesta_dia_corte', valor: '15', tipo: 'number', descricao: 'Dia limite para elegibilidade', categoria: 'beneficios', editavel: true },
  
  // Políticas - Férias
  { chave: 'ferias_dias_antecedencia', valor: '30', tipo: 'number', descricao: 'Dias de antecedência para programar', categoria: 'politicas', editavel: true },
  { chave: 'ferias_alerta_vencimento', valor: '60', tipo: 'number', descricao: 'Dias antes do vencimento para alertar', categoria: 'politicas', editavel: true },
  
  // Políticas - Empréstimos
  { chave: 'emprestimo_maximo_parcelas', valor: '12', tipo: 'number', descricao: 'Máximo de parcelas permitido', categoria: 'politicas', editavel: true },
  { chave: 'emprestimo_limite_salario', valor: '30', tipo: 'number', descricao: 'Limite % do salário por parcela', categoria: 'politicas', editavel: true },
  
  // ASO
  { chave: 'aso_alerta_dias', valor: '30', tipo: 'number', descricao: 'Dias antes do vencimento para alertar', categoria: 'politicas', editavel: true },
];

export function ConfiguracoesRH() {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [originalConfigs, setOriginalConfigs] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load configurations
  useEffect(() => {
    const loadConfigs = async () => {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*');

      const configMap: Record<string, string> = {};
      
      // Set defaults first
      defaultConfigs.forEach(c => {
        configMap[c.chave] = c.valor;
      });
      
      // Override with saved values
      if (data) {
        data.forEach((c: any) => {
          configMap[c.chave] = c.valor;
        });
      }

      setConfigs(configMap);
      setOriginalConfigs(configMap);
      setIsLoading(false);
    };

    loadConfigs();
  }, []);

  // Track changes
  useEffect(() => {
    const changed = Object.keys(configs).some(key => configs[key] !== originalConfigs[key]);
    setHasChanges(changed);
  }, [configs, originalConfigs]);

  const handleChange = (key: string, value: string) => {
    setConfigs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Upsert all changed configs
      const changedConfigs = defaultConfigs
        .filter(c => configs[c.chave] !== originalConfigs[c.chave])
        .map(c => ({
          chave: c.chave,
          valor: configs[c.chave],
          tipo: c.tipo,
          descricao: c.descricao,
          categoria: c.categoria,
          editavel: c.editavel
        }));

      if (changedConfigs.length > 0) {
        const { error } = await supabase
          .from('configuracoes_sistema')
          .upsert(changedConfigs, { onConflict: 'chave' });

        if (error) throw error;
      }

      setOriginalConfigs({ ...configs });
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const renderConfigInput = (config: ConfiguracaoItem) => {
    const value = configs[config.chave] || config.valor;
    
    if (config.tipo === 'select' && config.chave === 'escala_padrao') {
      return (
        <Select value={value} onValueChange={(v) => handleChange(config.chave, v)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6x1">6x1</SelectItem>
            <SelectItem value="5x2">5x2</SelectItem>
            <SelectItem value="12x36">12x36</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    if (config.tipo === 'currency') {
      return (
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleChange(config.chave, e.target.value)}
            className="pl-9"
          />
        </div>
      );
    }
    
    if (config.tipo === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(config.chave, e.target.value)}
          className="w-24"
        />
      );
    }
    
    return (
      <Input
        value={value}
        onChange={(e) => handleChange(config.chave, e.target.value)}
        className="w-32"
      />
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Carregando configurações...
        </CardContent>
      </Card>
    );
  }

  const categorias = [
    { id: 'pagamento', title: 'Datas de Pagamento', icon: Calendar, description: 'Configure os dias de adiantamento e pagamento' },
    { id: 'escala', title: 'Escalas de Trabalho', icon: Clock, description: 'Defina a escala padrão e dias úteis' },
    { id: 'beneficios', title: 'Benefícios', icon: DollarSign, description: 'Configure VT, VR e Cesta Básica' },
    { id: 'politicas', title: 'Políticas', icon: Banknote, description: 'Regras de férias, empréstimos e ASO' },
  ];

  return (
    <div className="space-y-6">
      {/* Alert for unsaved changes */}
      {hasChanges && (
        <Alert className="border-warning/50 bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span>Você tem alterações não salvas</span>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {categorias.map(categoria => {
        const Icon = categoria.icon;
        const categoryConfigs = defaultConfigs.filter(c => c.categoria === categoria.id);
        
        return (
          <Card key={categoria.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                {categoria.title}
              </CardTitle>
              <CardDescription>{categoria.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryConfigs.map((config, idx) => (
                  <div key={config.chave}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{config.descricao}</Label>
                        <p className="text-xs text-muted-foreground">{config.chave}</p>
                      </div>
                      {renderConfigInput(config)}
                    </div>
                    {idx < categoryConfigs.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Estas configurações afetam os cálculos automáticos do sistema. Valores não configurados 
          usarão os padrões definidos. O sistema <strong>nunca bloqueará</strong> operações por 
          configurações ausentes, apenas exibirá alertas informativos.
        </AlertDescription>
      </Alert>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || isSaving}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}

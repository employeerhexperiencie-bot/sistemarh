import { useState } from 'react';
import { Calendar, Upload, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileUploader } from '@/components/FileUploader';
import { useN8NAction } from '@/hooks/useN8NAction';

export default function Faltas() {
  const [formData, setFormData] = useState({
    matricula: '',
    data: '',
    tipo: '',
    observacao: '',
    atestadoFileId: null as string | null,
  });
  
  const { execute, loading } = useN8NAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      matricula: formData.matricula,
      dataISO: formData.data,
      tipo: formData.tipo,
      atestadoFileId: formData.atestadoFileId,
      observacao: formData.observacao,
    };

    await execute('falta', payload, {
      successMessage: 'Falta registrada com sucesso',
    });
  };

  const handleFileUploaded = (fileId: string) => {
    setFormData(prev => ({ ...prev, atestadoFileId: fileId }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Registro de Faltas</h1>
        <Badge variant="outline" className="bg-accent/10">
          <AlertCircle className="h-4 w-4 mr-2" />
          Cálculo configurável
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Registrar Falta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      placeholder="Digite a matrícula"
                      value={formData.matricula}
                      onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data">Data da Falta</Label>
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Falta</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JUST">Justificada</SelectItem>
                      <SelectItem value="INJUST">Injustificada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacao">Observação</Label>
                  <Textarea
                    id="observacao"
                    placeholder="Detalhes adicionais sobre a falta"
                    value={formData.observacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Atestado (opcional)</Label>
                  <FileUploader
                    onFileUploaded={handleFileUploaded}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Registrando...' : 'Registrar Falta'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="text-accent">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-1">Falta Justificada:</h4>
                <p>Registra apenas o evento, sem descontos automáticos.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Falta Injustificada:</h4>
                <p>Comportamento conforme configuração:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><strong>NÃO_CALCULA:</strong> Apenas registra</li>
                  <li><strong>CALCULA:</strong> Desconta 1/30 + DSR (se ativo)</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs">💡 Anexe atestados médicos para faltas justificadas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
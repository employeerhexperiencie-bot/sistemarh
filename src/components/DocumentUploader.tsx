import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Eye, Download, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DocumentUploaderProps {
  bucket: string;
  folder: string;
  entityId: string;
  entityType: 'loja' | 'professional';
  onDocumentUploaded?: () => void;
}

interface Document {
  id: string;
  nome: string;
  tipo?: string;
  categoria?: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  bucket,
  folder,
  entityId,
  entityType,
  onDocumentUploaded
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('');
  const { toast } = useToast();

  const documentTypes = {
    loja: [
      { value: 'contrato_social', label: 'Contrato Social' },
      { value: 'alvara', label: 'Alvará de Funcionamento' },
      { value: 'licenca', label: 'Licença Sanitária' },
      { value: 'outros', label: 'Outros' }
    ],
    professional: [
      { value: 'documentos_pessoais', label: 'Documentos Pessoais' },
      { value: 'vales', label: 'Vales' },
      { value: 'epi', label: 'EPI' },
      { value: 'contratos', label: 'Contratos' },
      { value: 'outros', label: 'Outros' }
    ]
  };

  const uploadDocument = async (file: File) => {
    if (!documentName || !documentType) {
      toast({
        title: "Erro",
        description: "Preencha o nome e tipo do documento",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${entityId}/${documentType}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document metadata to database
      const table = entityType === 'loja' ? 'loja_documents' : 'professional_documents';
      const foreignKey = entityType === 'loja' ? 'loja_id' : 'professional_id';
      
      let documentData: any;
      if (entityType === 'loja') {
        documentData = {
          loja_id: entityId,
          nome: documentName,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          tipo: documentType
        };
      } else {
        documentData = {
          professional_id: entityId,
          nome: documentName,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          categoria: documentType
        };
      }

      const { error: dbError } = await supabase
        .from(table)
        .insert([documentData]);

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso"
      });

      setDocumentName('');
      setDocumentType('');
      loadDocuments();
      onDocumentUploaded?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar documento",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const table = entityType === 'loja' ? 'loja_documents' : 'professional_documents';
      const foreignKey = entityType === 'loja' ? 'loja_id' : 'professional_id';
      
      const { data, error } = await supabase
        .from(table as any)
        .select('*')
        .eq(foreignKey, entityId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as any) || []);
    } catch (error) {
      console.error('Load documents error:', error);
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar documento",
        variant: "destructive"
      });
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const table = entityType === 'loja' ? 'loja_documents' : 'professional_documents';
      const { error: dbError } = await supabase
        .from(table)
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso"
      });

      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir documento",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  React.useEffect(() => {
    loadDocuments();
  }, [entityId]);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="documentName">Nome do Documento</Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Digite o nome do documento"
              />
            </div>
            <div>
              <Label htmlFor="documentType">Tipo/Categoria</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes[entityType].map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="fileInput">Arquivo</Label>
            <Input
              id="fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadDocument(file);
                }
              }}
              disabled={uploading}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Formatos aceitos: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum documento encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.nome}</span>
                      <Badge variant="secondary">
                        {entityType === 'loja' 
                          ? documentTypes.loja.find(t => t.value === doc.tipo)?.label 
                          : documentTypes.professional.find(t => t.value === doc.categoria)?.label
                        }
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc.file_path, doc.nome)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
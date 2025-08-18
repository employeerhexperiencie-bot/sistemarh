import { useState, useRef } from 'react';
import { Upload, File, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useN8NAction } from '@/hooks/useN8NAction';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileUploaded?: (fileId: string, driveLink: string) => void;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUploader({
  onFileUploaded,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSizeMB = 10,
  disabled = false,
  className
}: FileUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, loading } = useN8NAction();

  const validateFile = (file: File): string | null => {
    // Verifica tamanho
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Arquivo muito grande. Máximo ${maxSizeMB}MB.`;
    }

    // Verifica tipo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `Tipo não suportado. Use: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    setUploadedFile(file);
    setUploadSuccess(false);

    const result = await uploadFile(file);
    if (result) {
      setUploadSuccess(true);
      onFileUploaded?.(result.fileId, result.driveLink);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {!uploadedFile ? (
        <Card
          className={cn(
            'border-2 border-dashed border-border hover:border-primary/50 smooth-transition cursor-pointer',
            isDragOver && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Enviar arquivo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Arraste e solte ou clique para selecionar
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {acceptedTypes.map((type) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type.toUpperCase()}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Máximo {maxSizeMB}MB
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {uploadSuccess ? (
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-success" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(uploadedFile.size)}
              </p>
              {uploadSuccess && (
                <Badge variant="outline" className="text-xs mt-1">
                  Enviado com sucesso
                </Badge>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
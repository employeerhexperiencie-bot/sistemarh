import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface N8NResponse {
  ok: boolean;
  message: string;
  data?: any;
  code?: string;
  pid?: string;
}

interface UseN8NActionOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  successMessage?: string;
}

export function useN8NAction() {
  const [loading, setLoading] = useState(false);

  const execute = async (
    action: string,
    payload: any,
    options: UseN8NActionOptions = {}
  ): Promise<N8NResponse | null> => {
    setLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_BASE || 'https://n8n.example.com/webhook'}/action`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_API_TOKEN || 'demo-token'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...payload }),
      });

      const result: N8NResponse = await response.json();

      if (result.ok) {
        toast({
          title: 'Sucesso',
          description: options.successMessage || result.message || 'Operação realizada com sucesso',
          variant: 'default',
        });
        
        options.onSuccess?.(result.data);
        return result;
      } else {
        toast({
          title: 'Erro',
          description: result.message || 'Erro na operação',
          variant: 'destructive',
        });
        
        options.onError?.(result);
        return result;
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro de conexão';
      
      toast({
        title: 'Erro de Conexão',
        description: errorMessage,
        variant: 'destructive',
      });
      
      options.onError?.(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<{ fileId: string; driveLink: string } | null> => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_N8N_WEBHOOK_BASE || 'https://n8n.example.com/webhook'}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PUBLIC_API_TOKEN || 'demo-token'}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.ok) {
        toast({
          title: 'Upload realizado',
          description: `Arquivo ${result.fileName} enviado com sucesso`,
          variant: 'default',
        });
        
        return {
          fileId: result.fileId,
          driveLink: result.driveLink,
        };
      } else {
        toast({
          title: 'Erro no upload',
          description: result.message || 'Falha no envio do arquivo',
          variant: 'destructive',
        });
        
        return null;
      }
    } catch (error: any) {
      toast({
        title: 'Erro de Upload',
        description: error.message || 'Falha na conexão durante upload',
        variant: 'destructive',
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    execute,
    uploadFile,
    loading,
  };
}
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface N8NResponse {
  ok: boolean;
  message: string;
  data?: any;
  code?: string;
  pid?: string;
  demo?: boolean;
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
      // Use secure edge function proxy instead of direct client-side calls
      const { data, error } = await supabase.functions.invoke('n8n-proxy', {
        body: { action, ...payload },
      });

      if (error) {
        console.error('N8N Action Error:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Erro na conexão com o servidor',
          variant: 'destructive',
        });
        options.onError?.(error);
        return null;
      }

      const result = data as N8NResponse;

      // Handle demo mode response
      if (result.demo) {
        console.log('N8N running in demo mode');
        toast({
          title: 'Modo Demo',
          description: 'Integração N8N não configurada - operando em modo demonstração',
          variant: 'default',
        });
        options.onSuccess?.(result.data);
        return result;
      }

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
      // Get auth session for the edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erro de Autenticação',
          description: 'Você precisa estar logado para fazer upload',
          variant: 'destructive',
        });
        return null;
      }

      // Create FormData and call the edge function
      const formData = new FormData();
      formData.append('file', file);

      // Use fetch with proper auth header for file uploads
      const { data: { publicUrl } } = supabase.storage.from('temp').getPublicUrl('');
      const supabaseUrl = publicUrl.replace('/storage/v1/object/public/temp/', '');
      
      const response = await fetch(`${supabaseUrl}/functions/v1/n8n-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      // Handle demo mode
      if (result.demo) {
        toast({
          title: 'Modo Demo',
          description: 'Upload em modo demonstração - N8N não configurado',
          variant: 'default',
        });
        return null;
      }

      if (result.ok) {
        toast({
          title: 'Upload realizado',
          description: `Arquivo ${result.fileName || file.name} enviado com sucesso`,
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

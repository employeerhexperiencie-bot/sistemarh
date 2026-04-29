import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, ExternalLink, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanupAccess } from '@/hooks/useLanupAccess';

interface Partner {
  id: string;
  nome: string;
  slug: string;
  api_base_url: string | null;
  logo_url: string | null;
  website: string | null;
}

/**
 * Página dedicada que abre o sistema Lanup embutido em iframe.
 * URL é puxada de partners.api_base_url. Faz handshake via postMessage
 * enviando o JWT do usuário para SSO transparente (quando suportado).
 */
export default function LanupPage() {
  const { user } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const { data: hasAccess, isLoading: checkingAccess } = useLanupAccess();

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-lanup'],
    queryFn: async (): Promise<Partner | null> => {
      const { data, error } = await (supabase as any)
        .from('partners')
        .select('id, nome, slug, api_base_url, logo_url, website')
        .eq('slug', 'lanup')
        .eq('ativo', true)
        .maybeSingle();
      if (error) throw error;
      return data as Partner | null;
    },
    staleTime: 5 * 60_000,
  });

  const embedUrl = useMemo(() => {
    if (!partner?.api_base_url || !user) return null;
    try {
      return partner.api_base_url
        .replace('{user_id}', encodeURIComponent(user.id))
        .replace('{user_email}', encodeURIComponent(user.email));
    } catch {
      return partner.api_base_url;
    }
  }, [partner, user]);

  useEffect(() => {
    if (!iframeRef.current || !embedUrl) return;
    const iframe = iframeRef.current;
    const handleLoad = async () => {
      setLoading(false);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token || !iframe.contentWindow) return;
        const targetOrigin = new URL(embedUrl).origin;
        iframe.contentWindow.postMessage(
          {
            type: 'eaz:handshake',
            token,
            user: { id: user?.id, email: user?.email },
          },
          targetOrigin
        );
      } catch (e) {
        console.error('Lanup handshake error', e);
      }
    };
    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [embedUrl, user]);

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Aguardando verificação de permissão
  if (checkingAccess) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Acesso bloqueado: tenant não tem a chave Lanup ligada
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="border rounded-xl p-10 flex flex-col items-center text-center gap-4 bg-card">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Acesso à Lanup não liberado</h1>
          <p className="text-muted-foreground max-w-md">
            Sua empresa ainda não tem o acesso ao sistema <strong>Lanup</strong> habilitado.
            Entre em contato com o administrador para solicitar a liberação.
          </p>
          <Button variant="outline" asChild>
            <a href="mailto:contato@eaz.com.br?subject=Solicitação%20de%20acesso%20Lanup">
              <Mail className="h-4 w-4 mr-2" />
              Falar com o administrador
            </a>
          </Button>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Integração Lanup não está disponível.
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt="Lanup" className="h-8" />
          ) : (
            <h1 className="text-2xl font-bold">Lanup</h1>
          )}
        </div>
        <div className="p-8 border border-dashed rounded-lg flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-warning" />
          <h3 className="font-semibold">Lanup ainda não está configurada</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Para ativar o acesso ao sistema Lanup, configure a URL de integração
            no cadastro do parceiro.
          </p>
          {partner.website && (
            <Button variant="outline" size="sm" asChild>
              <a href={partner.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visitar site da Lanup
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt="Lanup" className="h-7" />
          ) : (
            <h1 className="text-xl font-bold">Lanup</h1>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={embedUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir em nova aba
          </a>
        </Button>
      </div>
      <div className="relative w-full h-[calc(100vh-10rem)] rounded-lg overflow-hidden border bg-card">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando Lanup...</p>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-popups allow-downloads"
          allow="clipboard-write"
          title="Lanup"
        />
      </div>
    </div>
  );
}
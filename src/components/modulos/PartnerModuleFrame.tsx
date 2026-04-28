import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { TenantModule } from '@/hooks/useTenantModules';

interface Props {
  tenantModule: TenantModule;
}

/**
 * Renderiza um módulo de parceiro dentro de um iframe seguro.
 *
 * Estratégia de auth:
 * - Substitui placeholders {tenant_id}, {user_id}, {user_email} no embed_url_template
 * - Envia o JWT do Supabase via postMessage assim que o iframe carrega
 * - Sandbox restrito (allow-scripts allow-forms allow-same-origin)
 */
export function PartnerModuleFrame({ tenantModule }: Props) {
  const { user, session } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const module = tenantModule.module;
  const partner = module?.partner;

  const embedUrl = useMemo(() => {
    if (!module?.embed_url_template || !user) return null;
    try {
      return module.embed_url_template
        .replace('{tenant_id}', encodeURIComponent(user.id))
        .replace('{user_id}', encodeURIComponent(user.id))
        .replace('{user_email}', encodeURIComponent(user.email))
        .replace('{module_slug}', encodeURIComponent(module.slug));
    } catch (e) {
      return null;
    }
  }, [module, user]);

  // Envia handshake com token assim que iframe carrega
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
            module_slug: module?.slug,
          },
          targetOrigin
        );
      } catch (e) {
        console.error('PartnerModuleFrame handshake error', e);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [embedUrl, user, module]);

  if (!module) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Módulo não encontrado.
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="p-8 border border-dashed rounded-lg flex flex-col items-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-warning" />
        <h3 className="font-semibold">Módulo ainda não está disponível para embed</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          O parceiro <strong>{partner?.nome}</strong> ainda não disponibilizou uma URL
          de integração para o módulo <strong>{module.nome}</strong>. Você será
          notificado assim que estiver pronto.
        </p>
        {module.documentacao_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={module.documentacao_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver documentação
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-12rem)] rounded-lg overflow-hidden border bg-card">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando {module.nome}...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
        allow="clipboard-write"
        title={module.nome}
        onError={() => setError('Falha ao carregar módulo.')}
      />
    </div>
  );
}
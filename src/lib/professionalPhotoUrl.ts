import { supabase } from '@/integrations/supabase/client';

/**
 * Cache de URLs assinadas para fotos profissionais.
 * O bucket 'professional-photos' é privado — não podemos usar getPublicUrl.
 * Esta camada cria URLs assinadas com TTL e mantém em cache em memória para
 * evitar chamadas repetidas de signing por foto.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h
// Renova com folga antes da expiração
const REFRESH_THRESHOLD_MS = (SIGNED_URL_TTL_SECONDS - 60) * 1000;

interface CacheEntry {
  url: string;
  fetchedAt: number;
  promise?: Promise<string | null>;
}

const cache = new Map<string, CacheEntry>();

/**
 * Extrai o path interno do bucket a partir de uma URL armazenada.
 * Aceita tanto URLs públicas antigas quanto paths puros já normalizados.
 */
export function extractPhotoPath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const value = stored.trim();
  if (!value) return null;

  // Se já parece um path (sem protocolo), retorna direto
  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, '');
  }

  // Tenta extrair o path do bucket de uma URL pública/assinada do supabase
  const marker = '/professional-photos/';
  const idx = value.indexOf(marker);
  if (idx === -1) return null;
  const after = value.slice(idx + marker.length);
  // Remove query string (token de URL assinada antiga)
  return after.split('?')[0];
}

/**
 * Resolve uma URL de exibição para uma foto profissional.
 * Retorna null caso o usuário não tenha permissão ou a foto não exista.
 */
export async function resolveProfessionalPhotoUrl(
  stored: string | null | undefined
): Promise<string | null> {
  const path = extractPhotoPath(stored);
  if (!path) return null;

  const cached = cache.get(path);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < REFRESH_THRESHOLD_MS) {
    return cached.url;
  }
  if (cached?.promise) {
    return cached.promise;
  }

  const promise = (async () => {
    const { data, error } = await supabase.storage
      .from('professional-photos')
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      cache.delete(path);
      return null;
    }
    cache.set(path, { url: data.signedUrl, fetchedAt: Date.now() });
    return data.signedUrl;
  })();

  cache.set(path, {
    url: cached?.url ?? '',
    fetchedAt: cached?.fetchedAt ?? 0,
    promise,
  });

  return promise;
}

/** Limpa o cache (ex.: após logout). */
export function clearPhotoUrlCache() {
  cache.clear();
}

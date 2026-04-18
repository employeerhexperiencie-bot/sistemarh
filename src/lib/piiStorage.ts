/**
 * Cofre temporário em memória com fallback opcional para sessionStorage,
 * usado para dados de importação que contêm PII (CPF, RG, salários, dados bancários).
 *
 * Antes, esses dados ficavam em localStorage indefinidamente, expondo PII em:
 * - dispositivos compartilhados (próximo usuário podia ler com DevTools)
 * - timeouts de sessão e crashes (dados persistiam sem login ativo)
 * - qualquer XSS no domínio (acesso total ao dataset)
 *
 * Esta camada garante:
 * - TTL curto (30 minutos)
 * - Limpeza automática ao retornar à aba após período prolongado oculto
 * - Limpeza ao fechar a aba (beforeunload)
 * - Isolamento por chave com prefixo 'pii:'
 */

const PII_PREFIX = 'pii:';
const TTL_MS = 30 * 60 * 1000; // 30 minutos
const HIDDEN_TTL_MS = 10 * 60 * 1000; // limpa após 10min com aba oculta

interface PIIEnvelope<T> {
  v: T;
  exp: number;
}

let hiddenSince: number | null = null;

function isExpired(envelope: PIIEnvelope<unknown>): boolean {
  return typeof envelope?.exp !== 'number' || Date.now() > envelope.exp;
}

export function setPIIData<T>(key: string, value: T, ttlMs: number = TTL_MS): void {
  try {
    const envelope: PIIEnvelope<T> = { v: value, exp: Date.now() + ttlMs };
    sessionStorage.setItem(PII_PREFIX + key, JSON.stringify(envelope));
  } catch (e) {
    console.warn('[piiStorage] Failed to persist PII data:', e);
  }
}

export function getPIIData<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PII_PREFIX + key);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as PIIEnvelope<T>;
    if (isExpired(envelope)) {
      sessionStorage.removeItem(PII_PREFIX + key);
      return null;
    }
    return envelope.v;
  } catch {
    return null;
  }
}

export function removePIIData(key: string): void {
  try {
    sessionStorage.removeItem(PII_PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function clearAllPIIData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(PII_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));

    // Compatibilidade: limpa também chaves antigas em localStorage
    const legacyKeys = [
      'profissionaisImportados',
      'lojasImportadas',
      'dadosASO',
      'dadosASO_timestamp',
      'dadosBeneficios',
      'dadosBeneficios_timestamp',
    ];
    legacyKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
}

/**
 * Inicializa listeners para limpar PII quando:
 * - a aba fica oculta por mais de HIDDEN_TTL_MS
 * - o usuário fecha a aba/janela
 * Deve ser chamado uma vez no bootstrap da aplicação.
 */
export function initPIIStorageGuards(): void {
  if (typeof window === 'undefined') return;

  // Limpa imediatamente qualquer resíduo legado
  const legacyHasData =
    !!localStorage.getItem('profissionaisImportados') ||
    !!localStorage.getItem('dadosASO') ||
    !!localStorage.getItem('dadosBeneficios');
  if (legacyHasData) {
    console.info('[piiStorage] Limpando dados PII legados de localStorage');
    clearAllPIIData();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenSince = Date.now();
    } else if (document.visibilityState === 'visible' && hiddenSince) {
      const elapsed = Date.now() - hiddenSince;
      hiddenSince = null;
      if (elapsed > HIDDEN_TTL_MS) {
        clearAllPIIData();
      }
    }
  });

  window.addEventListener('beforeunload', () => {
    clearAllPIIData();
  });
}

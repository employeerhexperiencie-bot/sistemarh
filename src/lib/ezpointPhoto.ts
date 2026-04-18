/**
 * Conversão de fotos para o padrão do equipamento de ponto facial Ezpoint.
 *
 * Padrão Ezpoint:
 * - Resolução: 320x240 (4:3) — recomendado pelo manual do equipamento
 * - Formato: JPEG
 * - Qualidade: 85% (equilíbrio entre tamanho e nitidez do rosto)
 * - Centralizado no rosto (cover crop)
 * - Tamanho final típico: 15–35 KB (cabe no flash do equipamento)
 */

export const EZPOINT_WIDTH = 320;
export const EZPOINT_HEIGHT = 240;
export const EZPOINT_QUALITY = 0.85;

/**
 * Lê um arquivo como HTMLImageElement.
 */
function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Gera versão Ezpoint (320x240 JPG) a partir de qualquer imagem.
 * Aplica cover-crop centralizado para preservar o rosto.
 */
export async function convertToEzpoint(file: File): Promise<Blob> {
  const img = await loadImage(file);

  const canvas = document.createElement('canvas');
  canvas.width = EZPOINT_WIDTH;
  canvas.height = EZPOINT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado neste navegador');

  // Cover crop centralizado (preserva proporção, corta sobras)
  const targetRatio = EZPOINT_WIDTH / EZPOINT_HEIGHT;
  const sourceRatio = img.width / img.height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (sourceRatio > targetRatio) {
    // Imagem mais larga → corta laterais
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    // Imagem mais alta → corta topo/base (mantém terço superior para preservar rosto)
    sh = img.width / targetRatio;
    sy = Math.max(0, (img.height - sh) / 3); // mantém rosto no terço superior
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, EZPOINT_WIDTH, EZPOINT_HEIGHT);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, EZPOINT_WIDTH, EZPOINT_HEIGHT);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao gerar JPEG Ezpoint'));
      },
      'image/jpeg',
      EZPOINT_QUALITY,
    );
  });
}

/**
 * Validações básicas antes de subir.
 */
export function validatePhotoFile(file: File): { ok: true } | { ok: false; error: string } {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: 'Formato inválido. Use JPG, PNG ou WEBP.' };
  }
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: 'Arquivo muito grande. Máximo: 5 MB.' };
  }
  return { ok: true };
}

/**
 * Mapeia o nome de um "campo faltante" de profissional para:
 *  - a aba do modal de edição que contém o input
 *  - o id do input (htmlFor) para foco/scroll/destaque
 *
 * Usado pelo deep-link `?matricula=XXX&edit=1&campo=YYY` em
 * /cadastro-profissionais para abrir o modal de edição já posicionado
 * no campo que o alerta apontou.
 */

export type CampoFaltante =
  | 'cpf'
  | 'rg'
  | 'pis'
  | 'ctps'
  | 'nome'
  | 'cargo'
  | 'loja'
  | 'loja_id'
  | 'salario'
  | 'salario_nominal'
  | 'data_admissao'
  | 'telefone'
  | 'celular'
  | 'chave_pix';

export const CAMPO_TO_TAB: Record<string, string> = {
  // Aba "Pessoais"
  cpf: 'pessoais',
  rg: 'pessoais',
  nome: 'pessoais',
  telefone: 'pessoais',
  celular: 'pessoais',
  // Aba "Profissional"
  cargo: 'profissionais',
  loja: 'profissionais',
  loja_id: 'profissionais',
  data_admissao: 'profissionais',
  ctps: 'profissionais',
  pis: 'profissionais',
  // Aba "Salários"
  salario: 'salarios',
  salario_nominal: 'salarios',
  // Aba "Bancário"
  chave_pix: 'bancario',
};

export const CAMPO_TO_INPUT_ID: Record<string, string> = {
  cpf: 'cpf',
  rg: 'rg',
  pis: 'pis',
  ctps: 'ctps',
  nome: 'nome',
  cargo: 'cargo',
  loja: 'loja_id',
  loja_id: 'loja_id',
  salario: 'salario_nominal',
  salario_nominal: 'salario_nominal',
  data_admissao: 'data_admissao',
  telefone: 'telefone',
  celular: 'celular',
  chave_pix: 'chave_pix',
};

/**
 * Constrói uma URL de deep-link para a tela de edição do profissional
 * já posicionada num campo específico.
 */
export function buildEditCampoUrl(matricula: string, campo: string): string {
  const params = new URLSearchParams();
  params.set('matricula', matricula);
  params.set('edit', '1');
  params.set('campo', campo);
  return `/cadastro-profissionais?${params.toString()}`;
}

/**
 * Após o modal de edição abrir, foca/destaca o input correspondente
 * ao campo. Tolerante: se o input ainda não existe, tenta novamente
 * algumas vezes (modal/abas montam de forma assíncrona).
 */
export function focusAndHighlightField(campo: string, attempt = 0): void {
  const inputId = CAMPO_TO_INPUT_ID[campo];
  if (!inputId) return;

  const el = document.getElementById(inputId) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null;

  if (!el) {
    if (attempt < 10) {
      setTimeout(() => focusAndHighlightField(campo, attempt + 1), 150);
    }
    return;
  }

  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof (el as HTMLInputElement).focus === 'function') {
      (el as HTMLInputElement).focus({ preventScroll: true });
    }
    el.classList.add('field-highlight');
    setTimeout(() => el.classList.remove('field-highlight'), 4500);
  } catch {
    /* noop */
  }
}
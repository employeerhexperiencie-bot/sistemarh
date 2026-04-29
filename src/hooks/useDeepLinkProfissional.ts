import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Lê `?matricula=XXX` (e opcionalmente `?nome=YYY`) da URL e popula o
 * filtro de busca da tela. Usado pelo deep-link de alertas para que o
 * usuário caia direto no registro do profissional certo nas telas de
 * gestão (ASO, Férias, Afastamentos, EPI, etc.).
 *
 * Após popular o filtro, faz scroll na primeira linha que contenha o
 * texto buscado, destacando-a por alguns segundos.
 */
export function useDeepLinkProfissional(
  setSearchTerm: (s: string) => void,
) {
  const [params] = useSearchParams();
  const matricula = params.get('matricula') || '';
  const nome = params.get('nome') || '';

  useEffect(() => {
    const termo = matricula || nome;
    if (!termo) return;
    setSearchTerm(termo);

    // Aguardar a tabela renderizar e tentar destacar a linha
    const tryHighlight = (attempt = 0) => {
      // Procura por qualquer célula que contenha a matrícula/nome
      const cells = Array.from(document.querySelectorAll('td')) as HTMLTableCellElement[];
      const target = cells.find(c =>
        c.textContent?.toLowerCase().includes(termo.toLowerCase()),
      );
      const row = target?.closest('tr') as HTMLTableRowElement | null;
      if (!row) {
        if (attempt < 10) setTimeout(() => tryHighlight(attempt + 1), 250);
        return;
      }
      try {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch { /* noop */ }
      row.classList.add('row-highlight');
      setTimeout(() => row.classList.remove('row-highlight'), 4500);
    };
    setTimeout(() => tryHighlight(), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matricula, nome]);
}
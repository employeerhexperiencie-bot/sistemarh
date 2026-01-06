import { useState, useEffect, useRef } from 'react';
import { Search, User, Building2, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'profissional' | 'loja';
  title: string;
  subtitle: string;
  badge?: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Buscar resultados quando query mudar
  useEffect(() => {
    const searchData = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        // Buscar profissionais e lojas em paralelo
        const [profissionaisRes, lojasRes] = await Promise.all([
          supabase
            .from('profissionais')
            .select('id, nome, matricula, cargo, status, lojas:lojas!profissionais_loja_id_fkey(nome)')
            .or(`nome.ilike.%${query}%,matricula.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('lojas')
            .select('id, nome, endereco')
            .ilike('nome', `%${query}%`)
            .limit(3),
        ]);

        const searchResults: SearchResult[] = [];

        // Adicionar profissionais
        profissionaisRes.data?.forEach((p: any) => {
          searchResults.push({
            id: p.id,
            type: 'profissional',
            title: p.nome,
            subtitle: `Mat: ${p.matricula} • ${p.lojas?.nome || 'Sem loja'}`,
            badge: p.status === 'ativo' ? 'Ativo' : p.status,
          });
        });

        // Adicionar lojas
        lojasRes.data?.forEach((l: any) => {
          searchResults.push({
            id: l.id,
            type: 'loja',
            title: l.nome,
            subtitle: l.endereco || 'Sem endereço cadastrado',
          });
        });

        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchData, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    if (result.type === 'profissional') {
      navigate(`/painel-profissional/${result.id}`);
    } else {
      navigate(`/painel-loja?loja=${result.id}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar funcionário, loja..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        {!isLoading && query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in">
          {results.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}
          
          {results.length > 0 && (
            <div className="py-2">
              {/* Agrupar por tipo */}
              {results.some(r => r.type === 'profissional') && (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Profissionais
                  </div>
                  {results
                    .filter(r => r.type === 'profissional')
                    .map((result, index) => {
                      const actualIndex = results.findIndex(r => r.id === result.id);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors",
                            actualIndex === selectedIndex && "bg-muted"
                          )}
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                          {result.badge && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                result.badge === 'Ativo' 
                                  ? "bg-success/10 text-success border-success/20" 
                                  : "bg-muted"
                              )}
                            >
                              {result.badge}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                </>
              )}
              
              {results.some(r => r.type === 'loja') && (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">
                    Lojas
                  </div>
                  {results
                    .filter(r => r.type === 'loja')
                    .map((result, index) => {
                      const actualIndex = results.findIndex(r => r.id === result.id);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors",
                            actualIndex === selectedIndex && "bg-muted"
                          )}
                        >
                          <div className="p-2 rounded-lg bg-info/10">
                            <Building2 className="h-4 w-4 text-info" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                          </div>
                        </button>
                      );
                    })}
                </>
              )}
            </div>
          )}
          
          {/* Dica de navegação */}
          <div className="border-t px-3 py-2 bg-muted/30 text-xs text-muted-foreground flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd> para navegar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Enter</kbd> para selecionar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">Esc</kbd> para fechar</span>
          </div>
        </div>
      )}
    </div>
  );
}

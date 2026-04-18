import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Profissional {
  id: string;
  matricula: string;
  nome: string;
  cargo: string | null;
  status?: string | null;
  loja?: { nome: string } | null;
}

interface ProfissionalAutocompleteProps {
  value: string;
  onChange: (matricula: string, profissionalId?: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Quando true, inclui também profissionais com status diferente de 'ativo' (ex.: demitidos). */
  incluirInativos?: boolean;
}

export function ProfissionalAutocomplete({
  value,
  onChange,
  label = 'Matrícula',
  placeholder = 'Digite matrícula ou nome',
  disabled = false,
  incluirInativos = false,
}: ProfissionalAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Profissional[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar value externo com query
  useEffect(() => {
    if (value !== query && !selectedProfissional) {
      setQuery(value);
    }
  }, [value]);

  // Buscar sugestões
  useEffect(() => {
    const searchProfissionais = async () => {
      if (query.length < 2 || selectedProfissional) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        let queryBuilder = supabase
          .from('profissionais')
          .select('id, matricula, nome, cargo, status, lojas:lojas!profissionais_loja_id_fkey(nome)')
          .or(`matricula.ilike.%${query}%,nome.ilike.%${query}%`)
          .limit(8);

        if (!incluirInativos) {
          queryBuilder = queryBuilder.eq('status', 'ativo');
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        const results: Profissional[] = (data || []).map((p: any) => ({
          id: p.id,
          matricula: p.matricula,
          nome: p.nome,
          cargo: p.cargo,
          status: p.status,
          loja: p.lojas,
        }));

        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Erro ao buscar profissionais:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchProfissionais, 250);
    return () => clearTimeout(debounce);
  }, [query, selectedProfissional, incluirInativos]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedProfissional(null);
    onChange(newValue, undefined);
  };

  const handleSelect = (profissional: Profissional) => {
    setSelectedProfissional(profissional);
    setQuery(profissional.matricula);
    setIsOpen(false);
    onChange(profissional.matricula, profissional.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0 && !selectedProfissional) {
      setIsOpen(true);
    }
  };

  const clearSelection = () => {
    setSelectedProfissional(null);
    setQuery('');
    onChange('', undefined);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={disabled}
          className={cn(
            selectedProfissional && "pr-24"
          )}
        />
        
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
        
        {selectedProfissional && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-xs text-success flex items-center gap-1">
              <Check className="h-3 w-3" />
              Selecionado
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="ml-1 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Card de profissional selecionado */}
      {selectedProfissional && (
        <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <User className="h-4 w-4 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{selectedProfissional.nome}</p>
              <p className="text-xs text-muted-foreground">
                Mat: {selectedProfissional.matricula} • {selectedProfissional.cargo || 'Sem cargo'} • {selectedProfissional.loja?.nome || 'Sem loja'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown de sugestões */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {suggestions.map((profissional, index) => (
              <button
                key={profissional.id}
                type="button"
                onClick={() => handleSelect(profissional)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors",
                  index === selectedIndex && "bg-muted"
                )}
              >
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{profissional.nome}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      #{profissional.matricula}
                    </span>
                    {profissional.status && profissional.status !== 'ativo' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium uppercase">
                        {profissional.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {profissional.cargo || 'Sem cargo'} • {profissional.loja?.nome || 'Sem loja'}
                  </p>
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground">
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">↑↓</kbd> navegar • 
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px] ml-1">Enter</kbd> selecionar
          </div>
        </div>
      )}
    </div>
  );
}

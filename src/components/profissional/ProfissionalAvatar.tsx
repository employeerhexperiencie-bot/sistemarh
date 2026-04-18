import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProfissionalAvatarProps {
  nome: string;
  fotoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap: Record<NonNullable<ProfissionalAvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-lg',
};

function getInitials(nome: string): string {
  if (!nome) return '?';
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ProfissionalAvatar: React.FC<ProfissionalAvatarProps> = ({
  nome,
  fotoUrl,
  size = 'sm',
  className,
}) => {
  return (
    <Avatar className={cn(sizeMap[size], className)}>
      {fotoUrl && <AvatarImage src={fotoUrl} alt={nome} />}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {getInitials(nome)}
      </AvatarFallback>
    </Avatar>
  );
};

interface ProfissionalNomeAvatarProps extends ProfissionalAvatarProps {
  matricula?: string;
  subtitulo?: string;
}

/** Combo Avatar + Nome (+ matrícula/subtítulo) — uso padrão em listagens */
export const ProfissionalNomeAvatar: React.FC<ProfissionalNomeAvatarProps> = ({
  nome,
  fotoUrl,
  matricula,
  subtitulo,
  size = 'sm',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <ProfissionalAvatar nome={nome} fotoUrl={fotoUrl} size={size} />
      <div className="min-w-0">
        <div className="font-medium truncate">{nome}</div>
        {(matricula || subtitulo) && (
          <div className="text-xs text-muted-foreground truncate">
            {matricula && <span>Mat. {matricula}</span>}
            {matricula && subtitulo && <span> • </span>}
            {subtitulo}
          </div>
        )}
      </div>
    </div>
  );
};

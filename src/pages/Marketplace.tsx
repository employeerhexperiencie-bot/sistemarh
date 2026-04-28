import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAvailableModules,
  useActiveTenantModules,
  toggleTenantModule,
} from '@/hooks/useTenantModules';
import { toast } from '@/hooks/use-toast';
import {
  Package,
  Users,
  Clock,
  FileText,
  CreditCard,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const ICONS: Record<string, any> = {
  bid: Users,
  admissao: FileText,
  convocacao: Clock,
  ponto: Clock,
  pagamento: CreditCard,
  default: Package,
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  disponivel: { label: 'Disponível', variant: 'default' },
  beta: { label: 'Beta', variant: 'secondary' },
  em_desenvolvimento: { label: 'Em desenvolvimento', variant: 'outline' },
};

export default function Marketplace() {
  const queryClient = useQueryClient();
  const { data: modules, isLoading } = useAvailableModules();
  const { data: active } = useActiveTenantModules();
  const [toggling, setToggling] = useState<string | null>(null);

  const isActive = (moduleId: string) =>
    active?.some((tm) => tm.partner_module_id === moduleId && tm.ativo) ?? false;

  const handleToggle = async (moduleId: string, nome: string, ativo: boolean) => {
    setToggling(moduleId);
    try {
      await toggleTenantModule(moduleId, ativo);
      await queryClient.invalidateQueries({ queryKey: ['tenant-modules-active'] });
      toast({
        title: ativo ? `${nome} ativado` : `${nome} desativado`,
        description: ativo
          ? 'O módulo aparecerá no menu lateral em instantes.'
          : 'O módulo foi removido do menu.',
      });
    } catch (e: any) {
      toast({
        title: 'Erro ao atualizar módulo',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Marketplace de Módulos
        </h1>
        <p className="text-muted-foreground mt-1">
          Ative módulos de parceiros e estenda as capacidades do EAZ.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules?.map((mod) => {
            const Icon = ICONS[mod.slug] || ICONS.default;
            const status = STATUS_LABELS[mod.status] || { label: mod.status, variant: 'outline' as const };
            const active = isActive(mod.id);
            const canActivate = mod.status === 'disponivel' || mod.status === 'beta';

            return (
              <Card key={mod.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <CardTitle className="mt-3 text-lg">{mod.nome}</CardTitle>
                  <CardDescription className="text-xs">
                    por {mod.partner?.nome || '—'} · v{mod.versao || '1.0.0'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground flex-1">
                    {mod.descricao || 'Sem descrição.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    {canActivate ? (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={active}
                          disabled={toggling === mod.id}
                          onCheckedChange={(v) => handleToggle(mod.id, mod.nome, v)}
                        />
                        <span className="text-sm">
                          {active ? 'Ativado' : 'Ativar'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Disponível em breve
                      </span>
                    )}
                    {mod.documentacao_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={mod.documentacao_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
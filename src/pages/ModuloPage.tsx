import { useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useActiveTenantModules } from '@/hooks/useTenantModules';
import { PartnerModuleFrame } from '@/components/modulos/PartnerModuleFrame';

export default function ModuloPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useActiveTenantModules();

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const tm = data?.find((t) => t.module?.slug === slug && t.ativo);

  if (!tm) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{tm.module?.nome}</h1>
        <p className="text-xs text-muted-foreground">
          por {tm.module?.partner?.nome}
        </p>
      </div>
      <PartnerModuleFrame tenantModule={tm} />
    </div>
  );
}
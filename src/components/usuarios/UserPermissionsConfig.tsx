import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings2, 
  Loader2,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  FileDown,
  UserPlus,
  BadgeCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface UserPermission {
  id?: string;
  user_id: string;
  modulo: string;
  pode_visualizar: boolean;
  pode_editar: boolean;
  pode_deletar: boolean;
  pode_aprovar: boolean;
  pode_exportar: boolean;
  pode_convidar_usuarios: boolean;
}

interface UserPermissionsConfigProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const MODULOS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'profissionais', label: 'Profissionais' },
  { key: 'folha', label: 'Folha de Pagamento' },
  { key: 'beneficios', label: 'Benefícios' },
  { key: 'ocorrencias', label: 'Ocorrências' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'configuracoes', label: 'Configurações' }
];

export function UserPermissionsConfig({ userId, userName, isOpen, onClose }: UserPermissionsConfigProps) {
  const [permissions, setPermissions] = useState<Record<string, UserPermission>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Permissões globais (não por módulo)
  const [globalPermissions, setGlobalPermissions] = useState({
    pode_aprovar: false,
    pode_exportar: false,
    pode_convidar_usuarios: false
  });

  useEffect(() => {
    if (isOpen && userId) {
      loadPermissions();
    }
  }, [isOpen, userId]);

  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Mapear permissões por módulo
      const permMap: Record<string, UserPermission> = {};
      let hasGlobal = false;

      (data || []).forEach((p) => {
        permMap[p.modulo] = {
          id: p.id,
          user_id: p.user_id,
          modulo: p.modulo,
          pode_visualizar: p.pode_visualizar ?? false,
          pode_editar: p.pode_editar ?? false,
          pode_deletar: p.pode_deletar ?? false,
          pode_aprovar: p.pode_aprovar ?? false,
          pode_exportar: p.pode_exportar ?? false,
          pode_convidar_usuarios: p.pode_convidar_usuarios ?? false
        };

        // Capturar permissões globais do primeiro registro
        if (!hasGlobal) {
          setGlobalPermissions({
            pode_aprovar: p.pode_aprovar ?? false,
            pode_exportar: p.pode_exportar ?? false,
            pode_convidar_usuarios: p.pode_convidar_usuarios ?? false
          });
          hasGlobal = true;
        }
      });

      // Inicializar módulos que não existem
      MODULOS.forEach(m => {
        if (!permMap[m.key]) {
          permMap[m.key] = {
            user_id: userId,
            modulo: m.key,
            pode_visualizar: true, // Default: pode visualizar
            pode_editar: false,
            pode_deletar: false,
            pode_aprovar: false,
            pode_exportar: false,
            pode_convidar_usuarios: false
          };
        }
      });

      setPermissions(permMap);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast.error('Erro ao carregar permissões');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (modulo: string, field: keyof UserPermission) => {
    setPermissions(prev => ({
      ...prev,
      [modulo]: {
        ...prev[modulo],
        [field]: !prev[modulo][field as keyof UserPermission]
      }
    }));
  };

  const toggleGlobalPermission = (field: keyof typeof globalPermissions) => {
    setGlobalPermissions(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Preparar dados para upsert
      const upsertData = Object.values(permissions).map(p => ({
        ...p,
        pode_aprovar: globalPermissions.pode_aprovar,
        pode_exportar: globalPermissions.pode_exportar,
        pode_convidar_usuarios: globalPermissions.pode_convidar_usuarios
      }));

      // Deletar permissões existentes e inserir novas
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      const { error } = await supabase
        .from('user_permissions')
        .insert(upsertData.map(p => ({
          user_id: p.user_id,
          modulo: p.modulo,
          pode_visualizar: p.pode_visualizar,
          pode_editar: p.pode_editar,
          pode_deletar: p.pode_deletar,
          pode_aprovar: p.pode_aprovar,
          pode_exportar: p.pode_exportar,
          pode_convidar_usuarios: p.pode_convidar_usuarios
        })));

      if (error) throw error;

      toast.success('Permissões salvas com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configurar Permissões
          </DialogTitle>
          <DialogDescription>
            Configure as permissões de acesso para <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Permissões Globais */}
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <h4 className="font-medium flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                Permissões Globais
              </h4>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="pode_aprovar">Pode aprovar solicitações</Label>
                  </div>
                  <Switch
                    id="pode_aprovar"
                    checked={globalPermissions.pode_aprovar}
                    onCheckedChange={() => toggleGlobalPermission('pode_aprovar')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileDown className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="pode_exportar">Pode exportar dados</Label>
                  </div>
                  <Switch
                    id="pode_exportar"
                    checked={globalPermissions.pode_exportar}
                    onCheckedChange={() => toggleGlobalPermission('pode_exportar')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="pode_convidar">Pode convidar usuários</Label>
                  </div>
                  <Switch
                    id="pode_convidar"
                    checked={globalPermissions.pode_convidar_usuarios}
                    onCheckedChange={() => toggleGlobalPermission('pode_convidar_usuarios')}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Permissões por Módulo */}
            <div className="space-y-4">
              <h4 className="font-medium">Permissões por Módulo</h4>
              
              <div className="grid gap-3">
                {/* Header */}
                <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground font-medium px-3">
                  <div className="col-span-2">Módulo</div>
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="h-3 w-3" /> Ver
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Pencil className="h-3 w-3" /> Editar
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Trash2 className="h-3 w-3" /> Deletar
                  </div>
                </div>

                {/* Rows */}
                {MODULOS.map((modulo) => (
                  <div 
                    key={modulo.key} 
                    className="grid grid-cols-5 gap-2 items-center p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="col-span-2 font-medium">{modulo.label}</div>
                    <div className="flex justify-center">
                      <Switch
                        checked={permissions[modulo.key]?.pode_visualizar ?? false}
                        onCheckedChange={() => togglePermission(modulo.key, 'pode_visualizar')}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={permissions[modulo.key]?.pode_editar ?? false}
                        onCheckedChange={() => togglePermission(modulo.key, 'pode_editar')}
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={permissions[modulo.key]?.pode_deletar ?? false}
                        onCheckedChange={() => togglePermission(modulo.key, 'pode_deletar')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salvar Permissões
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

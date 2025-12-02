import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ExpiringDocument {
  id: string;
  nome: string;
  data_vencimento: string;
  tipo?: string;
  categoria?: string;
  entity_type: 'loja' | 'professional';
  entity_id: string;
  entity_name: string;
  days_until_expiry: number;
}

export const DocumentNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadExpiringDocuments = async () => {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Load expiring loja documents
      const { data: lojaDocuments } = await supabase
        .from('loja_documents')
        .select(`
          id,
          nome,
          data_vencimento,
          loja:lojas(id, nome)
        `)
        .not('data_vencimento', 'is', null)
        .lte('data_vencimento', thirtyDaysFromNow.toISOString().split('T')[0]);

      // Load expiring professional documents
      const { data: professionalDocuments } = await supabase
        .from('professional_documents')
        .select(`
          id,
          nome,
          data_vencimento,
          professional:profissionais(id, nome)
        `)
        .not('data_vencimento', 'is', null)
        .lte('data_vencimento', thirtyDaysFromNow.toISOString().split('T')[0]);

      const allNotifications: ExpiringDocument[] = [];

      // Process loja documents
      if (lojaDocuments) {
        lojaDocuments.forEach((doc: any) => {
          if (doc.data_vencimento && doc.loja) {
            const expiry = new Date(doc.data_vencimento);
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            allNotifications.push({
              id: doc.id,
              nome: doc.nome,
              data_vencimento: doc.data_vencimento,
              tipo: doc.tipo,
              entity_type: 'loja',
              entity_id: doc.loja.id,
              entity_name: doc.loja.nome,
              days_until_expiry: daysUntilExpiry
            });
          }
        });
      }

      // Process professional documents
      if (professionalDocuments) {
        professionalDocuments.forEach((doc: any) => {
          if (doc.data_vencimento && doc.professional) {
            const expiry = new Date(doc.data_vencimento);
            const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
            
            allNotifications.push({
              id: doc.id,
              nome: doc.nome,
              data_vencimento: doc.data_vencimento,
              categoria: doc.categoria,
              entity_type: 'professional',
              entity_id: doc.professional.id,
              entity_name: doc.professional.nome,
              days_until_expiry: daysUntilExpiry
            });
          }
        });
      }

      // Sort by days until expiry (most urgent first)
      allNotifications.sort((a, b) => a.days_until_expiry - b.days_until_expiry);
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading expiring documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpiringDocuments();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadExpiringDocuments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (notification: ExpiringDocument) => {
    if (notification.entity_type === 'loja') {
      navigate('/cadastro-lojas');
    } else {
      navigate('/cadastro-profissionais');
    }
  };

  const expiredCount = notifications.filter(n => n.days_until_expiry < 0).length;
  const expiringCount = notifications.filter(n => n.days_until_expiry >= 0).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Notificações de Documentos</h3>
            <p className="text-sm text-muted-foreground">
              {expiredCount > 0 && `${expiredCount} vencido${expiredCount > 1 ? 's' : ''}`}
              {expiredCount > 0 && expiringCount > 0 && ' • '}
              {expiringCount > 0 && `${expiringCount} a vencer`}
            </p>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum documento próximo do vencimento
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{notification.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.entity_type === 'loja' ? 'Loja' : 'Profissional'}: {notification.entity_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {new Date(notification.data_vencimento).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge 
                        variant={notification.days_until_expiry < 0 ? 'destructive' : 'default'}
                        className="flex-shrink-0"
                      >
                        {notification.days_until_expiry < 0
                          ? 'Vencido'
                          : `${notification.days_until_expiry} dias`
                        }
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

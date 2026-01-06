import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, ArrowRight, LayoutDashboard, Calculator, Users, Bell, 
  Plane, Heart, Banknote, BookOpen
} from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onStartTour: () => void;
  onSkip: () => void;
}

const features = [
  { icon: LayoutDashboard, title: 'Dashboard', description: 'Visão geral completa' },
  { icon: Calculator, title: 'Simulador', description: 'Folha de pagamento' },
  { icon: Users, title: 'Profissionais', description: 'Gestão de pessoas' },
  { icon: Bell, title: 'Alertas', description: 'Notificações importantes' },
  { icon: Plane, title: 'Férias', description: 'Controle de períodos' },
  { icon: Heart, title: 'ASO', description: 'Exames ocupacionais' },
  { icon: Banknote, title: 'Empréstimos', description: 'Controle financeiro' },
  { icon: BookOpen, title: 'Relatórios', description: 'Análises e dados' },
];

export function WelcomeModal({ open, onStartTour, onSkip }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => onSkip()}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl">
            Bem-vindo ao Sistema RH! 🎉
          </DialogTitle>
          <DialogDescription className="text-base">
            Seu sistema completo de gestão de pessoas está pronto para uso.
          </DialogDescription>
        </DialogHeader>

        {/* Quick feature grid */}
        <div className="grid grid-cols-4 gap-3 py-4">
          {features.map((feature, i) => (
            <Card 
              key={i} 
              className="border-0 bg-muted/50 hover:bg-muted transition-colors"
            >
              <CardContent className="p-3 text-center">
                <feature.icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                <p className="text-xs font-medium truncate">{feature.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={onStartTour} className="w-full gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Fazer tour guiado
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
            Já conheço o sistema, pular
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Você pode reiniciar o tour a qualquer momento nas Configurações
        </p>
      </DialogContent>
    </Dialog>
  );
}

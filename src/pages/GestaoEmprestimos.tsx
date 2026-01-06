import { GestaoEmprestimos as GestaoEmprestimosComponent } from '@/components/folha/GestaoEmprestimos';

const GestaoEmprestimos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestão de Empréstimos</h1>
        <p className="text-muted-foreground">
          Controle de empréstimos empresa e CLT dos funcionários
        </p>
      </div>
      
      <GestaoEmprestimosComponent />
    </div>
  );
};

export default GestaoEmprestimos;

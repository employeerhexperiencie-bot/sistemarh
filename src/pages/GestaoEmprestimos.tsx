import { GestaoEmprestimos as GestaoEmprestimosComponent } from '@/components/folha/GestaoEmprestimos';
import { Layout } from '@/components/Layout';

const GestaoEmprestimos = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Empréstimos</h1>
          <p className="text-muted-foreground">
            Controle de empréstimos empresa e CLT dos funcionários
          </p>
        </div>
        
        <GestaoEmprestimosComponent />
      </div>
    </Layout>
  );
};

export default GestaoEmprestimos;

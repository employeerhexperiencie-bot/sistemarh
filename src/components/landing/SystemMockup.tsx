import { 
  LayoutDashboard, Users, Wallet, Gift, ScanFace, Calendar, 
  Stethoscope, Bell, Search, TrendingUp, CheckCircle2, AlertCircle,
  FileText, Calculator, Receipt
} from 'lucide-react';

/**
 * Mockups fiéis das telas do Sistema RH, construídos com HTML/CSS
 * para garantir representação real (sem texto quebrado de IA).
 */

/**
 * Wrapper que escala o mockup proporcionalmente para caber em qualquer
 * container, mantendo o design real do desktop e centralizando no mobile.
 * Renderiza em uma "viewport" fixa de 880x420 e escala via CSS para preencher.
 */
const MockupViewport = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-50">
    <div
      className="origin-center"
      style={{
        width: '880px',
        height: '420px',
        transform: 'scale(var(--mockup-scale, 1))',
      }}
    >
      {children}
    </div>
    <style>{`
      .mockup-host { --mockup-scale: 1; }
      @media (max-width: 1023px) { .mockup-host { --mockup-scale: 0.78; } }
      @media (max-width: 767px)  { .mockup-host { --mockup-scale: 0.55; } }
      @media (max-width: 480px)  { .mockup-host { --mockup-scale: 0.42; } }
    `}</style>
  </div>
);

const SidebarMock = ({ active = 'Dashboard' }: { active?: string }) => {
  const items = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Users, label: 'Profissionais' },
    { icon: Calculator, label: 'Folha' },
    { icon: Gift, label: 'Benefícios' },
    { icon: ScanFace, label: 'Ponto Facial' },
    { icon: Calendar, label: 'Férias' },
    { icon: Stethoscope, label: 'ASO' },
    { icon: Receipt, label: 'Holerites' },
  ];
  return (
    <div className="w-44 bg-white border-r border-slate-200 p-3 flex flex-col gap-1 shrink-0">
      <div className="flex items-center gap-2 px-2 py-3 mb-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-[10px]">RH</span>
        </div>
        <span className="text-slate-900 font-semibold text-sm">Sistema RH</span>
      </div>
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
            active === label 
              ? 'bg-primary/10 text-primary font-semibold' 
              : 'text-slate-600'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
};

const HeaderMock = ({ title }: { title: string }) => (
  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
    <div className="flex items-center gap-3">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 text-xs text-slate-500">
        <Search className="w-3 h-3" /> Buscar...
      </div>
      <Bell className="w-4 h-4 text-slate-400" />
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-glow" />
    </div>
  </div>
);

// ============ DASHBOARD MOCKUP ============
export function DashboardMockup() {
  const kpis = [
    { label: 'Profissionais', value: '278', trend: '+12', color: 'text-primary' },
    { label: 'Folha do mês', value: 'R$ 142.380', trend: '-3%', color: 'text-success' },
    { label: 'Alertas ativos', value: '12', trend: '4 críticos', color: 'text-warning' },
    { label: 'Conformidade', value: '98%', trend: 'OK', color: 'text-success' },
  ];

  return (
    <div className="mockup-host w-full h-full relative">
      <MockupViewport>
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex w-full h-full text-slate-900">
          <SidebarMock active="Dashboard" />
          <div className="flex-1 flex flex-col">
            <HeaderMock title="Painel Executivo · Outubro 2025" />
            <div className="p-4 flex-1 overflow-hidden bg-slate-50">
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {kpis.map((k) => (
                  <div key={k.label} className="bg-white rounded-lg border border-slate-200 p-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{k.value}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${k.color}`}>{k.trend}</p>
                  </div>
                ))}
              </div>
              {/* Chart + alerts */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-slate-900">Evolução da Folha</p>
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {[40, 55, 48, 70, 65, 85, 78].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full rounded-t bg-gradient-to-t from-primary to-primary-glow" 
                          style={{ height: `${h}%` }} 
                        />
                        <span className="text-[9px] text-slate-400">
                          {['Abr','Mai','Jun','Jul','Ago','Set','Out'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-900 mb-3">Próximos vencimentos</p>
                  <div className="space-y-2.5">
                    {[
                      { icon: Stethoscope, t: 'ASO · Maria S.', d: 'em 3 dias', c: 'text-destructive' },
                      { icon: Calendar, t: 'Férias · João S.', d: 'em 7 dias', c: 'text-warning' },
                      { icon: FileText, t: 'CNH · Pedro L.', d: 'em 12 dias', c: 'text-warning' },
                      { icon: Stethoscope, t: 'ASO · Ana C.', d: 'em 18 dias', c: 'text-success' },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <a.icon className={`w-3.5 h-3.5 ${a.c} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-medium text-slate-900 truncate">{a.t}</p>
                          <p className="text-[9px] text-slate-500">{a.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MockupViewport>
    </div>
  );
}

// ============ FOLHA MOCKUP ============
export function FolhaMockup() {
  const rows = [
    { nome: 'Maria S.', salario: '3.500,00', liquido: '3.180,45', status: 'ok' },
    { nome: 'João S.', salario: '4.200,00', liquido: '3.890,12', status: 'ok' },
    { nome: 'Ana C.', salario: '3.200,00', liquido: '2.950,30', status: 'ok' },
    { nome: 'Pedro L.', salario: '5.100,00', liquido: '4.620,88', status: 'warn' },
    { nome: 'Carla S.', salario: '3.800,00', liquido: '3.480,15', status: 'ok' },
  ];
  return (
    <div className="mockup-host w-full h-full relative">
      <MockupViewport>
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex w-full h-full text-slate-900">
          <SidebarMock active="Folha" />
          <div className="flex-1 flex flex-col">
            <HeaderMock title="Central de Fechamentos · Folha Outubro/2025" />
            <div className="p-4 flex-1 overflow-hidden bg-slate-50">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Profissionais</p>
                  <p className="text-xl font-bold text-primary mt-1">45</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Total bruto</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">R$ 187.230</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-[10px] text-slate-500 uppercase">Total líquido</p>
                  <p className="text-xl font-bold text-success mt-1">R$ 142.380</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                  <div className="col-span-4">Profissional</div>
                  <div className="col-span-3 text-right">Salário base</div>
                  <div className="col-span-3 text-right">Líquido</div>
                  <div className="col-span-2 text-center">Status</div>
                </div>
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-slate-100 last:border-0">
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20" />
                      <span className="text-slate-900 font-medium">{r.nome}</span>
                    </div>
                    <div className="col-span-3 text-right text-slate-600">R$ {r.salario}</div>
                    <div className="col-span-3 text-right font-semibold text-slate-900">R$ {r.liquido}</div>
                    <div className="col-span-2 flex justify-center">
                      {r.status === 'ok' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-success font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Conferido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-warning font-medium">
                          <AlertCircle className="w-3 h-3" /> Revisar
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MockupViewport>
    </div>
  );
}

// ============ CADASTRO MOCKUP ============
export function CadastroMockup() {
  const tabs = ['Dados', 'Endereço', 'Contratuais', 'Documentos', 'Benefícios', 'ASO', 'EPI', 'Férias', 'Empréstimos', 'Histórico'];
  return (
    <div className="mockup-host w-full h-full relative">
      <MockupViewport>
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex w-full h-full text-slate-900">
          <SidebarMock active="Profissionais" />
          <div className="flex-1 flex flex-col">
            <HeaderMock title="Cadastro do Profissional" />
            <div className="p-4 flex-1 overflow-hidden bg-slate-50">
              <div className="bg-white rounded-lg border border-slate-200 p-4 h-full">
                {/* Profile head */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-glow shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Maria Silva Costa</p>
                    <p className="text-[11px] text-slate-500">Atendente · Tennessee Steak House · Admissão 12/03/2023</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-semibold">Ativo</span>
                </div>
                {/* Tabs */}
                <div className="flex items-center gap-1 mt-3 overflow-hidden">
                  {tabs.map((t, i) => (
                    <div
                      key={t}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap ${
                        i === 0 ? 'bg-primary text-white' : 'text-slate-500 bg-slate-50'
                      }`}
                    >
                      {t}
                    </div>
                  ))}
                </div>
                {/* Form */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { l: 'CPF', v: '•••.•••.•••-••' },
                    { l: 'RG', v: '••.•••.•••-•' },
                    { l: 'Data de nascimento', v: '••/••/••••' },
                    { l: 'Estado civil', v: 'Solteira' },
                    { l: 'Telefone', v: '(••) •••••-••••' },
                    { l: 'E-mail', v: '••••••@••••••.com' },
                  ].map((f) => (
                    <div key={f.l}>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">{f.l}</p>
                      <div className="px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-xs text-slate-900">
                        {f.v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MockupViewport>
    </div>
  );
}

// ============ BENEFICIOS MOCKUP ============
export function BeneficiosMockup() {
  const totals = [
    { label: 'Vale Transporte', value: 'R$ 8.450' },
    { label: 'Vale Refeição', value: 'R$ 12.340' },
    { label: 'Cesta Básica', value: 'R$ 5.600' },
    { label: 'Plano de Saúde', value: 'R$ 18.900' },
  ];
  const rows = [
    { nome: 'Maria Silva', vt: true, vr: true, cesta: true, odonto: true },
    { nome: 'João Santos', vt: true, vr: true, cesta: false, odonto: true },
    { nome: 'Ana Costa', vt: true, vr: true, cesta: true, odonto: false },
    { nome: 'Pedro Lima', vt: false, vr: true, cesta: true, odonto: true },
  ];
  return (
    <div className="mockup-host w-full h-full relative">
      <MockupViewport>
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex w-full h-full text-slate-900">
          <SidebarMock active="Benefícios" />
          <div className="flex-1 flex flex-col">
            <HeaderMock title="Gestão de Benefícios · Outubro 2025" />
            <div className="p-4 flex-1 overflow-hidden bg-slate-50">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {totals.map((t, i) => (
                  <div key={i} className={`rounded-lg p-3 border ${
                    i === 1 ? 'bg-primary/5 border-primary/30' : 'bg-white border-slate-200'
                  }`}>
                    <p className="text-[10px] text-slate-500">{t.label}</p>
                    <p className="text-base font-bold text-slate-900 mt-1">{t.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase border-b border-slate-200 bg-slate-50">
                  <div className="col-span-4">Profissional</div>
                  <div className="col-span-2 text-center">VT</div>
                  <div className="col-span-2 text-center">VR</div>
                  <div className="col-span-2 text-center">Cesta</div>
                  <div className="col-span-2 text-center">Odonto</div>
                </div>
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-12 px-4 py-2.5 text-xs border-b border-slate-100 last:border-0 items-center">
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20" />
                      <span className="text-slate-900 font-medium">{r.nome}</span>
                    </div>
                    {[r.vt, r.vr, r.cesta, r.odonto].map((v, j) => (
                      <div key={j} className="col-span-2 flex justify-center">
                        {v ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </MockupViewport>
    </div>
  );
}

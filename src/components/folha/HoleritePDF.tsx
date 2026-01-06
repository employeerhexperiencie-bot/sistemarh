import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EventoFolha {
  codigo: string;
  descricao: string;
  tipo: 'provento' | 'desconto';
  valor: number;
  referencia?: string;
}

interface DadosHolerite {
  // Empresa
  empresaNome: string;
  empresaCNPJ: string;
  empresaEndereco: string;
  
  // Funcionário
  nome: string;
  matricula: string;
  cpf: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string;
  
  // Loja
  loja: string;
  lojaEndereco?: string;
  
  // Folha
  competencia: string;
  salarioBase: number;
  eventos: EventoFolha[];
  totalProventos: number;
  totalDescontos: number;
  liquido: number;
  
  // Dados bancários
  banco?: string;
  agencia?: string;
  conta?: string;
  
  // Extras
  baseINSS?: number;
  baseFGTS?: number;
  fgtsDeposito?: number;
  baseIRRF?: number;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
};

export const gerarHoleritePDF = (dados: DadosHolerite): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // Colors
  const primaryColor: [number, number, number] = [10, 132, 255]; // #0A84FF
  const darkGray: [number, number, number] = [51, 51, 51];
  const lightGray: [number, number, number] = [128, 128, 128];
  const tableHeaderBg: [number, number, number] = [240, 240, 240];
  
  let yPos = margin;
  
  // ========== HEADER ==========
  // Company logo placeholder (blue rectangle)
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos, 25, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPRESA', margin + 12.5, yPos + 7, { align: 'center' });
  
  // Company info
  doc.setTextColor(...darkGray);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(dados.empresaNome, margin + 30, yPos + 5);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightGray);
  doc.text(`CNPJ: ${dados.empresaCNPJ}`, margin + 30, yPos + 10);
  
  // Competência (right aligned)
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO DE PAGAMENTO', pageWidth - margin, yPos + 3, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Competência: ${dados.competencia}`, pageWidth - margin, yPos + 9, { align: 'right' });
  
  yPos += 18;
  
  // Separator line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;
  
  // ========== EMPLOYEE INFO ==========
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, contentWidth, 28, 2, 2, 'F');
  
  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO FUNCIONÁRIO', margin + 4, yPos + 6);
  
  const col1 = margin + 4;
  const col2 = margin + contentWidth / 3;
  const col3 = margin + (contentWidth / 3) * 2;
  
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text('Nome', col1, yPos + 12);
  doc.text('Matrícula', col2, yPos + 12);
  doc.text('CPF', col3, yPos + 12);
  
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(dados.nome, col1, yPos + 17);
  doc.text(dados.matricula, col2, yPos + 17);
  doc.text(dados.cpf || '-', col3, yPos + 17);
  
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text('Cargo', col1, yPos + 22);
  doc.text('Loja/Depto', col2, yPos + 22);
  doc.text('Admissão', col3, yPos + 22);
  
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(dados.cargo, col1, yPos + 27);
  doc.text(dados.loja, col2, yPos + 27);
  doc.text(formatDate(dados.dataAdmissao), col3, yPos + 27);
  
  yPos += 34;
  
  // ========== EVENTOS TABLE ==========
  const proventos = dados.eventos.filter(e => e.tipo === 'provento');
  const descontos = dados.eventos.filter(e => e.tipo === 'desconto');
  
  // Proventos
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('PROVENTOS', margin, yPos + 4);
  
  yPos += 6;
  
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Cód.', 'Descrição', 'Ref.', 'Valor']],
    body: proventos.map(e => [
      e.codigo,
      e.descricao,
      e.referencia || '-',
      formatCurrency(e.valor),
    ]),
    foot: [['', 'TOTAL PROVENTOS', '', formatCurrency(dados.totalProventos)]],
    theme: 'plain',
    headStyles: {
      fillColor: tableHeaderBg,
      textColor: darkGray,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: darkGray,
    },
    footStyles: {
      fillColor: [232, 245, 233],
      textColor: [46, 125, 50],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 6;
  
  // Descontos
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(211, 47, 47);
  doc.text('DESCONTOS', margin, yPos + 4);
  
  yPos += 6;
  
  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Cód.', 'Descrição', 'Ref.', 'Valor']],
    body: descontos.map(e => [
      e.codigo,
      e.descricao,
      e.referencia || '-',
      formatCurrency(e.valor),
    ]),
    foot: [['', 'TOTAL DESCONTOS', '', formatCurrency(dados.totalDescontos)]],
    theme: 'plain',
    headStyles: {
      fillColor: tableHeaderBg,
      textColor: darkGray,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: darkGray,
    },
    footStyles: {
      fillColor: [255, 235, 238],
      textColor: [211, 47, 47],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 8;
  
  // ========== LÍQUIDO ==========
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LÍQUIDO A RECEBER', margin + 6, yPos + 9);
  
  doc.setFontSize(14);
  doc.text(formatCurrency(dados.liquido), pageWidth - margin - 6, yPos + 9, { align: 'right' });
  
  yPos += 20;
  
  // Nota: Bases de cálculo (INSS, FGTS, IRRF) removidas - holerite simplificado
  
  // ========== DADOS BANCÁRIOS ==========
  if (dados.banco) {
    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.text('DADOS BANCÁRIOS', margin, yPos);
    
    doc.setFontSize(8);
    doc.setTextColor(...darkGray);
    doc.text(`Banco: ${dados.banco}  |  Agência: ${dados.agencia || '-'}  |  Conta: ${dados.conta || '-'}`, margin, yPos + 5);
    
    yPos += 12;
  }
  
  // ========== ASSINATURA ==========
  yPos = doc.internal.pageSize.getHeight() - 35;
  
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, margin + 70, yPos);
  doc.line(pageWidth - margin - 70, yPos, pageWidth - margin, yPos);
  
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text('Assinatura do Empregador', margin + 35, yPos + 5, { align: 'center' });
  doc.text('Assinatura do Funcionário', pageWidth - margin - 35, yPos + 5, { align: 'center' });
  
  // ========== FOOTER ==========
  yPos = doc.internal.pageSize.getHeight() - 15;
  
  doc.setFontSize(6);
  doc.setTextColor(...lightGray);
  doc.text(
    `Documento gerado em ${new Date().toLocaleString('pt-BR')} | Sistema de Gestão RH`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  
  return doc;
};

// Função para gerar holerite em lote
export const gerarHoleritesEmLote = (funcionarios: DadosHolerite[]): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  funcionarios.forEach((func, index) => {
    if (index > 0) {
      doc.addPage();
    }
    
    // Reutiliza a lógica do holerite individual
    const tempDoc = gerarHoleritePDF(func);
    // Copy content (simplified - in production would need more robust solution)
  });
  
  return doc;
};

// Interface para dados reais do holerite
export interface DadosHoleriteReal {
  salarioBase: number;
  faltas?: { dias: number; valor: number };
  vales?: { descricao: string; valor: number }[];
  emprestimos?: { descricao: string; valor: number }[];
  adiantamento?: number;
  adiantamentoDia20?: number; // 40% do salário combinado pago no dia 20
}

// Gerar holerite com dados reais (sem descontos legais, apenas empréstimos/vales/faltas)
// Considera pagamento do dia 20 (40% do salário) e dia 5 (60% restante)
export const gerarHoleriteReal = (
  nome: string,
  matricula: string,
  loja: string,
  salarioBase: number,
  competencia: string,
  dados: DadosHoleriteReal
): DadosHolerite => {
  // Calcula o adiantamento do dia 20 (40% do salário combinado)
  const adiantamentoDia20 = dados.adiantamentoDia20 ?? Math.round(salarioBase * 0.4);
  
  const eventos: EventoFolha[] = [
    { codigo: '001', descricao: 'Salário Combinado', tipo: 'provento', valor: salarioBase },
  ];
  
  // Descontos - APENAS empréstimos, vales, faltas e adiantamento dia 20
  
  // Adiantamento do dia 20 (40% do salário)
  if (adiantamentoDia20 > 0) {
    eventos.push({ 
      codigo: '100', 
      descricao: 'Adiantamento Dia 20 (40%)', 
      tipo: 'desconto', 
      valor: adiantamentoDia20,
      referencia: '40% do salário'
    });
  }
  
  // Faltas - desconta apenas os dias que faltou (sem DSR)
  if (dados.faltas && dados.faltas.dias > 0) {
    const valorDia = salarioBase / 30; // Valor do dia
    const descontoFaltas = valorDia * dados.faltas.dias;
    eventos.push({ 
      codigo: '101', 
      descricao: 'Faltas', 
      tipo: 'desconto', 
      valor: Math.round(descontoFaltas),
      referencia: `${dados.faltas.dias} dia(s)`
    });
  }
  
  // Vales
  if (dados.vales && dados.vales.length > 0) {
    dados.vales.forEach((vale, index) => {
      eventos.push({ 
        codigo: `10${2 + index}`, 
        descricao: vale.descricao, 
        tipo: 'desconto', 
        valor: vale.valor 
      });
    });
  }
  
  // Adiantamento extra (além do dia 20)
  if (dados.adiantamento && dados.adiantamento > 0) {
    eventos.push({ 
      codigo: '105', 
      descricao: 'Adiantamento Extra', 
      tipo: 'desconto', 
      valor: dados.adiantamento 
    });
  }
  
  // Empréstimos
  if (dados.emprestimos && dados.emprestimos.length > 0) {
    dados.emprestimos.forEach((emp, index) => {
      eventos.push({ 
        codigo: `11${index}`, 
        descricao: emp.descricao, 
        tipo: 'desconto', 
        valor: emp.valor 
      });
    });
  }
  
  const totalProventos = eventos.filter(e => e.tipo === 'provento').reduce((s, e) => s + e.valor, 0);
  const totalDescontos = eventos.filter(e => e.tipo === 'desconto').reduce((s, e) => s + e.valor, 0);
  
  // Valor líquido é o que será pago no dia 5 (após descontar o adiantamento do dia 20)
  const liquidoDia5 = totalProventos - totalDescontos;
  
  return {
    empresaNome: 'EMPRESA MODELO LTDA',
    empresaCNPJ: '12.345.678/0001-90',
    empresaEndereco: 'Av. Paulista, 1000 - São Paulo/SP',
    nome,
    matricula,
    cpf: '',
    cargo: '',
    departamento: 'Operações',
    dataAdmissao: '',
    loja,
    competencia,
    salarioBase,
    eventos,
    totalProventos,
    totalDescontos,
    liquido: liquidoDia5,
  };
};

// Mock para demonstração (simplificado, sem descontos legais)
export const gerarHoleriteMock = (
  nome: string,
  matricula: string,
  loja: string,
  salarioBase: number,
  competencia: string
): DadosHolerite => {
  const eventos: EventoFolha[] = [
    { codigo: '001', descricao: 'Salário Combinado', tipo: 'provento', valor: salarioBase },
  ];
  
  // Descontos - APENAS empréstimos, vales e faltas (sem INSS, IRRF, VT 6%)
  
  // Simular algumas faltas ocasionalmente (apenas dias, sem DSR)
  if (Math.random() > 0.8) {
    const diasFalta = Math.floor(Math.random() * 3) + 1;
    const valorDia = salarioBase / 30;
    eventos.push({ 
      codigo: '101', 
      descricao: 'Faltas', 
      tipo: 'desconto', 
      valor: Math.round(valorDia * diasFalta),
      referencia: `${diasFalta} dia(s)`
    });
  }
  
  // Adiantamento (40%)
  if (Math.random() > 0.5) {
    eventos.push({ codigo: '102', descricao: 'Adiantamento Salarial', tipo: 'desconto', valor: Math.round(salarioBase * 0.4) });
  }
  
  // Vale ocasional
  if (Math.random() > 0.7) {
    eventos.push({ codigo: '103', descricao: 'Vale', tipo: 'desconto', valor: Math.floor(Math.random() * 200) + 50 });
  }
  
  // Empréstimo ocasional
  if (Math.random() > 0.85) {
    eventos.push({ codigo: '104', descricao: 'Empréstimo', tipo: 'desconto', valor: Math.floor(Math.random() * 300) + 100 });
  }
  
  const totalProventos = eventos.filter(e => e.tipo === 'provento').reduce((s, e) => s + e.valor, 0);
  const totalDescontos = eventos.filter(e => e.tipo === 'desconto').reduce((s, e) => s + e.valor, 0);
  
  return {
    empresaNome: 'EMPRESA MODELO LTDA',
    empresaCNPJ: '12.345.678/0001-90',
    empresaEndereco: 'Av. Paulista, 1000 - São Paulo/SP',
    nome,
    matricula,
    cpf: `${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}`,
    cargo: ['Vendedor', 'Caixa', 'Repositor', 'Supervisor'][Math.floor(Math.random() * 4)],
    departamento: 'Operações',
    dataAdmissao: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    loja,
    competencia,
    salarioBase,
    eventos,
    totalProventos,
    totalDescontos,
    liquido: totalProventos - totalDescontos,
  };
};

// Interface para dados do holerite de VT
export interface DadosHoleriteVT {
  valorDiario: number;
  diasUteisMes: number;
  diasTrabalhados: number;
  diasFalta: number;
  diasAtestado: number;
  diasFerias: number;
}

// Gerar holerite de Vale Transporte
export const gerarHoleriteVT = (
  nome: string,
  matricula: string,
  loja: string,
  competencia: string,
  dados: DadosHoleriteVT
): DadosHolerite => {
  const valorBruto = dados.valorDiario * dados.diasUteisMes;
  const descontoFaltas = dados.valorDiario * dados.diasFalta;
  const descontoAtestados = dados.valorDiario * dados.diasAtestado;
  const descontoFerias = dados.valorDiario * dados.diasFerias;
  const valorLiquido = dados.valorDiario * dados.diasTrabalhados;
  
  const eventos: EventoFolha[] = [
    { 
      codigo: '001', 
      descricao: 'Vale Transporte', 
      tipo: 'provento', 
      valor: Math.round(valorBruto),
      referencia: `${dados.diasUteisMes} dias x ${dados.valorDiario.toFixed(2)}`
    },
  ];
  
  // Descontos por faltas
  if (dados.diasFalta > 0) {
    eventos.push({ 
      codigo: '101', 
      descricao: 'Desc. Faltas', 
      tipo: 'desconto', 
      valor: Math.round(descontoFaltas),
      referencia: `${dados.diasFalta} dia(s)`
    });
  }
  
  // Descontos por atestados
  if (dados.diasAtestado > 0) {
    eventos.push({ 
      codigo: '102', 
      descricao: 'Desc. Atestados', 
      tipo: 'desconto', 
      valor: Math.round(descontoAtestados),
      referencia: `${dados.diasAtestado} dia(s)`
    });
  }
  
  // Descontos por férias
  if (dados.diasFerias > 0) {
    eventos.push({ 
      codigo: '103', 
      descricao: 'Desc. Férias', 
      tipo: 'desconto', 
      valor: Math.round(descontoFerias),
      referencia: `${dados.diasFerias} dia(s)`
    });
  }
  
  const totalProventos = eventos.filter(e => e.tipo === 'provento').reduce((s, e) => s + e.valor, 0);
  const totalDescontos = eventos.filter(e => e.tipo === 'desconto').reduce((s, e) => s + e.valor, 0);
  
  return {
    empresaNome: 'EMPRESA MODELO LTDA',
    empresaCNPJ: '12.345.678/0001-90',
    empresaEndereco: 'Av. Paulista, 1000 - São Paulo/SP',
    nome,
    matricula,
    cpf: '',
    cargo: '',
    departamento: 'Vale Transporte',
    dataAdmissao: '',
    loja,
    competencia,
    salarioBase: valorBruto,
    eventos,
    totalProventos,
    totalDescontos,
    liquido: Math.round(valorLiquido),
  };
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ========== TYPES ==========
interface ProfissionalRelatorio {
  nome: string;
  matricula: string;
  cpf?: string;
  cargo?: string;
  loja: string;
  salarioBase: number;
  dataAdmissao?: string;
  nomeMae?: string;
  // Calculados
  valorDia20?: number;
  valorDia5?: number;
  valorVT?: number;
  valorVR?: number;
  valorCesta?: number;
  valorAlelo?: number;
  diasTrabalhados?: number;
  diasUteis?: number;
  faltas?: number;
  descontoFaltas?: number;
  emprestimo?: number;
  vales?: number;
  totalDescontos?: number;
  insalubridade?: number;
}

interface ConfigRelatorio {
  empresaNome: string;
  empresaCNPJ: string;
  competencia: string;
  loja?: string;
  geradoPor?: string;
}

// Formato R$ inteiro (sem centavos) - decisão de produto p/ relatórios e holerites
const formatCurrency = (v: number) =>
  Math.round(v).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

const PRIMARY: [number, number, number] = [10, 132, 255];
const DARK: [number, number, number] = [51, 51, 51];
const LIGHT: [number, number, number] = [128, 128, 128];
const HEADER_BG: [number, number, number] = [240, 240, 240];

function addHeader(doc: jsPDF, config: ConfigRelatorio, titulo: string) {
  const pw = doc.internal.pageSize.getWidth();
  const m = 15;

  doc.setFillColor(...PRIMARY);
  doc.roundedRect(m, 10, pw - m * 2, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, pw / 2, 20, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${config.empresaNome} | CNPJ: ${config.empresaCNPJ} | Competência: ${config.competencia}${config.loja ? ` | Loja: ${config.loja}` : ''}`, pw / 2, 25, { align: 'center' });

  return 35;
}

function addFooter(doc: jsPDF, geradoPor?: string) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(...LIGHT);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}${geradoPor ? ` por ${geradoPor}` : ''} | Página ${i}/${pages}`, pw / 2, ph - 8, { align: 'center' });
  }
}

// ========== 1. RELATÓRIO ADIANTAMENTO DIA 20 ==========
export function gerarRelatorioDia20(profs: ProfissionalRelatorio[], config: ConfigRelatorio): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const yStart = addHeader(doc, config, 'RELATÓRIO DE ADIANTAMENTO - DIA 20');

  const body = profs.map((p, i) => [
    i + 1,
    p.matricula,
    p.nome,
    p.cargo || '-',
    formatCurrency(p.salarioBase),
    '40%',
    formatCurrency(p.valorDia20 || p.salarioBase * 0.4),
  ]);

  const totalDia20 = profs.reduce((s, p) => s + (p.valorDia20 || p.salarioBase * 0.4), 0);

  autoTable(doc, {
    startY: yStart,
    margin: { left: 15, right: 15 },
    head: [['#', 'Matrícula', 'Nome', 'Cargo', 'Salário Base', '% Adiant.', 'Valor Dia 20']],
    body,
    foot: [['', '', `Total: ${profs.length} profissionais`, '', '', '', formatCurrency(totalDia20)]],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7, textColor: DARK },
    footStyles: { fillColor: [232, 245, 233], textColor: [46, 125, 50], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 10 }, 4: { halign: 'right' }, 5: { halign: 'center' }, 6: { halign: 'right' } },
  });

  addFooter(doc, config.geradoPor);
  return doc;
}

// ========== 2. RELATÓRIO FOLHA DE PAGAMENTO DIA 5 ==========
export function gerarRelatorioDia5(profs: ProfissionalRelatorio[], config: ConfigRelatorio): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const yStart = addHeader(doc, config, 'RELATÓRIO DE FOLHA DE PAGAMENTO - DIA 5');

  const body = profs.map((p, i) => [
    i + 1,
    p.matricula,
    p.nome,
    formatCurrency(p.salarioBase),
    formatCurrency(p.valorDia20 || 0),
    p.faltas || 0,
    formatCurrency(p.descontoFaltas || 0),
    formatCurrency(p.emprestimo || 0),
    formatCurrency(p.vales || 0),
    formatCurrency(p.totalDescontos || 0),
    formatCurrency(p.valorDia5 || 0),
  ]);

  const totalDia5 = profs.reduce((s, p) => s + (p.valorDia5 || 0), 0);
  const totalDesc = profs.reduce((s, p) => s + (p.totalDescontos || 0), 0);

  autoTable(doc, {
    startY: yStart,
    margin: { left: 10, right: 10 },
    head: [['#', 'Matr.', 'Nome', 'Sal. Base', 'Adiant. D20', 'Faltas', 'Desc. Faltas', 'Emprést.', 'Vales', 'Tot. Desc.', 'Líquido D5']],
    body,
    foot: [['', '', `Total: ${profs.length}`, '', '', '', '', '', '', formatCurrency(totalDesc), formatCurrency(totalDia5)]],
    theme: 'striped',
    headStyles: { fillColor: PRIMARY, textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 6.5, textColor: DARK },
    footStyles: { fillColor: [232, 245, 233], textColor: [46, 125, 50], fontStyle: 'bold', fontSize: 7 },
    columnStyles: { 0: { cellWidth: 8 }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'center' }, 6: { halign: 'right' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'right' } },
  });

  addFooter(doc, config.geradoPor);
  return doc;
}

// ========== 3. RELATÓRIO VALE TRANSPORTE ==========
export function gerarRelatorioVT(profs: ProfissionalRelatorio[], config: ConfigRelatorio): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const yStart = addHeader(doc, config, 'RELATÓRIO DE VALE TRANSPORTE');

  const profsVT = profs.filter(p => (p.valorVT || 0) > 0);

  const body = profsVT.map((p, i) => [
    i + 1,
    p.matricula,
    p.nome,
    p.diasUteis || 26,
    p.diasTrabalhados || 26,
    p.faltas || 0,
    formatCurrency(p.valorVT || 0),
  ]);

  const totalVT = profsVT.reduce((s, p) => s + (p.valorVT || 0), 0);

  autoTable(doc, {
    startY: yStart,
    margin: { left: 15, right: 15 },
    head: [['#', 'Matrícula', 'Nome', 'Dias Úteis', 'Dias Trab.', 'Faltas', 'Valor VT']],
    body,
    foot: [['', '', `Total: ${profsVT.length} profissionais`, '', '', '', formatCurrency(totalVT)]],
    theme: 'striped',
    headStyles: { fillColor: [0, 150, 136], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: DARK },
    footStyles: { fillColor: [224, 247, 250], textColor: [0, 121, 107], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 10 }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'right' } },
  });

  addFooter(doc, config.geradoPor);
  return doc;
}

// ========== 4. RELATÓRIO CESTA BÁSICA ==========
export function gerarRelatorioCesta(profs: ProfissionalRelatorio[], config: ConfigRelatorio): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const yStart = addHeader(doc, config, 'RELATÓRIO DE CESTA BÁSICA');

  const profsCesta = profs.filter(p => (p.valorCesta || 0) > 0);

  const body = profsCesta.map((p, i) => [
    i + 1,
    p.matricula,
    p.nome,
    p.cargo || '-',
    p.loja,
    formatCurrency(p.valorCesta || 0),
    '_______________',
  ]);

  const totalCesta = profsCesta.reduce((s, p) => s + (p.valorCesta || 0), 0);

  autoTable(doc, {
    startY: yStart,
    margin: { left: 15, right: 15 },
    head: [['#', 'Matrícula', 'Nome', 'Cargo', 'Loja', 'Valor', 'Assinatura']],
    body,
    foot: [['', '', `Total: ${profsCesta.length} profissionais`, '', '', formatCurrency(totalCesta), '']],
    theme: 'striped',
    headStyles: { fillColor: [121, 85, 72], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: DARK },
    footStyles: { fillColor: [239, 235, 233], textColor: [78, 52, 46], fontStyle: 'bold', fontSize: 8 },
    columnStyles: { 0: { cellWidth: 10 }, 5: { halign: 'right' }, 6: { cellWidth: 35 } },
  });

  addFooter(doc, config.geradoPor);
  return doc;
}

// ========== 5. RELATÓRIO VA ALELO ==========
export function gerarRelatorioAlelo(profs: ProfissionalRelatorio[], config: ConfigRelatorio): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const yStart = addHeader(doc, config, 'RELATÓRIO VALE ALIMENTAÇÃO ALELO');

  const profsAlelo = profs.filter(p => (p.valorAlelo || 0) > 0);

  const body = profsAlelo.map((p, i) => [
    i + 1,
    p.matricula,
    p.nome,
    p.cpf || '-',
    p.nomeMae || '-',
    formatDate(p.dataAdmissao),
    p.diasTrabalhados || 26,
    formatCurrency(p.valorAlelo || 0),
  ]);

  const totalAlelo = profsAlelo.reduce((s, p) => s + (p.valorAlelo || 0), 0);

  autoTable(doc, {
    startY: yStart,
    margin: { left: 10, right: 10 },
    head: [['#', 'Matrícula', 'Nome', 'CPF', 'Nome da Mãe', 'Admissão', 'Dias', 'Valor VA']],
    body,
    foot: [['', '', `Total: ${profsAlelo.length}`, '', '', '', '', formatCurrency(totalAlelo)]],
    theme: 'striped',
    headStyles: { fillColor: [211, 47, 47], textColor: [255, 255, 255], fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: DARK },
    footStyles: { fillColor: [255, 235, 238], textColor: [198, 40, 40], fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: { 0: { cellWidth: 8 }, 6: { halign: 'center' }, 7: { halign: 'right' } },
  });

  addFooter(doc, config.geradoPor);
  return doc;
}

// ========== 6. RECIBOS DE PAGAMENTO (3 POR PÁGINA A4) ==========
export function gerarRecibos3PorPagina(profs: ProfissionalRelatorio[], config: ConfigRelatorio): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const m = 10;
  const reciboHeight = 85;
  const gap = 5;

  profs.forEach((p, idx) => {
    const posOnPage = idx % 3;
    if (idx > 0 && posOnPage === 0) doc.addPage();

    const yBase = m + posOnPage * (reciboHeight + gap);

    // Border
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(m, yBase, pw - m * 2, reciboHeight);

    // Header band
    doc.setFillColor(...PRIMARY);
    doc.rect(m, yBase, pw - m * 2, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE PAGAMENTO', m + 4, yBase + 7);
    doc.setFontSize(7);
    doc.text(`${config.competencia} | ${config.empresaNome}`, pw - m - 4, yBase + 7, { align: 'right' });

    // Employee info
    doc.setTextColor(...DARK);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const y1 = yBase + 16;
    doc.setTextColor(...LIGHT);
    doc.text('Nome:', m + 4, y1);
    doc.text('Matrícula:', m + 100, y1);
    doc.text('Cargo:', m + 140, y1);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text(p.nome, m + 18, y1);
    doc.text(p.matricula, m + 118, y1);
    doc.text(p.cargo || '-', m + 154, y1);

    doc.setFont('helvetica', 'normal');
    const y2 = y1 + 5;
    doc.setTextColor(...LIGHT);
    doc.text('Loja:', m + 4, y2);
    doc.text('CPF:', m + 100, y2);
    doc.setTextColor(...DARK);
    doc.text(p.loja, m + 16, y2);
    doc.text(p.cpf || '-', m + 112, y2);

    // Values table (mini)
    const y3 = y2 + 7;
    const colW = (pw - m * 2 - 8) / 4;

    // Header row
    doc.setFillColor(...HEADER_BG);
    doc.rect(m + 4, y3, pw - m * 2 - 8, 6, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Sal. Base', m + 6, y3 + 4);
    doc.text('Adiant. D20', m + 6 + colW, y3 + 4);
    doc.text('Descontos', m + 6 + colW * 2, y3 + 4);
    doc.text('Líquido D5', m + 6 + colW * 3, y3 + 4);

    // Values row
    const y4 = y3 + 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(formatCurrency(p.salarioBase), m + 6, y4 + 5);
    doc.text(formatCurrency(p.valorDia20 || 0), m + 6 + colW, y4 + 5);
    doc.setTextColor(211, 47, 47);
    doc.text(formatCurrency(p.totalDescontos || 0), m + 6 + colW * 2, y4 + 5);
    doc.setTextColor(46, 125, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(p.valorDia5 || 0), m + 6 + colW * 3, y4 + 5);

    // Signature lines
    const y5 = yBase + reciboHeight - 15;
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.2);
    doc.line(m + 10, y5, m + 80, y5);
    doc.line(pw - m - 80, y5, pw - m - 10, y5);
    doc.setTextColor(...LIGHT);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Empregador', m + 45, y5 + 4, { align: 'center' });
    doc.text('Funcionário', pw - m - 45, y5 + 4, { align: 'center' });

    // Cut line (dashed)
    if (posOnPage < 2 && idx + 1 < profs.length) {
      const yCut = yBase + reciboHeight + gap / 2;
      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(m, yCut, pw - m, yCut);
      doc.setLineDashPattern([], 0);
    }
  });

  addFooter(doc, config.geradoPor);
  return doc;
}

// ========== EXPORT CSV ==========
export function exportarCSV(profs: ProfissionalRelatorio[], tipo: string, config: ConfigRelatorio): void {
  let headers: string[];
  let rows: string[][];

  switch (tipo) {
    case 'dia_20':
      headers = ['Matrícula', 'Nome', 'Cargo', 'Loja', 'Salário Base', 'Valor Dia 20'];
      rows = profs.map(p => [p.matricula, p.nome, p.cargo || '', p.loja, String(p.salarioBase), String(p.valorDia20 || p.salarioBase * 0.4)]);
      break;
    case 'dia_5':
      headers = ['Matrícula', 'Nome', 'Salário Base', 'Adiant. D20', 'Faltas', 'Desc. Faltas', 'Empréstimo', 'Vales', 'Tot. Descontos', 'Líquido D5'];
      rows = profs.map(p => [p.matricula, p.nome, String(p.salarioBase), String(p.valorDia20 || 0), String(p.faltas || 0), String(p.descontoFaltas || 0), String(p.emprestimo || 0), String(p.vales || 0), String(p.totalDescontos || 0), String(p.valorDia5 || 0)]);
      break;
    case 'vt':
      headers = ['Matrícula', 'Nome', 'Loja', 'Dias Úteis', 'Dias Trabalhados', 'Faltas', 'Valor VT'];
      rows = profs.filter(p => (p.valorVT || 0) > 0).map(p => [p.matricula, p.nome, p.loja, String(p.diasUteis || 26), String(p.diasTrabalhados || 26), String(p.faltas || 0), String(p.valorVT || 0)]);
      break;
    case 'cesta':
      headers = ['Matrícula', 'Nome', 'Cargo', 'Loja', 'Valor Cesta'];
      rows = profs.filter(p => (p.valorCesta || 0) > 0).map(p => [p.matricula, p.nome, p.cargo || '', p.loja, String(p.valorCesta || 0)]);
      break;
    case 'alelo':
      headers = ['Matrícula', 'Nome', 'CPF', 'Nome Mãe', 'Admissão', 'Dias Trab.', 'Valor VA'];
      rows = profs.filter(p => (p.valorAlelo || 0) > 0).map(p => [p.matricula, p.nome, p.cpf || '', p.nomeMae || '', p.dataAdmissao || '', String(p.diasTrabalhados || 26), String(p.valorAlelo || 0)]);
      break;
    default:
      headers = ['Matrícula', 'Nome', 'Cargo', 'Loja', 'Salário Base'];
      rows = profs.map(p => [p.matricula, p.nome, p.cargo || '', p.loja, String(p.salarioBase)]);
  }

  const csvContent = [
    `Relatório: ${tipo} | Competência: ${config.competencia} | Empresa: ${config.empresaNome}`,
    '',
    headers.join(';'),
    ...rows.map(r => r.join(';')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio_${tipo}_${config.competencia}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export type { ProfissionalRelatorio, ConfigRelatorio };

// ========== TERMO DE RESCISÃO ==========
export function gerarRelatorioRescisao(profissional: {
  nome: string;
  matricula: string;
  cpf: string;
  cargo: string;
  loja: string;
  salario: number;
  dataAdmissao: string;
  dataDemissao: string;
  motivoDemissao: string;
  avisoPrevio: string;
}): void {
  const doc = new jsPDF();
  const hoje = new Date().toLocaleDateString('pt-BR');

  // Cabeçalho
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMO DE RESCISÃO DE CONTRATO', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emitido em: ${hoje}`, 195, 28, { align: 'right' });

  // Dados do profissional
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO COLABORADOR', 14, 40);

  const dados = [
    ['Nome:', profissional.nome],
    ['Matrícula:', profissional.matricula],
    ['CPF:', profissional.cpf],
    ['Cargo:', profissional.cargo],
    ['Loja:', profissional.loja],
    ['Salário:', `R$ ${profissional.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Data Admissão:', profissional.dataAdmissao],
    ['Data Demissão:', profissional.dataDemissao],
    ['Motivo:', profissional.motivoDemissao],
    ['Aviso Prévio:', profissional.avisoPrevio],
  ];

  // Calcular verbas (estimativas)
  const dataAdm = new Date(profissional.dataAdmissao + 'T12:00:00');
  const dataDem = new Date(profissional.dataDemissao + 'T12:00:00');
  const mesesTrabalhados = Math.max(
    0,
    Math.floor((dataDem.getTime() - dataAdm.getTime()) / (1000 * 60 * 60 * 24 * 30))
  );
  const avos = Math.min(12, Math.floor((dataDem.getMonth() - dataAdm.getMonth() + 12) % 12) || 12);
  const decimoProporional = (profissional.salario / 12) * avos;
  const feriasProporcionais = (profissional.salario / 12) * Math.min(12, mesesTrabalhados % 12 || 12);
  const umTercoFerias = feriasProporcionais / 3;

  autoTable(doc, {
    startY: 45,
    body: dados,
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 45 } },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Verbas rescisórias estimadas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('VERBAS RESCISÓRIAS ESTIMADAS', 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Verba', 'Valor Estimado']],
    body: [
      ['13º Salário Proporcional', `R$ ${decimoProporional.toFixed(2)}`],
      ['Férias Proporcionais', `R$ ${feriasProporcionais.toFixed(2)}`],
      ['1/3 Constitucional sobre Férias', `R$ ${umTercoFerias.toFixed(2)}`],
      ['TOTAL ESTIMADO', `R$ ${(decimoProporional + feriasProporcionais + umTercoFerias).toFixed(2)}`],
    ],
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`rescisao_${profissional.matricula}_${profissional.dataDemissao}.pdf`);
}

import { jsPDF } from 'jspdf';
import { Pedido, Cliente, Representada } from '../types';
import { formatarMoeda, formatarData } from '../utils';

/**
 * Generates a clean, professional vector-based PDF for a single sales order.
 */
export function gerarPedidoPDF(
  pedido: Pedido, 
  cliente?: Cliente, 
  representada?: Representada,
  empresaRepresentacao?: any
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryColor = [16, 185, 129]; // Emerald 500
  const darkColor = [30, 41, 59]; // Slate 800
  const lightColor = [248, 250, 252]; // Slate 50
  const borderColor = [226, 232, 240]; // Slate 200

  // Header Banner
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  let headerTextOffset = 30;

  // Draw logo of represented brand (Fábrica) if present
  if (representada?.logoUrl && representada.logoUrl.startsWith('data:image/')) {
    try {
      // Draw logo in white card in header
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 6, 26, 26, 2, 2, 'F');
      doc.addImage(representada.logoUrl, 'PNG', 14, 8, 22, 22);
      headerTextOffset = 44;
    } catch (err) {
      console.error('Erro ao adicionar logo no PDF:', err);
    }
  } else {
    // App Logo/Badge (Simulated in drawing)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 12, 10, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('R', 20, 19.5, { align: 'center' });
    headerTextOffset = 30;
  }

  // Header Text adaptive to company representation (Multi-company / multi-tenant)
  const repName = empresaRepresentacao?.nomeFantasia || 'REPRESENTAÇÃO COMERCIAL';
  const repRazao = empresaRepresentacao?.razaoSocial || 'Sistema Integrado RepresentaPRO';
  const repCNPJ = empresaRepresentacao?.cnpj ? `CNPJ: ${empresaRepresentacao.cnpj}` : 'Cópia Digital de Pedido de Venda';

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(repName.toUpperCase(), headerTextOffset, 15);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 200, 210);
  doc.text(repRazao, headerTextOffset, 21);
  doc.setTextColor(148, 163, 184); // light gray
  doc.text(repCNPJ, headerTextOffset, 27);
  if (empresaRepresentacao?.telefone || empresaRepresentacao?.email) {
    const contactInfo = [empresaRepresentacao.telefone, empresaRepresentacao.email].filter(Boolean).join(' | ');
    doc.text(contactInfo, headerTextOffset, 32);
  } else {
    doc.text('Gerado através do RepresentaPRO', headerTextOffset, 32);
  }

  // Order Title & ID
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 48, 180, 14, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(15, 48, 180, 14, 'D');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`PEDIDO DE VENDA: #${pedido.numeroPedido}`, 20, 56.5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Emissão: ${formatarData(pedido.dataPedido)}`, 110, 56.5);
  doc.text(`Status: ${pedido.status.toUpperCase()}`, 155, 56.5);

  let y = 68;

  // Representada (Fábrica)
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(15, y, 88, 32, 'F');
  doc.rect(15, y, 88, 32, 'D');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('REPRESENTADA / FÁBRICA', 20, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Nome: ${representada?.nomeFantasia || 'N/A'}`, 20, y + 13);
  doc.text(`CNPJ: ${representada?.cnpj || 'N/A'}`, 20, y + 19);
  doc.text(`Contato: ${representada?.contato || 'N/A'}`, 20, y + 25);

  // Cliente (Comprador)
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(107, y, 88, 32, 'F');
  doc.rect(107, y, 88, 32, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENTE / COMPRADOR', 112, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Nome: ${cliente?.nomeFantasia || 'N/A'}`, 112, y + 13);
  doc.text(`CNPJ: ${cliente?.cnpj || 'N/A'}`, 112, y + 19);
  doc.text(`Local: ${cliente?.cidade || 'N/A'} - ${cliente?.uf || ''}`, 112, y + 25);

  y += 38;

  // Item List Table Header
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(15, y, 180, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Descrição do Produto', 20, y + 5.5);
  doc.text('Quant.', 120, y + 5.5, { align: 'center' });
  doc.text('Preço Unit.', 150, y + 5.5, { align: 'right' });
  doc.text('Total Item', 185, y + 5.5, { align: 'right' });

  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  // Table Body
  (pedido.itens || []).forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.rect(15, y, 180, 8, 'F');
    }
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(15, y + 8, 195, y + 8);

    doc.setFontSize(8);
    doc.text(item.descricao, 20, y + 5.5);
    doc.text(String(item.quantidade), 120, y + 5.5, { align: 'center' });
    doc.text(formatarMoeda(item.precoUnitario), 150, y + 5.5, { align: 'right' });
    doc.text(formatarMoeda(item.totalItem), 185, y + 5.5, { align: 'right' });

    y += 8;
  });

  y += 6;

  // Observações se houver
  if (pedido.observacoes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Observações de Faturamento:', 15, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitObs = doc.splitTextToSize(pedido.observacoes, 180);
    doc.text(splitObs, 15, y + 4.5);
    y += 6 + (splitObs.length * 4.5);
  }

  y += 5;

  // Total Summary Panel
  doc.setFillColor(248, 250, 252);
  doc.rect(115, y, 80, 24, 'F');
  doc.rect(115, y, 80, 24, 'D');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('VALORES TOTAIS', 120, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Total Produtos faturados:', 120, y + 12);
  doc.text(formatarMoeda(pedido.valorTotal), 190, y + 12, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Sua Comissão (${pedido.comissaoPercentual}%):`, 120, y + 18);
  doc.text(formatarMoeda(pedido.valorComissao), 190, y + 18, { align: 'right' });

  // Add a nice footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Este documento é uma cópia digital informativa de representação comercial.', 105, 285, { align: 'center' });

  // Save
  doc.save(`Pedido_${pedido.numeroPedido}_${representada?.nomeFantasia || 'Venda'}.pdf`);
}

/**
 * Generates a monthly summary report in PDF.
 */
export function gerarResumoMensalPDF(pedidos: Pedido[], clientes: Cliente[], representadas: Representada[], anoMes: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [16, 185, 129]; // Emerald 500
  const darkColor = [30, 41, 59]; // Slate 800
  const lightColor = [248, 250, 252]; // Slate 50
  const borderColor = [226, 232, 240]; // Slate 200

  // Filter orders of the given month (e.g. "2026-07")
  const pedidosMes = pedidos.filter(p => p.dataPedido.startsWith(anoMes));
  const pedidosValidos = pedidosMes.filter(p => p.status !== 'Cancelado');

  const totalVendas = pedidosValidos.reduce((sum, p) => sum + p.valorTotal, 0);
  const totalComissoes = pedidosValidos.reduce((sum, p) => sum + p.valorComissao, 0);
  const comissaoPaga = pedidosMes.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.valorComissao, 0);
  const comissaoPendente = pedidosMes.filter(p => p.status === 'Faturado' || p.status === 'Pendente').reduce((sum, p) => sum + p.valorComissao, 0);

  const [ano, mes] = anoMes.split('-');
  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mesNome = mesesNomes[parseInt(mes) - 1] || mes;

  // Header Banner
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RELATÓRIO DE VENDAS E COMISSÕES', 15, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Período de Referência: ${mesNome} de ${ano}`, 15, 23);

  // Quick stats panels (4 cols)
  const colW = 42;
  const colY = 44;
  
  // Stat 1: Total faturado
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(15, colY, colW, 20, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(15, colY, colW, 20, 'D');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('TOTAL DE VENDAS', 18, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(totalVendas), 18, colY + 13);

  // Stat 2: Total comissoes
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(15 + colW + 4, colY, colW, 20, 'F');
  doc.rect(15 + colW + 4, colY, colW, 20, 'D');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('COMISSÕES TOTAIS', 15 + colW + 7, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(totalComissoes), 15 + colW + 7, colY + 13);

  // Stat 3: Comissões Recebidas
  doc.setFillColor(240, 253, 244); // light green bg
  doc.rect(15 + (colW * 2) + 8, colY, colW, 20, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.rect(15 + (colW * 2) + 8, colY, colW, 20, 'D');
  doc.setTextColor(21, 128, 61); // green-700
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('VALORES RECEBIDOS', 15 + (colW * 2) + 11, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(comissaoPaga), 15 + (colW * 2) + 11, colY + 13);

  // Stat 4: Comissões Pendentes
  doc.setFillColor(254, 243, 199); // light amber bg
  doc.rect(15 + (colW * 3) + 12, colY, colW, 20, 'F');
  doc.setDrawColor(253, 230, 138);
  doc.rect(15 + (colW * 3) + 12, colY, colW, 20, 'D');
  doc.setTextColor(180, 83, 9); // amber-700
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('VALORES A RECEBER', 15 + (colW * 3) + 15, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(comissaoPendente), 15 + (colW * 3) + 15, colY + 13);

  let y = 72;

  // Table header
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  doc.text('Nº Pedido', 17, y + 5.5);
  doc.text('Data', 38, y + 5.5);
  doc.text('Cliente', 56, y + 5.5);
  doc.text('Representada', 105, y + 5.5);
  doc.text('Status', 148, y + 5.5);
  doc.text('Valor Total', 170, y + 5.5, { align: 'right' });
  doc.text('Comissão', 193, y + 5.5, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

  if (pedidosMes.length === 0) {
    doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    doc.rect(15, y, 180, 12, 'F');
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum pedido de venda registrado para este mês.', 105, y + 7, { align: 'center' });
    y += 12;
  } else {
    pedidosMes.forEach((p, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.rect(15, y, 180, 8, 'F');
      }
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(15, y + 8, 195, y + 8);

      const cli = clientes.find(c => c.id === p.clienteId);
      const rep = representadas.find(r => r.id === p.representadaId);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${p.numeroPedido}`, 17, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.text(formatarData(p.dataPedido), 38, y + 5.5);
      doc.text(cli?.nomeFantasia ? (cli.nomeFantasia.length > 24 ? cli.nomeFantasia.substring(0, 22) + '..' : cli.nomeFantasia) : 'N/A', 56, y + 5.5);
      doc.text(rep?.nomeFantasia ? (rep.nomeFantasia.length > 20 ? rep.nomeFantasia.substring(0, 18) + '..' : rep.nomeFantasia) : 'N/A', 105, y + 5.5);
      doc.text(p.status.toUpperCase(), 148, y + 5.5);
      doc.text(formatarMoeda(p.valorTotal), 170, y + 5.5, { align: 'right' });
      doc.text(formatarMoeda(p.valorComissao), 193, y + 5.5, { align: 'right' });

      y += 8;
    });
  }

  // Totals Row
  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 10, 'F');
  doc.rect(15, y, 180, 10, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RESUMO DE TOTAIS:', 18, y + 6.5);
  
  doc.setFontSize(8);
  doc.text(`Vendas Ativas: ${formatarMoeda(totalVendas)}`, 75, y + 6.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Comissões Est.: ${formatarMoeda(totalComissoes)}`, 135, y + 6.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 105, 285, { align: 'center' });

  doc.save(`Resumo_Mensal_${ano}_${mes}.pdf`);
}

/**
 * Generates a complete Dashboard summary report in PDF with custom filters.
 */
export function gerarDashboardPDF(
  pedidos: Pedido[],
  clientes: Cliente[],
  representadas: Representada[],
  filtros: { representadaId: string; clienteId: string; status: string; dataDe: string; dataAte: string },
  empresaRepresentacao?: any
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [16, 185, 129]; // Emerald 500
  const darkColor = [30, 41, 59]; // Slate 800
  const lightColor = [248, 250, 252]; // Slate 50
  const borderColor = [226, 232, 240]; // Slate 200

  // Apply filters to calculate stats
  let filteredPedidos = pedidos;
  if (filtros.representadaId && filtros.representadaId !== 'Todos') {
    filteredPedidos = filteredPedidos.filter(p => p.representadaId === filtros.representadaId);
  }
  if (filtros.clienteId && filtros.clienteId !== 'Todos') {
    filteredPedidos = filteredPedidos.filter(p => p.clienteId === filtros.clienteId);
  }
  if (filtros.status && filtros.status !== 'Todos') {
    filteredPedidos = filteredPedidos.filter(p => p.status === filtros.status);
  }
  if (filtros.dataDe) {
    filteredPedidos = filteredPedidos.filter(p => p.dataPedido >= filtros.dataDe);
  }
  if (filtros.dataAte) {
    filteredPedidos = filteredPedidos.filter(p => p.dataPedido <= filtros.dataAte);
  }

  const activePedidos = filteredPedidos.filter(p => p.status !== 'Cancelado');
  const totalVendas = activePedidos.reduce((sum, p) => sum + p.valorTotal, 0);
  const totalComissoes = activePedidos.reduce((sum, p) => sum + p.valorComissao, 0);
  const comissaoPaga = filteredPedidos.filter(p => p.status === 'Pago').reduce((sum, p) => sum + p.valorComissao, 0);
  const comissaoPendente = filteredPedidos.filter(p => p.status === 'Faturado' || p.status === 'Pendente').reduce((sum, p) => sum + p.valorComissao, 0);

  // Header Banner
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  
  const repName = empresaRepresentacao?.nomeFantasia || 'PAINEL DE REPRESENTAÇÃO COMERCIAL';
  const repDetails = empresaRepresentacao?.razaoSocial 
    ? `${empresaRepresentacao.razaoSocial} | CNPJ: ${empresaRepresentacao.cnpj}`
    : 'Relatório Executivo de Desempenho e Métricas';

  doc.text(repName.toUpperCase(), 15, 13);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 200, 210);
  doc.text(repDetails, 15, 19);

  // Filter labels
  let filterText = 'Filtros aplicados: ';
  const repSelected = representadas.find(r => r.id === filtros.representadaId);
  const cliSelected = clientes.find(c => c.id === filtros.clienteId);
  filterText += `Fábrica: ${repSelected ? repSelected.nomeFantasia : 'Todas'} | `;
  filterText += `Cliente: ${cliSelected ? cliSelected.nomeFantasia : 'Todos'} | `;
  filterText += `Status: ${filtros.status || 'Todos'}`;
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(filterText, 15, 26);

  // Quick stats panels (4 cols)
  const colW = 42;
  const colY = 42;
  
  // Stat 1: Total faturado
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(15, colY, colW, 20, 'F');
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(15, colY, colW, 20, 'D');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('TOTAL DE VENDAS', 18, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(totalVendas), 18, colY + 13);

  // Stat 2: Total comissoes
  doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
  doc.rect(15 + colW + 4, colY, colW, 20, 'F');
  doc.rect(15 + colW + 4, colY, colW, 20, 'D');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('COMISSÕES TOTAIS', 15 + colW + 7, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(totalComissoes), 15 + colW + 7, colY + 13);

  // Stat 3: Comissões Recebidas
  doc.setFillColor(240, 253, 244); // light green bg
  doc.rect(15 + (colW * 2) + 8, colY, colW, 20, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.rect(15 + (colW * 2) + 8, colY, colW, 20, 'D');
  doc.setTextColor(21, 128, 61); // green-700
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('COMISSÃO RECEBIDA', 15 + (colW * 2) + 11, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(comissaoPaga), 15 + (colW * 2) + 11, colY + 13);

  // Stat 4: Comissões Pendentes
  doc.setFillColor(254, 243, 199); // light amber bg
  doc.rect(15 + (colW * 3) + 12, colY, colW, 20, 'F');
  doc.setDrawColor(253, 230, 138);
  doc.rect(15 + (colW * 3) + 12, colY, colW, 20, 'D');
  doc.setTextColor(180, 83, 9); // amber-700
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('COMISSÃO A RECEBER', 15 + (colW * 3) + 15, colY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(formatarMoeda(comissaoPendente), 15 + (colW * 3) + 15, colY + 13);

  let y = 70;

  // Section 1: Performance by Factory
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(15, y, 180, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DESEMPENHO POR FABRICANTE / REPRESENTADA', 18, y + 4.8);

  y += 7;
  
  // Table head
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 7, 'F');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(7.5);
  doc.text('Fábrica / Marca', 18, y + 4.8);
  doc.text('Volume Faturado', 90, y + 4.8);
  doc.text('Comissão Estimada', 140, y + 4.8);
  doc.text('% do Total', 178, y + 4.8);

  y += 7;

  representadas.forEach((rep, index) => {
    const repPedidos = activePedidos.filter(p => p.representadaId === rep.id);
    const repVendas = repPedidos.reduce((sum, p) => sum + p.valorTotal, 0);
    const repComissao = repPedidos.reduce((sum, p) => sum + p.valorComissao, 0);
    const percent = totalVendas > 0 ? (repVendas / totalVendas) * 100 : 0;

    if (index % 2 === 1) {
      doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
      doc.rect(15, y, 180, 7, 'F');
    }
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.line(15, y + 7, 195, y + 7);

    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(rep.nomeFantasia, 18, y + 4.8);
    doc.setFont('helvetica', 'normal');
    doc.text(formatarMoeda(repVendas), 90, y + 4.8);
    doc.text(formatarMoeda(repComissao), 140, y + 4.8);
    doc.text(`${percent.toFixed(1)}%`, 178, y + 4.8);

    y += 7;
  });

  y += 6;

  // Section 2: Recent Transactions under active filters
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(15, y, 180, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TRANSAÇÕES RECENTES FILTRADAS (MÁXIMO 12)', 18, y + 4.8);

  y += 7;

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, y, 180, 7, 'F');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(7.5);
  doc.text('Cód. Pedido', 18, y + 4.8);
  doc.text('Emissão', 38, y + 4.8);
  doc.text('Cliente', 56, y + 4.8);
  doc.text('Representada', 105, y + 4.8);
  doc.text('Status', 148, y + 4.8);
  doc.text('Total', 170, y + 4.8, { align: 'right' });
  doc.text('Comissão', 193, y + 4.8, { align: 'right' });

  y += 7;

  const pedidosList = filteredPedidos.slice(0, 12);
  if (pedidosList.length === 0) {
    doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
    doc.rect(15, y, 180, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhum pedido atende aos filtros definidos.', 105, y + 6, { align: 'center' });
    y += 10;
  } else {
    pedidosList.forEach((p, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
        doc.rect(15, y, 180, 7, 'F');
      }
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(15, y + 7, 195, y + 7);

      const cli = clientes.find(c => c.id === p.clienteId);
      const rep = representadas.find(r => r.id === p.representadaId);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(`#${p.numeroPedido}`, 18, y + 4.8);
      doc.setFont('helvetica', 'normal');
      doc.text(formatarData(p.dataPedido), 38, y + 4.8);
      doc.text(cli?.nomeFantasia ? (cli.nomeFantasia.length > 22 ? cli.nomeFantasia.substring(0, 20) + '..' : cli.nomeFantasia) : 'N/A', 56, y + 4.8);
      doc.text(rep?.nomeFantasia ? (rep.nomeFantasia.length > 18 ? rep.nomeFantasia.substring(0, 16) + '..' : rep.nomeFantasia) : 'N/A', 105, y + 4.8);
      doc.text(p.status.toUpperCase(), 148, y + 4.8);
      doc.text(formatarMoeda(p.valorTotal), 170, y + 4.8, { align: 'right' });
      doc.text(formatarMoeda(p.valorComissao), 193, y + 4.8, { align: 'right' });

      y += 7;
    });
  }

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Relatório Executivo Gerencial gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 105, 285, { align: 'center' });

  doc.save(`Dashboard_Executivo_${new Date().toISOString().split('T')[0]}.pdf`);
}

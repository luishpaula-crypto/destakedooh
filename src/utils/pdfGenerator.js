import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from '../assets/logo.png';

// --- HELPER: Draw Image with Aspect Ratio (Contain) ---
const drawImageProp = (doc, imgData, x, y, maxW, maxH) => {
    try {
        const props = doc.getImageProperties(imgData);
        const ratio = props.width / props.height;
        const targetRatio = maxW / maxH;

        let w = maxW;
        let h = maxH;

        if (ratio > targetRatio) {
            h = maxW / ratio;
        } else {
            w = maxH * ratio;
        }

        const cx = x + (maxW - w) / 2;
        const cy = y + (maxH - h) / 2;

        doc.addImage(imgData, props.fileType || 'PNG', cx, cy, w, h);
    } catch (err) {
        console.error("Error drawing image prop", err);
        doc.setFontSize(8);
        doc.text("Erro Img", x, y + 10);
    }
};

export const generateQuotePDF = async (quote) => {
    // ... [Previous Quote Logic] ...
    // Re-implementing standard Quote PDF logic briefly to keep it working
    const doc = new jsPDF({ orientation: 'landscape' });
    const themeColor = [9, 55, 88];

    const logoWidth = 45;
    const logoHeight = 16;
    drawImageProp(doc, logo, 14, 10, logoWidth, logoHeight);

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text("Proposta Comercial de Mídia DOOH", 14 + logoWidth + 5, 22);

    doc.setDrawColor(...themeColor);
    doc.line(14, 38, 283, 38);

    if (quote.controlNumber) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Nº Controle: ${quote.controlNumber}`, 283, 22, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.text("Dados do Cliente", 14, 48);

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Razão Social: ${quote.client.name}`, 14, 56);
    if (quote.campaignName) doc.text(`Campanha: ${quote.campaignName}`, 140, 56);

    doc.text(`CNPJ: ${quote.client.cnpj || 'N/A'}`, 14, 61);
    doc.text(`Período: ${new Date(quote.startDate).toLocaleDateString()} a ${new Date(quote.endDate).toLocaleDateString()}`, 140, 61);

    doc.text(`Contato: ${quote.client.contact_name}`, 14, 66);

    const summaryY = 80;
    doc.setFontSize(14);
    doc.setTextColor(...themeColor);
    doc.text("Resumo do Investimento", 14, summaryY);

    const tableData = quote.assets.map(asset => [
        asset.name,
        `${quote.days} dias`,
        `R$ ${parseFloat(asset.valor_tabela_unit || asset.daily_rate).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `R$ ${(parseFloat(asset.valor_tabela_unit || asset.daily_rate) * quote.days).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    tableData.push(['', '', 'TOTAL', `R$ ${quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);

    doc.autoTable({
        startY: summaryY + 5,
        head: [['Ativo', 'Período', 'Diária', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: themeColor }
    });

    // --- OBSERVATIONS / PAYMENT INFO ---
    let y = doc.lastAutoTable.finalY + 10;

    // Check if space exists
    if (y > 170) { doc.addPage(); y = 20; }

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont(undefined, 'bold');
    doc.text("OBSERVAÇÕES:", 14, y);
    doc.setFont(undefined, 'normal');
    doc.text("O pagamento deverá ser efetuado conforme vencimento.", 14, y + 5);

    // Local de Cobrança
    const billingAddress = `${quote.client.address || ''}, ${quote.client.bairro || ''} - ${quote.client.city || ''}/${quote.client.state || ''}`;
    doc.text(`Local de Cobrança: ${billingAddress}`, 14, y + 10);

    // --- SIGNATURES ---
    let sigY = y + 30;

    if (sigY > 190) {
        doc.addPage();
        sigY = 30;
    }
    doc.line(30, sigY, 110, sigY);
    doc.text("DESTAKE DOOH", 70, sigY + 5, { align: 'center' });
    doc.line(160, sigY, 240, sigY);
    doc.text(quote.client.name, 200, sigY + 5, { align: 'center' });

    // --- ROTEIRO / FICHA TÉCNICA ---
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(...themeColor);
    doc.text("Roteiro / Ficha Técnica", 14, 20);

    const techData = quote.assets.map(asset => {
        const fullAddress = `${asset.address} - ${asset.bairro}, ${asset.cidade}`;
        let state = asset.state || asset.uf || '';
        if (!state) {
            if (asset.cidade === 'São Paulo') state = 'SP';
            else if (asset.cidade === 'Rio de Janeiro') state = 'RJ';
        }

        const addressBlock = `${fullAddress}${state ? ` - ${state}` : ''}`;
        const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

        const detailsText = [
            `Campanha: ${quote.campaignName || '-'}`,
            `Cliente: ${quote.client.name}`,
            `Ativo: ${asset.name}`,
            `Endereço: ${addressBlock}`,
            `Dimensões: ${asset.format || 'N/A'}`,
            `Resolução: ${asset.resolution || 'N/A'}`,
            `ID: ${asset.id_4yousee || 'N/A'}`
        ].join('\n');

        return [
            { content: detailsText, mapsLink: mapsLink },
            asset.photo
        ];
    });

    doc.autoTable({
        startY: 30,
        head: [['Dados Técnicos', 'Foto']],
        body: techData,
        theme: 'grid',
        headStyles: {
            fillColor: themeColor,
            fontSize: 10,
            halign: 'left',
            valign: 'middle',
            minCellHeight: 15
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            overflow: 'linebreak',
            valign: 'middle',
            minCellHeight: 75
        },
        columnStyles: {
            0: { cellWidth: 134 },
            1: { cellWidth: 135 }
        },
        didParseCell: (data) => {
            if (data.section === 'body') {
                if (data.column.index === 0) {
                    const originalObj = data.cell.raw;
                    if (originalObj && originalObj.content) {
                        data.cell.text = originalObj.content.split('\n');
                        data.cell.raw = originalObj;
                    }
                }
                if (data.column.index === 1) {
                    data.cell.text = '';
                }
            }
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
                const img = data.cell.raw;
                if (img) {
                    try {
                        const cellWidth = data.cell.width;
                        const cellHeight = data.cell.height;
                        const posX = data.cell.x;
                        const posY = data.cell.y;
                        const padding = 2;
                        drawImageProp(doc, img, posX + padding, posY + padding, cellWidth - (padding * 2), cellHeight - (padding * 2));
                    } catch (e) {
                        doc.setFontSize(8);
                        doc.text('Sem imagem', data.cell.x + 5, data.cell.y + 10);
                    }
                }
            }
            if (data.section === 'body' && data.column.index === 0) {
                const raw = data.cell.raw;
                if (raw && raw.mapsLink) {
                    const linkText = "VER NO MAPA";
                    doc.setFontSize(8);
                    doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
                    const textX = data.cell.x + 4;
                    const textY = data.cell.y + data.cell.height - 4;
                    doc.textWithLink(linkText, textX, textY, { url: raw.mapsLink });
                }
            }
        }
    });

    doc.save(`Proposta_${quote.id}.pdf`);
};

// --- PI GENERATOR (Detailed Layout) ---
export const generatePIPDF = async (quote) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const themeColor = [227, 6, 19]; // Brand Red/Pink from Mockup? Or use Default Brand. Let's use Brand Blue or Default. 
    // Image showed Pink "F" logo but text black. Let's stick to professional Dark Blue/Black.
    const primaryColor = [0, 0, 0];

    const margin = 10;
    const pageWidth = 297;
    const contentWidth = pageWidth - (margin * 2);

    let y = margin;

    // --- HEADER BOX ---
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, 25); // Main Header Box

    // Logo Area (Left)
    drawImageProp(doc, logo, margin + 2, y + 2, 35, 21);

    // Header Middle Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text("PEDIDO DE", pageWidth / 2, y + 10, { align: 'center' });
    doc.text("INSERÇÃO", pageWidth / 2, y + 18, { align: 'center' });

    // PI Number Box (Right)
    doc.rect(pageWidth - margin - 40, y, 40, 25);
    doc.setFontSize(14);
    doc.text("PI", pageWidth - margin - 20, y + 8, { align: 'center' });
    doc.setFontSize(16);
    doc.text(`${quote.controlNumber || '000000'}`, pageWidth - margin - 20, y + 18, { align: 'center' });

    y += 25;

    // --- DATA BLOCK 1 ---
    // 3 Columns: Client | Vehicle | Order Info
    const block1Height = 35;
    doc.rect(margin, y, contentWidth, block1Height);

    // Vertical Lines
    const col1W = 90;
    const col2W = 110;
    doc.line(margin + col1W, y, margin + col1W, y + block1Height);
    doc.line(margin + col1W + col2W, y, margin + col1W + col2W, y + block1Height);

    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');

    // Col 1: Client
    let cy = y + 4;
    const cx = margin + 2;
    doc.setFont(undefined, 'bold'); doc.text("CLIENTE:", cx, cy);
    doc.setFont(undefined, 'normal'); doc.text(quote.client.name.substring(0, 35), cx + 25, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("RAZÃO SOCIAL:", cx, cy);
    doc.setFont(undefined, 'normal'); doc.text(quote.client.name.substring(0, 35), cx + 25, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("CNPJ:", cx, cy);
    doc.setFont(undefined, 'normal'); doc.text(quote.client.cnpj || '', cx + 25, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("ENDEREÇO:", cx, cy);
    doc.setFont(undefined, 'normal'); doc.text((quote.client.address || '').substring(0, 35), cx + 25, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("CIDADE/UF:", cx, cy);
    doc.setFont(undefined, 'normal'); doc.text(`${quote.client.city}/${quote.client.state}`, cx + 25, cy);

    // Col 2: Vehicle (Static Company Info)
    cy = y + 4;
    const cx2 = margin + col1W + 2;
    doc.setFont(undefined, 'bold'); doc.text("VEÍCULO:", cx2, cy);
    doc.setFont(undefined, 'normal'); doc.text("DESTAKE VEÍCULO DE COMUNICAÇÃO LTDA", cx2 + 25, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("PRAÇA:", cx2, cy);
    doc.setFont(undefined, 'normal'); doc.text("BELO HORIZONTE / MG", cx2 + 25, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("CNPJ:", cx2, cy);
    doc.setFont(undefined, 'normal'); doc.text("07.923.942/0001-90", cx2 + 25, cy); cy += 4; // Mock CNPJ from Image

    doc.setFont(undefined, 'bold'); doc.text("CONTATO:", cx2, cy);
    doc.setFont(undefined, 'normal'); doc.text("Comercial", cx2 + 25, cy);

    // Col 3: Order Info
    cy = y + 4;
    const cx3 = margin + col1W + col2W + 2;
    const startMonth = new Date(quote.startDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    doc.setFont(undefined, 'bold'); doc.text("PERÍODO:", cx3, cy);
    doc.setFont(undefined, 'normal'); doc.text(startMonth.toUpperCase(), cx3 + 20, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("EMISSÃO:", cx3, cy);
    doc.setFont(undefined, 'normal'); doc.text(new Date().toLocaleDateString(), cx3 + 20, cy); cy += 4;

    doc.setFont(undefined, 'bold'); doc.text("PIT Nº:", cx3, cy);
    doc.setFont(undefined, 'normal'); doc.text(quote.id ? quote.id.toString().substring(0, 6) : "-", cx3 + 20, cy); cy += 4;

    y += block1Height;

    // --- DATA BLOCK 2: PRODUCTS ---
    doc.rect(margin, y, contentWidth, 12);
    // Info Line
    doc.text(` Produto: Campanha DOOH - ${quote.campaignName}`, margin + 2, y + 4);
    doc.text(` Formato: Diversos`, margin + 2, y + 9);
    y += 12;

    // --- CALENDAR GRID ---
    // Logic: 31 Days Columns + Description Column + Totals
    // Widths: Desc (60mm), Days (31 * 5mm = 155mm), Totals (rest ~60mm)

    const dayColWidth = 5;
    const descColWidth = 60;
    const headerHeight = 10;

    // Draw Header
    // "COLOCAÇÃO [MONTH]"
    doc.rect(margin, y, contentWidth, headerHeight);
    doc.setFont(undefined, 'bold');
    doc.text(`COLOCAÇÃO - ${startMonth.toUpperCase()}`, margin + 2, y + 7);
    y += headerHeight;

    // Table Header (Days)
    const tableHeaderY = y;
    const rowHeight = 6;

    // Days Row
    doc.setFontSize(6);
    doc.rect(margin, y, contentWidth, rowHeight);

    // Labels
    doc.text("LOCAL / ENDEREÇO", margin + 2, y + 4);

    // Days 1..31
    for (let i = 1; i <= 31; i++) {
        const dx = margin + descColWidth + ((i - 1) * dayColWidth);
        // Vertical line for day
        doc.line(dx, y, dx, y + rowHeight);
        // Number
        doc.text(i.toString().padStart(2, '0'), dx + 1, y + 4);
    }
    // Final vertical line for days block
    doc.line(margin + descColWidth + (31 * dayColWidth), y, margin + descColWidth + (31 * dayColWidth), y + rowHeight);

    // Totals Label
    doc.text("TOTAL", margin + descColWidth + (31 * dayColWidth) + 2, y + 4);

    y += rowHeight;

    // --- ROWS ITERATION (Assets) ---
    // Determine active days based on range
    const start = new Date(quote.startDate);
    const end = new Date(quote.endDate);
    const quoteStartDay = start.getDate();
    const quoteEndDay = end.getDate();
    // Note: Simple logic assuming same month for visual grid. If spans months, PI usually shows CURRENT month.
    // We will highlight days present in the range [startDate, endDate].

    quote.assets.forEach(asset => {
        if (y > 180) { doc.addPage(); y = 20; } // Page Break Safety

        doc.rect(margin, y, contentWidth, rowHeight);

        // Asset Name
        doc.setFont(undefined, 'normal');
        doc.text(asset.name.substring(0, 35), margin + 2, y + 4);

        // Days marks
        let activeCount = 0;
        for (let i = 1; i <= 31; i++) {
            const dx = margin + descColWidth + ((i - 1) * dayColWidth);
            doc.line(dx, y, dx, y + rowHeight); // Vertical grid line

            // Check if day 'i' is in range
            // Warning: Need to check Month too ideally, but assuming single month PI for now.
            if (i >= quoteStartDay && i <= quoteEndDay) {
                // Mark X
                doc.setFont(undefined, 'bold');
                doc.text("X", dx + 1.5, y + 4);
                activeCount++;
            }
        }

        // Totals Grid Line
        const totalX = margin + descColWidth + (31 * dayColWidth);
        doc.line(totalX, y, totalX, y + rowHeight);

        // Active Count
        doc.text(`${activeCount}`, totalX + 2, y + 4);

        y += rowHeight;
    });

    // --- SUMMARY BLOCK ---
    y += 5;
    const summaryHeight = 25;
    doc.rect(margin, y, contentWidth, summaryHeight);

    // Cols within summary
    // Left: Addresses? (Already in grid). Let's put Payment Info.
    doc.setFont(undefined, 'bold');
    doc.text("OBSERVAÇÕES / PAGAMENTO:", margin + 2, y + 5);
    doc.setFont(undefined, 'normal');
    doc.text("O pagamento deverá ser efetuado conforme vencimento.", margin + 2, y + 10);
    doc.text(`Local de Cobrança: ${quote.client.address || '-'}`, margin + 2, y + 15);

    // Right: Totals
    const midX = pageWidth / 2 + 40;
    doc.line(midX, y, midX, y + summaryHeight);

    doc.setFont(undefined, 'bold');
    doc.text("VALOR BRUTO:", midX + 2, y + 5);
    doc.text(`R$ ${quote.total.toLocaleString()}`, pageWidth - margin - 2, y + 5, { align: 'right' });

    doc.text("DESCONTO:", midX + 2, y + 10);
    doc.text(`R$ ${(quote.discount || 0).toLocaleString()}`, pageWidth - margin - 2, y + 10, { align: 'right' });

    doc.setFontSize(9);
    doc.text("TOTAL LÍQUIDO:", midX + 2, y + 20);
    doc.setFontSize(11);
    doc.text(`R$ ${quote.total.toLocaleString()}`, pageWidth - margin - 2, y + 20, { align: 'right' });

    y += summaryHeight + 10;

    // --- SIGNATURES ---
    const sigY = y;
    doc.setLineWidth(0.5);

    // Destake
    doc.line(margin + 20, sigY, margin + 90, sigY);
    doc.setFontSize(8);
    doc.text("DESTAKE DOOH", margin + 55, sigY + 5, { align: 'center' });

    // Client
    doc.line(pageWidth - margin - 90, sigY, pageWidth - margin - 20, sigY);
    doc.text(quote.client.name.substring(0, 40), pageWidth - margin - 55, sigY + 5, { align: 'center' });
    doc.text("De acordo", pageWidth - margin - 55, sigY + 9, { align: 'center' });

    doc.save(`PI_${quote.controlNumber || 'Draft'}.pdf`);
};

export const generateMaintenanceReport = (maintenances) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const themeColor = [9, 55, 88];

    // Header
    const logoWidth = 50;
    const logoHeight = 18;
    drawImageProp(doc, logo, 14, 10, logoWidth, logoHeight);

    doc.setFontSize(22);
    doc.setTextColor(100);
    doc.text("Relatório de Manutenção", 283, 22, { align: 'right' });

    doc.setDrawColor(...themeColor);
    doc.setLineWidth(1);
    doc.line(14, 32, 283, 32);

    // Table
    const tableData = maintenances.map(m => [
        new Date(m.date).toLocaleDateString(),
        m.title,
        m.type,
        m.priority,
        (m.status || '').replace('_', ' '),
        m.responsible,
        `R$ ${parseFloat(m.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    doc.autoTable({
        startY: 40,
        head: [['Data', 'Título', 'Tipo', 'Prioridade', 'Status', 'Responsável', 'Custo']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: themeColor },
        styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save(`Relatorio_Manutencao_${Date.now()}.pdf`);
};

export const generateQuotesReport = (quotes, periodText) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const themeColor = [9, 55, 88];

    // Header
    const logoWidth = 50;
    const logoHeight = 18;
    drawImageProp(doc, logo, 14, 10, logoWidth, logoHeight);

    doc.setFontSize(18);
    doc.setTextColor(100);
    doc.text("Relatório de Orçamentos", 283, 20, { align: 'right' });

    doc.setFontSize(10);
    doc.text(periodText || "Geral", 283, 26, { align: 'right' });

    doc.setDrawColor(...themeColor);
    doc.setLineWidth(1);
    doc.line(14, 32, 283, 32);

    // Filter data formatting
    const tableData = quotes.map(q => [
        new Date(q.createdAt || new Date()).toLocaleDateString(),
        q.controlNumber || 'S/N',
        q.client?.name || 'Cliente N/A',
        q.campaignName || '-',
        (q.status || '').toUpperCase(),
        `${(q.assets || []).length} Painéis`,
        `R$ ${(q.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    // Calculate Total
    const totalValue = quotes.reduce((acc, q) => acc + (q.total || 0), 0);

    // Add Total Row
    tableData.push(['', '', '', '', '', 'TOTAL NO PERÍODO', `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`]);

    doc.autoTable({
        startY: 40,
        head: [['Data Criação', 'Nº Controle', 'Cliente', 'Campanha', 'Status', 'Ativos', 'Valor Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: themeColor },
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            4: { cellWidth: 25, fontStyle: 'bold' },
            6: { cellWidth: 35, fontStyle: 'bold', halign: 'right' }
        },
        didParseCell: (data) => {
            // Highlight Total Row
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [240, 240, 240];
            }
        }
    });

    // Footer stats
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Total de Orçamentos: ${quotes.length} | Aprovados: ${quotes.filter(q => q.status === 'aprovado' || q.status === 'ativo').length}`, 14, finalY);

    doc.save(`Relatorio_Orcamentos_${Date.now()}.pdf`);
};

export const generateHistoryPDF = (quotes) => {
    const doc = new jsPDF();
    const themeColor = [9, 55, 88];

    // Header
    const logoWidth = 45;
    const logoHeight = 16;
    drawImageProp(doc, logo, 14, 10, logoWidth, logoHeight);

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text("Log de Recebimento de Mídias", 14 + logoWidth + 5, 22);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 35);

    // Data Aggregation
    const historyData = [];
    quotes.forEach(quote => {
        if (quote.mediaHistory && quote.mediaHistory.length > 0) {
            quote.mediaHistory.forEach(h => {
                historyData.push([
                    new Date(h.date).toLocaleString(),
                    quote.campaignName,
                    quote.client.name,
                    h.status === 'received' ? 'Recebido' : h.status === 'rejected' ? 'Refugado' : 'Pendente',
                    h.user || '-',
                    h.note || '-'
                ]);
            });
        }
    });

    const rawHistory = [];
    quotes.forEach(quote => {
        if (quote.mediaHistory) {
            quote.mediaHistory.forEach(h => {
                rawHistory.push({
                    date: new Date(h.date),
                    data: [
                        new Date(h.date).toLocaleString(),
                        quote.campaignName,
                        quote.client.name,
                        h.status === 'received' ? 'Recebido' : h.status === 'rejected' ? 'Refugado' : 'Pendente',
                        h.user || '-',
                        h.note || '-'
                    ]
                });
            });
        }
    });
    rawHistory.sort((a, b) => b.date - a.date);
    const tableBody = rawHistory.map(item => item.data);

    doc.autoTable({
        startY: 40,
        head: [['Data/Hora', 'Campanha', 'Cliente', 'Status', 'Usuário', 'Obs']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: themeColor },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 35 }, // Date
            5: { cellWidth: 'auto' } // Obs
        }
    });

    doc.save(`Log_Midias_${Date.now()}.pdf`);
};

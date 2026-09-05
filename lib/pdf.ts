import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { CartResumo } from './calc'
import { formatMoney, formatQty } from './calc'

const PINK: [number, number, number] = [236, 72, 153]
const BLUE: [number, number, number] = [56, 189, 248]
const DARK: [number, number, number] = [26, 10, 18]
const INK: [number, number, number] = [40, 40, 48]
const MUTED: [number, number, number] = [120, 120, 130]
const GREEN: [number, number, number] = [22, 163, 106]

let logoCache: string | null = null

async function loadLogo(): Promise<{ data: string; ratio: number } | null> {
  try {
    if (!logoCache) {
      const res = await fetch('/logo-sistema-vendas.png')
      const blob = await res.blob()
      logoCache = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }
    const ratio = await new Promise<number>((resolve) => {
      const img = new window.Image()
      img.onload = () => resolve(img.width / img.height)
      img.onerror = () => resolve(1.512)
      img.src = logoCache as string
    })
    return { data: logoCache, ratio }
  } catch {
    return null
  }
}

export async function gerarRelatorioPDF(resumo: CartResumo) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentW = pageW - margin * 2

  // ---- Cabeçalho (mesmo header do site) ----
  const headerH = 66
  doc.setFillColor(...DARK)
  doc.rect(0, 0, pageW, headerH, 'F')
  doc.setFillColor(...PINK)
  doc.rect(0, headerH, pageW, 1.4, 'F')

  const logo = await loadLogo()
  if (logo) {
    const logoW = 48
    const logoH = logoW / logo.ratio
    doc.addImage(logo.data, 'PNG', (pageW - logoW) / 2, 5, logoW, logoH)
  }

  doc.setTextColor(...PINK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(19)
  doc.text('CARRINHO DE VENDAS', pageW / 2, headerH - 15, { align: 'center' })
  doc.setTextColor(...BLUE)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Vendas', pageW / 2, headerH - 7, { align: 'center' })

  let y = headerH + 12

  const sectionTitle = (text: string, color: [number, number, number]) => {
    doc.setFillColor(...color)
    doc.rect(margin, y - 4.5, 3, 6, 'F')
    doc.setTextColor(...color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(text.toUpperCase(), margin + 6, y)
    y += 4
  }

  // ---- Tabela de Produtos ----
  sectionTitle('Produtos', PINK)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Produto', 'Qtd', 'Unit.', 'Total']],
    body: resumo.linhas.map((l) => [
      l.receita.nome,
      formatQty(l.quantidade),
      formatMoney(l.unit),
      formatMoney(l.total),
    ]),
    theme: 'grid',
    headStyles: { fillColor: PINK, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
    bodyStyles: { textColor: INK, fontSize: 10 },
    alternateRowStyles: { fillColor: [252, 240, 246] },
    columnStyles: {
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 32 },
    },
  })
  // @ts-expect-error lastAutoTable is added by the plugin
  y = doc.lastAutoTable.finalY + 8

  // ---- Resumo Financeiro ----
  sectionTitle('Resumo Financeiro', BLUE)
  const linhasResumo: [string, string, boolean][] = [
    ['Valor Total', formatMoney(resumo.valorTotal), false],
    ['Desconto', `- ${formatMoney(resumo.desconto)}`, false],
    ['Valor Final', formatMoney(resumo.valorFinal), true],
    ['Custo Total', formatMoney(resumo.custoTotal), false],
    ...(resumo.comissaoPct > 0
      ? ([
          [
            `Comissão (${formatQty(resumo.comissaoPct)}%)`,
            `- ${formatMoney(resumo.comissao)}`,
            false,
          ],
        ] as [string, string, boolean][])
      : []),
    ['Lucro Líquido', formatMoney(resumo.lucroLiquido), true],
  ]
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: linhasResumo.map(([k, v]) => [k, v]),
    theme: 'plain',
    styles: { fontSize: 10.5, cellPadding: 2.4 },
    columnStyles: {
      0: { textColor: INK, cellWidth: contentW * 0.6 },
      1: { halign: 'right', textColor: INK, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      const row = linhasResumo[data.row.index]
      if (!row) return
      const isDestaque = row[2]
      const label = row[0]
      if (isDestaque) {
        const cor = label === 'Lucro Líquido' ? GREEN : PINK
        data.cell.styles.fillColor = label === 'Lucro Líquido' ? [232, 250, 240] : [252, 232, 243]
        data.cell.styles.textColor = cor
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 12
      }
    },
  })
  // @ts-expect-error lastAutoTable is added by the plugin
  y = doc.lastAutoTable.finalY + 8

  // ---- Ingredientes Necessários ----
  if (y > 240) {
    doc.addPage()
    y = 18
  }
  sectionTitle('Ingredientes Necessários', PINK)
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Ingrediente', 'Quantidade']],
    body: resumo.ingredientes.length
      ? resumo.ingredientes.map((i) => [i.nome, formatQty(i.quantidade)])
      : [['Nenhum ingrediente cadastrado', '-']],
    theme: 'grid',
    headStyles: { fillColor: BLUE, textColor: [15, 30, 45], fontStyle: 'bold' },
    bodyStyles: { textColor: INK, fontSize: 10 },
    alternateRowStyles: { fillColor: [235, 247, 253] },
    columnStyles: { 1: { halign: 'right', cellWidth: 40 } },
  })
  // @ts-expect-error lastAutoTable is added by the plugin
  y = doc.lastAutoTable.finalY + 12

  // ---- Rodapé ----
  const pageCount = doc.getNumberOfPages()
  const now = new Date()
  const dataHora = now.toLocaleString('pt-BR')
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    const ph = doc.internal.pageSize.getHeight()
    doc.setDrawColor(...PINK)
    doc.setLineWidth(0.4)
    doc.line(margin, ph - 16, pageW - margin, ph - 16)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTED)
    doc.text(`Documento gerado em: ${dataHora}`, margin, ph - 10)
    doc.setTextColor(...PINK)
    doc.setFont('helvetica', 'bold')
    doc.text('Sistema de Vendas', pageW - margin, ph - 10, { align: 'right' })
  }

  doc.save(`sistema-de-vendas-${now.getTime()}.pdf`)
}

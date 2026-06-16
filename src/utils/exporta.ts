import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CLINICA } from '../lib/config'

export interface Columna<T> { header: string; get: (row: T) => string | number }

const LOGO_URL = '/cambiodeturnos/logo.png'

async function logoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_URL)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result as string)
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function exportarExcel<T>(filas: T[], cols: Columna<T>[], titulo: string, nombreArchivo: string) {
  const encabezado = [
    [CLINICA.nombre],
    [`${CLINICA.app} — ${titulo}`],
    [`Generado: ${new Date().toLocaleString('es-CO')}`],
    [],
    cols.map((c) => c.header),
  ]
  const datos = filas.map((row) => cols.map((c) => c.get(row)))
  const ws = XLSX.utils.aoa_to_sheet([...encabezado, ...datos])
  ws['!cols'] = cols.map(() => ({ wch: 22 }))
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: cols.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: cols.length - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: cols.length - 1 } },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`)
}

export async function exportarPDF<T>(filas: T[], cols: Columna<T>[], titulo: string, nombreArchivo: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const logo = await logoDataUrl()
  const w = doc.internal.pageSize.getWidth()

  if (logo) {
    try { doc.addImage(logo, 'PNG', 12, 8, 45, 14) } catch { /* noop */ }
  }
  doc.setFontSize(14); doc.setTextColor('#0D2D6B'); doc.setFont('helvetica', 'bold')
  doc.text(CLINICA.nombre, w / 2, 13, { align: 'center' })
  doc.setFontSize(11); doc.setTextColor('#16468E')
  doc.text(`${CLINICA.app} — ${titulo}`, w / 2, 19, { align: 'center' })
  doc.setFontSize(8); doc.setTextColor('#64748b'); doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}  ·  Total registros: ${filas.length}`, w / 2, 24, { align: 'center' })

  autoTable(doc, {
    startY: 28,
    head: [cols.map((c) => c.header)],
    body: filas.map((row) => cols.map((c) => String(c.get(row) ?? ''))),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [13, 45, 107], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [232, 238, 248] },
    margin: { left: 10, right: 10 },
  })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7); doc.setTextColor('#94a3b8')
    doc.text(`Página ${i} de ${pages}`, w - 12, doc.internal.pageSize.getHeight() - 6, { align: 'right' })
  }
  doc.save(`${nombreArchivo}.pdf`)
}

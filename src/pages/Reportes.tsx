import { useEffect, useState } from 'react'
import { FileSpreadsheet, FileText, Loader2, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { exportarExcel, exportarPDF, Columna } from '../utils/exporta'
import DashFilters, { DashFiltersState, emptyDashFilters, dashParams } from '../components/DashFilters'

interface Fila { categoria: string; total: number }

export default function Reportes() {
  const [filters, setFilters] = useState<DashFiltersState>(emptyDashFilters)
  const [porArea, setPorArea] = useState<Fila[]>([])
  const [porTurno, setPorTurno] = useState<Fila[]>([])
  const [estados, setEstados] = useState<Fila[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  useEffect(() => {
    setLoading(true)
    supabase.rpc('dashboard_data', dashParams(filters)).then(({ data }) => {
      setPorArea((data?.por_area ?? []).map((x: any) => ({ categoria: x.area, total: Number(x.n) })))
      setPorTurno((data?.por_turno ?? []).map((x: any) => ({ categoria: x.turno, total: Number(x.n) })))
      setEstados((data?.estados ?? []).map((x: any) => ({ categoria: x.estado, total: Number(x.n) })))
      setLoading(false)
    })
  }, [filters])

  const cols: Columna<Fila>[] = [
    { header: 'Categoría', get: (r) => r.categoria },
    { header: 'Total solicitudes', get: (r) => r.total },
  ]

  const colsDetalle: Columna<any>[] = [
    { header: 'ID', get: (r) => r.codigo ?? r.id },
    { header: 'Fecha solicitud', get: (r) => new Date(r.fecha_solicitud).toLocaleString('es-CO') },
    { header: 'Solicitante', get: (r) => r.nombre_solicitante },
    { header: 'Documento', get: (r) => r.doc_solicitante ?? '' },
    { header: 'Cargo', get: (r) => r.cargo_solicitante ?? '' },
    { header: 'Proceso', get: (r) => r.proceso ?? '' },
    { header: 'Coordinador', get: (r) => r.jefe_proceso ?? '' },
    { header: 'Turno solicitante', get: (r) => r.turno_solicitante ?? '' },
    { header: 'Fecha turno', get: (r) => r.fecha_turno_solicitante ?? '' },
    { header: 'Acepta', get: (r) => r.nombre_acepta ?? '' },
    { header: 'Turno acepta', get: (r) => r.turno_acepta ?? '' },
    { header: 'Estado', get: (r) => r.estado },
    { header: 'Observación', get: (r) => r.obser_solicitud ?? '' },
    { header: 'Respuesta', get: (r) => r.obser_respuesta ?? '' },
  ]

  async function exportResumen(data: Fila[], titulo: string, base: string, tipo: 'excel' | 'pdf') {
    setBusy(base + tipo)
    if (tipo === 'excel') exportarExcel(data, cols, titulo, base)
    else await exportarPDF(data, cols, titulo, base)
    setBusy('')
  }

  async function exportDetalle(tipo: 'excel' | 'pdf') {
    setBusy('detalle' + tipo)
    let q = supabase.from('solicitudes').select('*')
    if (filters.anio) {
      const y = Number(filters.anio)
      if (filters.mes) {
        const m = Number(filters.mes)
        q = q.gte('fecha_solicitud', `${y}-${String(m).padStart(2, '0')}-01`)
          .lt('fecha_solicitud', m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`)
      } else {
        q = q.gte('fecha_solicitud', `${y}-01-01`).lt('fecha_solicitud', `${y + 1}-01-01`)
      }
    }
    if (filters.area_id) q = q.eq('area_id', Number(filters.area_id))
    if (filters.estado) q = q.eq('estado', filters.estado)
    if (filters.turno) q = q.eq('turno_solicitante', filters.turno)
    if (filters.cargo) q = q.eq('cargo_solicitante', filters.cargo)
    const { data } = await q.order('fecha_solicitud', { ascending: false }).limit(10000)
    const filas = data ?? []
    const titulo = 'Detalle de Solicitudes' + (filters.anio ? ` ${filters.anio}` : '')
    if (tipo === 'excel') exportarExcel(filas, colsDetalle, titulo, 'detalle_solicitudes')
    else await exportarPDF(filas, colsDetalle, titulo, 'detalle_solicitudes')
    setBusy('')
  }

  const Card = ({ titulo, data, base }: { titulo: string; data: Fila[]; base: string }) => (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 bg-clinica-tint px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-clinica"><BarChart3 className="h-4 w-4" />{titulo}</h3>
        <div className="flex gap-2">
          <button onClick={() => exportResumen(data, titulo, base, 'excel')} disabled={!!busy} className="btn-secondary px-2.5 py-1.5 text-xs">
            {busy === base + 'excel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => exportResumen(data, titulo, base, 'pdf')} disabled={!!busy} className="btn-secondary px-2.5 py-1.5 text-xs">
            {busy === base + 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <table className="min-w-full text-sm">
        <thead><tr className="text-left text-xs uppercase text-slate-400"><th className="px-5 py-2">Categoría</th><th className="px-5 py-2 text-right">Total</th></tr></thead>
        <tbody>
          {data.map((r, i) => (
            <tr key={r.categoria} className={`border-t border-slate-50 ${i % 2 ? 'bg-clinica-tint' : ''}`}>
              <td className="px-5 py-2 text-slate-700">{r.categoria}</td>
              <td className="px-5 py-2 text-right font-semibold text-clinica">{r.total.toLocaleString('es-CO')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <DashFilters filters={filters} setFilters={setFilters} />

      <div className="card flex flex-col items-center justify-between gap-4 bg-gradient-to-br from-clinica to-clinica-mid p-6 text-white sm:flex-row">
        <div>
          <h2 className="text-lg font-bold">Reporte detallado de solicitudes</h2>
          <p className="text-sm text-clinica-soft">Exporta el listado completo (según filtros) con encabezado y logo institucional.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportDetalle('excel')} disabled={!!busy} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-clinica hover:bg-clinica-soft">
            {busy === 'detalleexcel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel
          </button>
          <button onClick={() => exportDetalle('pdf')} disabled={!!busy} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-clinica hover:bg-clinica-soft">
            {busy === 'detallepdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-clinica" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card titulo="Por Estado" data={estados} base="reporte_estados" />
          <Card titulo="Por Turno" data={porTurno} base="reporte_turnos" />
          <Card titulo="Por Proceso / Área" data={porArea} base="reporte_areas" />
        </div>
      )}
    </div>
  )
}

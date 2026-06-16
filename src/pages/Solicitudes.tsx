import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Search, Filter, FileSpreadsheet, FileText, Eye, Pencil, Trash2, X,
  CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, RotateCcw,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCatalogos } from '../lib/useCatalogos'
import { Solicitud, Estado } from '../types'
import Badge from '../components/Badge'
import { fmtFecha, fmtFechaHora, fmtSoloFecha, MESES } from '../utils/format'
import { exportarExcel, exportarPDF, Columna } from '../utils/exporta'

const PAGE_SIZE = 20
const ESTADOS: Estado[] = ['PENDIENTE', 'APROBADA', 'NEGADA']
const ANIOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

const initFilters = { q: '', anio: '', mes: '', area_id: '', estado: '', turno: '', cargo: '' }

export default function Solicitudes() {
  const { profile } = useAuth()
  const { areas, turnos, cargos } = useCatalogos()
  const puedeGestionar = profile?.rol === 'coordinador' || profile?.rol === 'administrador'

  const [filters, setFilters] = useState(initFilters)
  const [rows, setRows] = useState<Solicitud[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<Solicitud | null>(null)
  const [exporting, setExporting] = useState(false)

  const setF = (k: string, v: string) => { setFilters((f) => ({ ...f, [k]: v })); setPage(0) }

  const applyFilters = useCallback((q: any) => {
    if (filters.estado) q = q.eq('estado', filters.estado)
    if (filters.area_id) q = q.eq('area_id', Number(filters.area_id))
    if (filters.turno) q = q.eq('turno_solicitante', filters.turno)
    if (filters.cargo) q = q.eq('cargo_solicitante', filters.cargo)
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
    if (filters.q) {
      const s = filters.q.replace(/[%,]/g, ' ')
      q = q.or(`nombre_solicitante.ilike.%${s}%,nombre_acepta.ilike.%${s}%,correo_solicitante.ilike.%${s}%,codigo.ilike.%${s}%,doc_solicitante.ilike.%${s}%`)
    }
    return q
  }, [filters])

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('solicitudes').select('*', { count: 'exact' })
    q = applyFilters(q)
    q = q.order('fecha_solicitud', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    const { data, count } = await q
    setRows((data as Solicitud[]) ?? [])
    setCount(count ?? 0)
    setLoading(false)
  }, [applyFilters, page])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  const cols: Columna<Solicitud>[] = useMemo(() => [
    { header: 'ID', get: (r) => r.codigo ?? String(r.id) },
    { header: 'Fecha', get: (r) => fmtFecha(r.fecha_solicitud) },
    { header: 'Solicitante', get: (r) => r.nombre_solicitante },
    { header: 'Cargo', get: (r) => r.cargo_solicitante ?? '' },
    { header: 'Proceso', get: (r) => r.proceso ?? '' },
    { header: 'Turno solic.', get: (r) => r.turno_solicitante ?? '' },
    { header: 'Acepta', get: (r) => r.nombre_acepta ?? '' },
    { header: 'Turno acepta', get: (r) => r.turno_acepta ?? '' },
    { header: 'Estado', get: (r) => r.estado },
    { header: 'Observación', get: (r) => r.obser_solicitud ?? '' },
    { header: 'Respuesta', get: (r) => r.obser_respuesta ?? '' },
  ], [])

  async function exportar(tipo: 'excel' | 'pdf') {
    setExporting(true)
    let q = supabase.from('solicitudes').select('*')
    q = applyFilters(q).order('fecha_solicitud', { ascending: false }).limit(10000)
    const { data } = await q
    const filas = (data as Solicitud[]) ?? []
    const titulo = 'Solicitudes de Cambio de Turno'
    const nombre = `solicitudes_${new Date().toISOString().slice(0, 10)}`
    if (tipo === 'excel') exportarExcel(filas, cols, titulo, nombre)
    else await exportarPDF(filas, cols, titulo, nombre)
    setExporting(false)
  }

  async function eliminar(r: Solicitud) {
    if (!confirm(`¿Eliminar la solicitud ${r.codigo}? Esta acción no se puede deshacer.`)) return
    await supabase.from('solicitudes').delete().eq('id', r.id)
    fetchData()
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2 text-clinica">
          <Filter className="h-4 w-4" /><span className="text-sm font-semibold">Filtros</span>
          <button onClick={() => setFilters(initFilters)} className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-clinica">
            <RotateCcw className="h-3 w-3" /> Limpiar
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar…" value={filters.q} onChange={(e) => setF('q', e.target.value)} />
          </div>
          <select className="input" value={filters.anio} onChange={(e) => setF('anio', e.target.value)}>
            <option value="">Año</option>{ANIOS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="input" value={filters.mes} onChange={(e) => setF('mes', e.target.value)} disabled={!filters.anio}>
            <option value="">Mes</option>{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="input" value={filters.area_id} onChange={(e) => setF('area_id', e.target.value)}>
            <option value="">Proceso</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <select className="input" value={filters.estado} onChange={(e) => setF('estado', e.target.value)}>
            <option value="">Estado</option>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select className="input" value={filters.turno} onChange={(e) => setF('turno', e.target.value)}>
            <option value="">Turno</option>{turnos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
          </select>
          <select className="input" value={filters.cargo} onChange={(e) => setF('cargo', e.target.value)}>
            <option value="">Cargo</option>{cargos.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-clinica">{count.toLocaleString('es-CO')} solicitudes</p>
          <div className="flex gap-2">
            <button onClick={() => exportar('excel')} disabled={exporting} className="btn-secondary text-sm">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} Excel
            </button>
            <button onClick={() => exportar('pdf')} disabled={exporting} className="btn-secondary text-sm">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-clinica text-left text-xs uppercase tracking-wide text-white">
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Fecha</th>
                <th className="px-3 py-3">Solicitante</th>
                <th className="px-3 py-3">Proceso</th>
                <th className="px-3 py-3">Turno</th>
                <th className="px-3 py-3">Acepta</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-clinica" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-slate-400">Sin resultados con los filtros aplicados.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-slate-50 transition hover:bg-clinica-soft/50 ${i % 2 ? 'bg-clinica-tint' : 'bg-white'}`}>
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-clinica">{r.codigo ?? r.id}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {(() => { const { fecha, hora } = fmtFechaHora(r.fecha_solicitud); return (<><p className="font-medium text-slate-700">{fecha}</p><p className="text-xs text-slate-400">{hora}</p></>) })()}
                  </td>
                  <td className="px-3 py-2.5"><p className="font-medium text-slate-800">{r.nombre_solicitante}</p><p className="text-xs text-slate-400">{r.cargo_solicitante}</p></td>
                  <td className="px-3 py-2.5 text-slate-600">{r.proceso}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.turno_solicitante}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.nombre_acepta}</td>
                  <td className="px-3 py-2.5"><Badge estado={r.estado} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSel(r)} className="rounded-lg p-1.5 text-clinica hover:bg-clinica-soft" title="Ver / Gestionar"><Eye className="h-4 w-4" /></button>
                      {profile?.rol === 'administrador' && (
                        <button onClick={() => eliminar(r)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
          <span className="text-slate-500">Página {page + 1} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-3 py-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {sel && (
        <SolicitudModal
          solicitud={sel}
          puedeGestionar={puedeGestionar}
          onClose={() => setSel(null)}
          onSaved={() => { setSel(null); fetchData() }}
        />
      )}
    </div>
  )
}

function SolicitudModal({ solicitud, puedeGestionar, onClose, onSaved }: {
  solicitud: Solicitud; puedeGestionar: boolean; onClose: () => void; onSaved: () => void
}) {
  const { profile } = useAuth()
  const [obser, setObser] = useState(solicitud.obser_respuesta ?? '')
  const [saving, setSaving] = useState<Estado | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function resolver(estado: Estado) {
    setErr(null); setSaving(estado)
    const { error } = await supabase.from('solicitudes').update({
      estado,
      obser_respuesta: obser,
      resuelto_por: profile!.id,
      fecha_resolucion: new Date().toISOString(),
    }).eq('id', solicitud.id)
    if (error) { setErr(error.message); setSaving(null); return }
    supabase.functions.invoke('notificar', { body: { tipo: 'resuelta', solicitud_id: solicitud.id } }).catch(() => {})
    onSaved()
  }

  const R = ({ label, value }: { label: string; value?: string | null }) => (
    <div><p className="text-xs font-medium text-slate-400">{label}</p><p className="text-sm font-medium text-slate-800">{value || '—'}</p></div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between bg-clinica px-6 py-4 text-white">
          <div>
            <p className="text-xs text-clinica-soft">Solicitud</p>
            <h3 className="text-lg font-bold">{solicitud.codigo ?? `#${solicitud.id}`}</h3>
          </div>
          <div className="flex items-center gap-3"><Badge estado={solicitud.estado} /><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        </div>
        <div className="space-y-5 p-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-clinica-mid">Solicitante</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <R label="Nombre" value={solicitud.nombre_solicitante} />
              <R label="Documento" value={solicitud.doc_solicitante} />
              <R label="Cargo" value={solicitud.cargo_solicitante} />
              <R label="Correo" value={solicitud.correo_solicitante} />
              <R label="Proceso" value={solicitud.proceso} />
              <R label="Coordinador" value={solicitud.jefe_proceso} />
              <R label="Turno" value={solicitud.turno_solicitante} />
              <R label="Fecha turno" value={fmtSoloFecha(solicitud.fecha_turno_solicitante)} />
              <R label="Solicitado" value={fmtFecha(solicitud.fecha_solicitud)} />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-clinica-mid">Compañero que acepta</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <R label="Nombre" value={solicitud.nombre_acepta} />
              <R label="Documento" value={solicitud.doc_acepta} />
              <R label="Correo" value={solicitud.correo_acepta} />
              <R label="Turno" value={solicitud.turno_acepta} />
              <R label="Fecha turno" value={fmtSoloFecha(solicitud.fecha_turno_acepta)} />
            </div>
          </div>
          {solicitud.obser_solicitud && (
            <div><p className="text-xs font-bold uppercase tracking-wide text-clinica-mid">Observación del solicitante</p>
              <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{solicitud.obser_solicitud}</p></div>
          )}

          {puedeGestionar ? (
            <div className="rounded-xl border border-clinica-soft bg-clinica-tint p-4">
              <p className="mb-2 text-sm font-semibold text-clinica">Gestión de la solicitud</p>
              {err && <div className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
              <label className="label">Comentario de respuesta</label>
              <textarea rows={2} className="input resize-none" value={obser} onChange={(e) => setObser(e.target.value)} placeholder="Motivo de aprobación/rechazo…" />
              <div className="mt-3 flex gap-2">
                <button onClick={() => resolver('APROBADA')} disabled={!!saving} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {saving === 'APROBADA' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Aprobar</>}
                </button>
                <button onClick={() => resolver('NEGADA')} disabled={!!saving} className="btn-danger flex-1">
                  {saving === 'NEGADA' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Negar</>}
                </button>
              </div>
            </div>
          ) : solicitud.obser_respuesta ? (
            <div><p className="text-xs font-bold uppercase tracking-wide text-clinica-mid">Respuesta del coordinador</p>
              <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{solicitud.obser_respuesta}</p></div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

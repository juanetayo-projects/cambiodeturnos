import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Search, Filter, FileSpreadsheet, FileText, Eye, Trash2, X,
  CheckCircle2, XCircle, Loader2, ChevronLeft, ChevronRight, RotateCcw,
  User, UserCheck, CalendarClock, Building2, Stamp, Clock, Mail,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCatalogos } from '../lib/useCatalogos'
import { Solicitud, Estado } from '../types'
import Badge from '../components/Badge'
import Banda, { Dato } from '../components/Banda'
import ModalAlerta from '../components/ModalAlerta'
import {
  fmtFecha, fmtFechaHora, fmtFechaTurno, MESES, ESTADOS,
  ESTADO_LABEL, RESPUESTA_COLOR, RESPUESTA_LABEL,
} from '../utils/format'
import { cumple24h, rangoSemana } from '../utils/reglas'
import { exportarExcel, exportarPDF, Columna } from '../utils/exporta'

const PAGE_SIZE = 20
const ANIOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

const initFilters = { q: '', solicitante: '', acepta: '', anio: '', mes: '', area_id: '', estado: '', turno: '', cargo: '' }

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
    if (filters.solicitante) q = q.ilike('nombre_solicitante', `%${filters.solicitante}%`)
    if (filters.acepta) q = q.ilike('nombre_acepta', `%${filters.acepta}%`)
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
    { header: 'Respuesta compañero', get: (r) => RESPUESTA_LABEL[r.respuesta_acepta] ?? '' },
    { header: 'Estado', get: (r) => ESTADO_LABEL[r.estado] ?? r.estado },
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Buscar…" value={filters.q} onChange={(e) => setF('q', e.target.value)} />
          </div>
          <input className="input" placeholder="Solicitante" value={filters.solicitante} onChange={(e) => setF('solicitante', e.target.value)} />
          <input className="input" placeholder="Quien acepta" value={filters.acepta} onChange={(e) => setF('acepta', e.target.value)} />
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
            <option value="">Estado</option>{ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
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
        <div className="flex items-center justify-between border-b border-neu-dark/10 px-4 py-3">
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
                <th className="px-3 py-3">Respuesta</th>
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-clinica" /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-400">Sin resultados con los filtros aplicados.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-neu-dark/10 transition hover:bg-neu-surface ${i % 2 ? 'bg-neu-surface/60' : ''}`}>
                  <td className="px-3 py-2.5 font-mono text-xs font-semibold text-clinica">{r.codigo ?? r.id}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {(() => { const { fecha, hora } = fmtFechaHora(r.fecha_solicitud); return (<><p className="font-medium text-slate-700">{fecha}</p><p className="text-xs text-slate-400">{hora}</p></>) })()}
                  </td>
                  <td className="px-3 py-2.5"><p className="font-medium text-slate-800">{r.nombre_solicitante}</p><p className="text-xs text-slate-400">{r.cargo_solicitante}</p></td>
                  <td className="px-3 py-2.5 text-slate-600">{r.proceso}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.turno_solicitante}</td>
                  <td className="px-3 py-2.5 text-slate-600">{r.nombre_acepta}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${RESPUESTA_COLOR[r.respuesta_acepta] ?? RESPUESTA_COLOR.NO_APLICA}`}>
                      {RESPUESTA_LABEL[r.respuesta_acepta] ?? '—'}
                    </span>
                  </td>
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
        <div className="flex items-center justify-between border-t border-neu-dark/10 px-4 py-3 text-sm">
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
  const [alerta, setAlerta] = useState<{ titulo: string; mensaje: string } | null>(null)
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  // 3. El VoBo. solo procede cuando el compañero ya respondió que acepta
  const esperandoCompanero = solicitud.respuesta_acepta === 'PENDIENTE'
  const companeroRechazo = solicitud.respuesta_acepta === 'RECHAZADO'
  const resuelta = solicitud.estado === 'APROBADA' || solicitud.estado === 'NEGADA'
  // 2. El cambio solo puede autorizarse hasta 24 horas antes del turno
  const aTiempo = cumple24h(solicitud.fecha_turno_solicitante) && cumple24h(solicitud.fecha_turno_acepta)

  async function resolver(estado: Estado) {
    if (estado === 'APROBADA' && !aTiempo) {
      return setAlerta({
        titulo: 'Fuera del plazo de 24 horas',
        mensaje: 'El cambio de turno solo puede autorizarse hasta 24 horas antes de la fecha del turno. Este turno ya está dentro de las 24 horas previas (o ya ocurrió), por lo que no es posible aprobarlo.',
      })
    }
    setErr(null); setSaving(estado)
    const { error } = await supabase.from('solicitudes').update({
      estado,
      obser_respuesta: obser,
      resuelto_por: profile!.id,
      fecha_resolucion: new Date().toISOString(),
    }).eq('id', solicitud.id)
    if (error) {
      setSaving(null)
      const m = error.message || ''
      if (m.includes('24 horas')) return setAlerta({ titulo: 'Fuera del plazo de 24 horas', mensaje: m })
      if (m.includes('compañero')) return setAlerta({ titulo: 'Falta la respuesta del compañero', mensaje: m })
      return setErr(m)
    }
    supabase.functions.invoke('notificar', { body: { tipo: 'resuelta', solicitud_id: solicitud.id } }).catch(() => {})
    onSaved()
  }

  async function reenviarCorreo() {
    setReenviando(true)
    await supabase.functions.invoke('notificar', { body: { tipo: 'recordatorio', solicitud_id: solicitud.id } })
    setReenviando(false); setReenviado(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="modal-card max-h-[92vh] w-full max-w-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-[#0D2D6B] to-[#2A6FD6] px-6 py-4 text-white">
          <div>
            <p className="text-xs text-clinica-soft">Solicitud</p>
            <h3 className="text-lg font-bold">{solicitud.codigo ?? `#${solicitud.id}`}</h3>
          </div>
          <div className="flex items-center gap-3"><Badge estado={solicitud.estado} /><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        </div>

        <div className="p-5">
          {/* Línea de tiempo del flujo */}
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-neu-bg p-3 shadow-neu-inset-sm">
            <Paso n={1} texto="Solicitud creada" estado="ok" />
            <Paso n={2} texto={esperandoCompanero ? 'Espera respuesta del compañero' : companeroRechazo ? 'El compañero no aceptó' : 'Compañero aceptó'}
              estado={esperandoCompanero ? 'curso' : companeroRechazo ? 'mal' : 'ok'} />
            <Paso n={3} texto={resuelta ? `Coordinador: ${ESTADO_LABEL[solicitud.estado]}` : 'Visto bueno del coordinador'}
              estado={companeroRechazo ? 'off' : resuelta ? (solicitud.estado === 'APROBADA' ? 'ok' : 'mal') : esperandoCompanero ? 'off' : 'curso'} />
          </div>

          {/* Banda azul — quien hace la solicitud */}
          <Banda tono="solicitante" titulo="Quien solicita el cambio" subtitulo="Datos del colaborador que presenta la solicitud" icono={<User className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Dato tono="solicitante" label="Nombre" value={solicitud.nombre_solicitante} />
              <Dato tono="solicitante" label="Documento" value={solicitud.doc_solicitante} />
              <Dato tono="solicitante" label="Cargo" value={solicitud.cargo_solicitante} />
              <div className="col-span-2 sm:col-span-1"><Dato tono="solicitante" label="Correo" value={solicitud.correo_solicitante} /></div>
              <Dato tono="solicitante" label="Turno que cede" value={solicitud.turno_solicitante} />
              <Dato tono="solicitante" label="Solicitado el" value={fmtFecha(solicitud.fecha_solicitud)} />
            </div>
          </Banda>

          {/* Banda violeta — proceso */}
          <Banda tono="proceso" titulo="Proceso / área" icono={<Building2 className="h-4 w-4" />}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Dato tono="proceso" label="Proceso" value={solicitud.proceso} />
              <div className="col-span-2"><Dato tono="proceso" label="Coordinador" value={solicitud.jefe_proceso} /></div>
            </div>
          </Banda>

          {/* Banda ámbar — el cambio */}
          <Banda
            tono="cambio" titulo="Turnos del cambio" icono={<CalendarClock className="h-4 w-4" />}
            subtitulo={solicitud.fecha_turno_solicitante ? `Semana ${rangoSemana(solicitud.fecha_turno_solicitante)}` : undefined}
            extra={!aTiempo && !resuelta && (
              <span className="flex items-center gap-1 rounded-lg bg-white/20 px-2 py-1 text-[11px] font-bold"><Clock className="h-3 w-3" /> Sin margen de 24 h</span>
            )}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#E8EEF8] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0D2D6B]">Entrega el solicitante</p>
                <p className="text-sm font-bold text-slate-800">{solicitud.turno_solicitante || '—'}</p>
                <p className="text-xs text-slate-600">{fmtFechaTurno(solicitud.fecha_turno_solicitante)}</p>
              </div>
              <div className="rounded-xl bg-[#CCFBF1] p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">Entrega el compañero</p>
                <p className="text-sm font-bold text-slate-800">{solicitud.turno_acepta || '—'}</p>
                <p className="text-xs text-slate-600">{fmtFechaTurno(solicitud.fecha_turno_acepta)}</p>
              </div>
            </div>
            {solicitud.obser_solicitud && (
              <div className="mt-3">
                <Dato tono="cambio" label="Observación del solicitante" value={solicitud.obser_solicitud} />
              </div>
            )}
          </Banda>

          {/* Banda verde azulado — quien acepta o no el cambio */}
          <Banda
            tono="acepta" titulo="Quien acepta el cambio" subtitulo="Respuesta registrada desde el correo" icono={<UserCheck className="h-4 w-4" />}
            extra={
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${RESPUESTA_COLOR[solicitud.respuesta_acepta] ?? RESPUESTA_COLOR.NO_APLICA}`}>
                {RESPUESTA_LABEL[solicitud.respuesta_acepta] ?? '—'}
              </span>
            }
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Dato tono="acepta" label="Nombre" value={solicitud.nombre_acepta} />
              <Dato tono="acepta" label="Documento" value={solicitud.doc_acepta} />
              <Dato tono="acepta" label="Correo" value={solicitud.correo_acepta} />
              <Dato tono="acepta" label="Turno que asume" value={solicitud.turno_solicitante} />
              <div className="col-span-2">
                <Dato tono="acepta" label="Respondió el" value={solicitud.fecha_respuesta_acepta ? fmtFecha(solicitud.fecha_respuesta_acepta) : 'Sin respuesta aún'} />
              </div>
              {solicitud.obser_acepta && (
                <div className="col-span-2 sm:col-span-3"><Dato tono="acepta" label="Comentario del compañero" value={solicitud.obser_acepta} /></div>
              )}
            </div>
            {esperandoCompanero && puedeGestionar && (
              <button onClick={reenviarCorreo} disabled={reenviando || reenviado} className="btn-secondary mt-3 w-full text-sm disabled:opacity-60">
                {reenviando ? <Loader2 className="h-4 w-4 animate-spin" /> : reenviado ? <><CheckCircle2 className="h-4 w-4" /> Correo reenviado</> : <><Mail className="h-4 w-4" /> Reenviar correo al compañero</>}
              </button>
            )}
          </Banda>

          {/* Banda magenta — visto bueno del coordinador */}
          {puedeGestionar ? (
            <Banda tono="coordinador" titulo="Visto bueno del coordinador" subtitulo="Decisión final sobre el cambio" icono={<Stamp className="h-4 w-4" />}>
              {err && <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

              {esperandoCompanero ? (
                <div className="rounded-xl bg-[#FEF3C7] px-4 py-3 text-sm font-medium text-[#92400E]">
                  <p className="flex items-center gap-2 font-bold"><Clock className="h-4 w-4" /> Aún no puedes dar el visto bueno</p>
                  <p className="mt-1">El compañero <b>{solicitud.nombre_acepta}</b> todavía no ha respondido el correo de aceptación. Cuando responda, la solicitud pasará a tu bandeja para aprobar o negar.</p>
                </div>
              ) : companeroRechazo ? (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  <p className="flex items-center gap-2 font-bold"><XCircle className="h-4 w-4" /> El compañero no aceptó el cambio</p>
                  <p className="mt-1">La solicitud quedó cerrada y no puede aprobarse. El solicitante ya fue notificado.</p>
                </div>
              ) : (
                <>
                  <label className="label">Comentario de respuesta</label>
                  <textarea rows={2} className="input resize-none" value={obser} onChange={(e) => setObser(e.target.value)} placeholder="Motivo de aprobación/rechazo…" />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button onClick={() => resolver('APROBADA')} disabled={!!saving} className="btn-primary flex-1 bg-emerald-600 hover:bg-emerald-700">
                      {saving === 'APROBADA' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Dar visto bueno</>}
                    </button>
                    <button onClick={() => resolver('NEGADA')} disabled={!!saving} className="btn-danger flex-1">
                      {saving === 'NEGADA' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Negar</>}
                    </button>
                  </div>
                </>
              )}

              {solicitud.obser_respuesta && (
                <div className="mt-3"><Dato tono="coordinador" label="Comentario registrado" value={solicitud.obser_respuesta} /></div>
              )}
            </Banda>
          ) : (solicitud.obser_respuesta || resuelta) ? (
            <Banda tono="coordinador" titulo="Respuesta del coordinador" icono={<Stamp className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Dato tono="coordinador" label="Decisión" value={ESTADO_LABEL[solicitud.estado]} />
                <Dato tono="coordinador" label="Fecha" value={solicitud.fecha_resolucion ? fmtFecha(solicitud.fecha_resolucion) : '—'} />
                {solicitud.obser_respuesta && (
                  <div className="sm:col-span-2"><Dato tono="coordinador" label="Comentario" value={solicitud.obser_respuesta} /></div>
                )}
              </div>
            </Banda>
          ) : null}
        </div>
      </div>

      {alerta && (
        <ModalAlerta tipo="horas" titulo={alerta.titulo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)} />
      )}
    </div>
  )
}

/** Paso de la línea de tiempo del flujo de aprobación. */
function Paso({ n, texto, estado }: { n: number; texto: string; estado: 'ok' | 'curso' | 'mal' | 'off' }) {
  const estilo = {
    ok: 'bg-emerald-100 text-emerald-700',
    curso: 'bg-amber-100 text-amber-700',
    mal: 'bg-rose-100 text-rose-700',
    off: 'bg-neu-surface text-slate-400',
  }[estado]
  return (
    <div className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold ${estilo}`}>
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/70 text-[10px] font-extrabold">{n}</span>
      {texto}
    </div>
  )
}

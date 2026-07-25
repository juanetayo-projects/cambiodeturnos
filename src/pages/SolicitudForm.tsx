import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Loader2, Send, CheckCircle2, ArrowLeftRight, User, Building2, CalendarClock,
  UserCheck, X, Search, GraduationCap, Mail, Gauge,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCatalogos } from '../lib/useCatalogos'
import { supabase } from '../lib/supabase'
import { Cupo } from '../types'
import Banda from '../components/Banda'
import ModalAlerta, { TipoAlerta } from '../components/ModalAlerta'
import {
  LIMITE_MENSUAL, cumple24h, diasDeLaSemana, fechaMinimaTurno, finSemana,
  inicioSemana, aISO, mismaSemana, rangoSemana,
} from '../utils/reglas'

interface Alerta { tipo: TipoAlerta; titulo: string; mensaje?: string; detalle?: 'semana' }

export default function SolicitudForm() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { areas, cargos, turnos, coordinadores, loading } = useCatalogos()
  const [buscando, setBuscando] = useState(false)
  const [encontrado, setEncontrado] = useState<string | null>(null)
  const [cupo, setCupo] = useState<Cupo | null>(null)
  const [alerta, setAlerta] = useState<Alerta | null>(null)

  const [form, setForm] = useState({
    cargo_solicitante: '',
    area_id: '',
    coordinador_id: '',
    nombre_solicitante: profile?.nombre ?? '',
    doc_solicitante: profile?.documento ?? '',
    turno_solicitante: '',
    fecha_turno_solicitante: '',
    nombre_acepta: '',
    doc_acepta: '',
    correo_acepta: '',
    turno_acepta: '',
    fecha_turno_acepta: '',
    obser_solicitud: '',
    acepta_terminos: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const coordsArea = useMemo(
    () => coordinadores.filter((c) => String(c.area_id) === form.area_id),
    [coordinadores, form.area_id],
  )

  // 5, 6. Cupo mensual del colaborador (ilimitado si está estudiando)
  async function cargarCupo() {
    const { data } = await supabase.rpc('cupo_solicitudes')
    if (data) setCupo(data as Cupo)
  }
  useEffect(() => { cargarCupo() }, [profile?.id])

  const sinCupo = !!cupo && !cupo.ilimitado && cupo.usadas >= cupo.limite

  // 1. Semana permitida a partir de la fecha del turno del solicitante
  const semana = form.fecha_turno_solicitante
    ? { min: aISO(inicioSemana(form.fecha_turno_solicitante)), max: aISO(finSemana(form.fecha_turno_solicitante)) }
    : null

  function alertaLimite() {
    setAlerta({
      tipo: 'limite',
      titulo: 'Límite mensual de solicitudes alcanzado',
      mensaje: `Cada colaborador puede presentar máximo ${cupo?.limite ?? LIMITE_MENSUAL} solicitudes de cambio de turno por mes. Ya registraste ${cupo?.usadas ?? 0} este mes, por lo que no es posible crear una nueva hasta el mes siguiente. Si estás adelantando estudios, solicita al administrador que active el identificador de estudiante en tu perfil para tener solicitudes ilimitadas.`,
    })
  }

  function alertaSemana(fechaRef: string) {
    setAlerta({
      tipo: 'semana',
      titulo: 'El cambio debe ser dentro de la misma semana',
      mensaje: `El turno solicitado solo puede intercambiarse por otro de la misma semana (de lunes a domingo). Para el turno del ${new Date(fechaRef + 'T00:00:00').toLocaleDateString('es-CO')}, la semana permitida es del ${rangoSemana(fechaRef)}. Estos son los días habilitados:`,
      detalle: 'semana',
    })
  }

  function alerta24h() {
    setAlerta({
      tipo: 'horas',
      titulo: 'Se requieren 24 horas de anticipación',
      mensaje: 'El cambio de turno solo puede autorizarse hasta 24 horas antes de la fecha del turno. Selecciona una fecha con mayor anticipación para que tu coordinador alcance a dar el visto bueno.',
    })
  }

  // Valida en el momento en que se elige la fecha del turno a recibir
  function setFechaAcepta(v: string) {
    set('fecha_turno_acepta', v)
    if (v && form.fecha_turno_solicitante && !mismaSemana(form.fecha_turno_solicitante, v)) alertaSemana(form.fecha_turno_solicitante)
    else if (v && !cumple24h(v)) alerta24h()
  }

  function setFechaSolicitante(v: string) {
    set('fecha_turno_solicitante', v)
    if (v && !cumple24h(v)) return alerta24h()
    if (v && form.fecha_turno_acepta && !mismaSemana(v, form.fecha_turno_acepta)) alertaSemana(v)
  }

  async function buscarPersona() {
    const doc = form.doc_acepta.trim()
    setEncontrado(null)
    if (!doc) return
    setBuscando(true)
    const { data } = await supabase.rpc('buscar_persona', { p_doc: doc })
    setBuscando(false)
    const p = Array.isArray(data) ? data[0] : null
    if (p?.nombre) {
      setForm((f) => ({ ...f, nombre_acepta: p.nombre ?? '', correo_acepta: p.correo ?? f.correo_acepta }))
      setEncontrado('Datos encontrados y completados automáticamente.')
    } else {
      setEncontrado('No se encontró registro previo. Ingresa los datos manualmente.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (sinCupo) return alertaLimite()
    if (!mismaSemana(form.fecha_turno_solicitante, form.fecha_turno_acepta)) return alertaSemana(form.fecha_turno_solicitante)
    if (!cumple24h(form.fecha_turno_solicitante) || !cumple24h(form.fecha_turno_acepta)) return alerta24h()
    if (!form.acepta_terminos) return setError('Debes aceptar los términos para continuar.')

    const coord = coordinadores.find((c) => String(c.id) === form.coordinador_id)
    const area = areas.find((a) => String(a.id) === form.area_id)
    setLoadingSubmit(true)
    const { data, error } = await supabase
      .from('solicitudes')
      .insert({
        cargo_solicitante: form.cargo_solicitante,
        area_id: form.area_id ? Number(form.area_id) : null,
        proceso: area?.nombre ?? null,
        jefe_proceso: coord?.cargo ?? null,
        correo_coordinador: coord?.correo ?? null,
        nombre_solicitante: form.nombre_solicitante,
        doc_solicitante: form.doc_solicitante,
        correo_solicitante: profile!.correo,
        turno_solicitante: form.turno_solicitante,
        fecha_turno_solicitante: form.fecha_turno_solicitante || null,
        nombre_acepta: form.nombre_acepta,
        doc_acepta: form.doc_acepta,
        correo_acepta: form.correo_acepta,
        turno_acepta: form.turno_acepta,
        fecha_turno_acepta: form.fecha_turno_acepta || null,
        obser_solicitud: form.obser_solicitud,
        acepta_terminos: form.acepta_terminos,
        estado: 'PENDIENTE_COMPANERO',
        solicitante_id: profile!.id,
      })
      .select('codigo, id')
      .single()
    setLoadingSubmit(false)

    if (error) {
      // La base de datos es la fuente de verdad: traducimos su validación a un modal
      const m = error.message || ''
      if (m.includes('misma semana')) return alertaSemana(form.fecha_turno_solicitante)
      if (m.includes('24 horas')) return alerta24h()
      if (m.includes('máximo')) { await cargarCupo(); return setAlerta({ tipo: 'limite', titulo: 'Límite mensual de solicitudes alcanzado', mensaje: m }) }
      return setError(m)
    }

    // 3. El primer correo va al compañero para que acepte o no el cambio
    supabase.functions.invoke('notificar', { body: { tipo: 'nueva', solicitud_id: data!.id } }).catch(() => {})
    cargarCupo()
    setDone(data!.codigo ?? `#${data!.id}`)
  }

  if (loading)
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-clinica" /></div>

  if (done)
    return (
      <div className="mx-auto max-w-lg">
        <div className="card animate-fade-in overflow-hidden">
          <div className="bg-gradient-to-r from-[#065F46] to-[#10B981] px-6 py-5 text-center text-white">
            <CheckCircle2 className="mx-auto h-14 w-14" />
            <h2 className="mt-2 text-xl font-bold">¡Solicitud enviada!</h2>
          </div>
          <div className="p-8 text-center">
            <p className="text-slate-600">Tu solicitud fue registrada con el identificador</p>
            <p className="my-3 inline-block rounded-xl bg-clinica-soft px-5 py-2 text-2xl font-extrabold tracking-wide text-clinica shadow-neu-inset-sm">{done}</p>
            <div className="panel-inset mt-3 p-4 text-left text-sm text-slate-600">
              <p className="mb-2 flex items-center gap-2 font-semibold text-clinica"><Mail className="h-4 w-4" /> ¿Qué sigue?</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>Enviamos un correo a <b>{form.nombre_acepta || 'tu compañero/a'}</b> con los botones <b>ACEPTO</b> y <b>NO ACEPTO</b>.</li>
                <li>Cuando responda, su decisión queda registrada en la solicitud.</li>
                <li>Si acepta, el coordinador recibe la notificación para dar el <b>visto bueno</b>.</li>
              </ol>
            </div>
            <button
              onClick={() => { setDone(null); setForm((f) => ({ ...f, nombre_acepta: '', doc_acepta: '', correo_acepta: '', obser_solicitud: '', acepta_terminos: false })) }}
              className="btn-primary mt-6"
            >
              Nueva solicitud
            </button>
          </div>
        </div>
      </div>
    )

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-[#0D2D6B] to-[#2A6FD6] px-6 py-4 text-white">
            <ArrowLeftRight className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">Solicitud de Cambio de Turno</h2>
              <p className="text-xs text-clinica-soft">Los campos marcados con * son obligatorios.</p>
            </div>
            {cupo && (
              <div className="ml-auto flex items-center gap-2 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-semibold">
                {cupo.ilimitado ? (
                  <><GraduationCap className="h-4 w-4" /> Estudiante · solicitudes ilimitadas</>
                ) : (
                  <><Gauge className="h-4 w-4" /> {cupo.usadas} de {cupo.limite} solicitudes este mes</>
                )}
              </div>
            )}
          </div>

          <div className="p-5">
            {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

            {sinCupo && (
              <button type="button" onClick={alertaLimite} className="mb-4 flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[#7C2D12] to-[#EA580C] px-4 py-3 text-left text-sm font-semibold text-white shadow-neu-sm">
                <Gauge className="h-5 w-5 shrink-0" />
                Alcanzaste el máximo de {cupo?.limite} solicitudes de este mes. Toca aquí para ver el detalle.
              </button>
            )}

            {/* 1 · Solicitante — banda azul institucional */}
            <Banda n={1} tono="solicitante" titulo="Datos del solicitante" subtitulo="Quien pide el cambio de turno" icono={<User className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Nombre *"><input required className="input" value={form.nombre_solicitante} onChange={(e) => set('nombre_solicitante', e.target.value)} /></Field>
                <Field label="Documento"><input className="input" value={form.doc_solicitante} onChange={(e) => set('doc_solicitante', e.target.value)} /></Field>
                <Field label="Cargo *">
                  <select required className="input" value={form.cargo_solicitante} onChange={(e) => set('cargo_solicitante', e.target.value)}>
                    <option value="">Seleccione…</option>
                    {cargos.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </Field>
              </div>
            </Banda>

            {/* 2 · Proceso — banda violeta */}
            <Banda n={2} tono="proceso" titulo="Datos del proceso / área" subtitulo="Coordinador que dará el visto bueno" icono={<Building2 className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Proceso / Área *">
                  <select required className="input" value={form.area_id} onChange={(e) => { set('area_id', e.target.value); set('coordinador_id', '') }}>
                    <option value="">Seleccione…</option>
                    {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Coordinador (Jefe de proceso) *">
                  <select required className="input" value={form.coordinador_id} onChange={(e) => set('coordinador_id', e.target.value)} disabled={!form.area_id}>
                    <option value="">{form.area_id ? 'Seleccione…' : 'Elija un área primero'}</option>
                    {coordsArea.map((c) => <option key={c.id} value={c.id}>{c.cargo}{c.nombre ? ` — ${c.nombre}` : ''}</option>)}
                  </select>
                </Field>
              </div>
            </Banda>

            {/* 3 · Cambio — banda ámbar */}
            <Banda
              n={3} tono="cambio" titulo="Datos del cambio de turno"
              subtitulo="Misma semana (lunes a domingo) y mínimo 24 horas de anticipación"
              icono={<CalendarClock className="h-4 w-4" />}
              extra={semana && (
                <span className="rounded-lg bg-white/20 px-2.5 py-1 text-[11px] font-bold">
                  Semana: {rangoSemana(form.fecha_turno_solicitante)}
                </span>
              )}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Tu turno *">
                  <select required className="input" value={form.turno_solicitante} onChange={(e) => set('turno_solicitante', e.target.value)}>
                    <option value="">Seleccione…</option>
                    {turnos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Fecha de tu turno *">
                  <input type="date" required min={fechaMinimaTurno()} className="input" value={form.fecha_turno_solicitante} onChange={(e) => setFechaSolicitante(e.target.value)} />
                </Field>
                <Field label="Turno a recibir *">
                  <select required className="input" value={form.turno_acepta} onChange={(e) => set('turno_acepta', e.target.value)}>
                    <option value="">Seleccione…</option>
                    {turnos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Fecha del turno a recibir *">
                  <input
                    type="date" required className="input"
                    min={semana?.min ?? fechaMinimaTurno()} max={semana?.max}
                    disabled={!form.fecha_turno_solicitante}
                    value={form.fecha_turno_acepta}
                    onChange={(e) => setFechaAcepta(e.target.value)}
                  />
                </Field>
              </div>
              {semana && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {diasDeLaSemana(form.fecha_turno_solicitante).map((d) => {
                    const activo = form.fecha_turno_acepta === d.iso
                    return (
                      <button
                        key={d.iso} type="button" disabled={d.vencido}
                        onClick={() => setFechaAcepta(d.iso)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          d.vencido ? 'cursor-not-allowed bg-neu-surface text-slate-400 line-through'
                            : activo ? 'bg-[#B45309] text-white shadow-neu-inset-sm'
                            : 'bg-[#FEF3C7] text-[#92400E] shadow-neu-flat hover:shadow-neu-sm'
                        }`}
                        title={d.vencido ? 'Requiere 24 horas de anticipación' : 'Seleccionar este día'}
                      >
                        {d.dia.slice(0, 3)} {d.fecha}
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="mt-3">
                <label className="label">Observaciones</label>
                <textarea rows={2} className="input resize-none" value={form.obser_solicitud} onChange={(e) => set('obser_solicitud', e.target.value)} placeholder="Motivo del cambio u observaciones…" />
              </div>
            </Banda>

            {/* 4 · Quien acepta — banda verde azulado */}
            <Banda n={4} tono="acepta" titulo="Datos de quien acepta el cambio" subtitulo="Recibirá un correo para aceptar o no el cambio" icono={<UserCheck className="h-4 w-4" />}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Cédula *">
                  <div className="relative">
                    <input
                      required className="input pr-10" value={form.doc_acepta}
                      onChange={(e) => { set('doc_acepta', e.target.value); setEncontrado(null) }}
                      onBlur={buscarPersona} placeholder="Ingresa la cédula"
                    />
                    <button type="button" onClick={buscarPersona} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#0F766E] hover:text-[#134E4A]" title="Buscar por cédula">
                      {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Nombre *"><input required className="input" value={form.nombre_acepta} onChange={(e) => set('nombre_acepta', e.target.value)} /></Field>
                <Field label="Correo *"><input type="email" required className="input" value={form.correo_acepta} onChange={(e) => set('correo_acepta', e.target.value)} /></Field>
              </div>
              {encontrado && <p className="mt-2 text-xs font-medium text-[#0F766E]">{encontrado}</p>}
              <p className="mt-3 rounded-xl bg-[#CCFBF1] px-3 py-2 text-xs font-medium text-[#0F766E]">
                Al enviar la solicitud, esta persona recibirá un correo con los botones <b>ACEPTO</b> y <b>NO ACEPTO</b>. Solo después de su respuesta el coordinador podrá dar el visto bueno.
              </p>
            </Banda>

            <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form.acepta_terminos} onChange={(e) => set('acepta_terminos', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-clinica focus:ring-clinica-mid" />
                Acepto los términos y la responsabilidad del cambio de turno.
              </label>
              <div className="flex w-full gap-2 sm:w-auto">
                <button type="button" onClick={() => navigate('/solicitudes')} className="btn-secondary flex-1 sm:flex-none">
                  <X className="h-4 w-4" /> Cancelar
                </button>
                <button type="submit" disabled={loadingSubmit} className="btn-primary flex-1 sm:flex-none">
                  {loadingSubmit ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar solicitud</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {alerta && (
        <ModalAlerta tipo={alerta.tipo} titulo={alerta.titulo} mensaje={alerta.mensaje} onClose={() => setAlerta(null)}>
          {alerta.detalle === 'semana' && form.fecha_turno_solicitante && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {diasDeLaSemana(form.fecha_turno_solicitante).map((d) => (
                <div key={d.iso} className={`rounded-xl px-2 py-2 text-center shadow-neu-flat ${d.vencido ? 'bg-neu-surface text-slate-400' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
                  <p className="text-[11px] font-bold uppercase">{d.dia}</p>
                  <p className="text-sm font-extrabold">{d.fecha}</p>
                  {d.vencido && <p className="text-[10px]">sin 24 h</p>}
                </div>
              ))}
            </div>
          )}
        </ModalAlerta>
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

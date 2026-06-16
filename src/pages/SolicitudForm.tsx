import { useMemo, useState } from 'react'
import { Loader2, Send, CheckCircle2, ArrowLeftRight, User, Building2, CalendarClock, UserCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCatalogos } from '../lib/useCatalogos'
import { supabase } from '../lib/supabase'

export default function SolicitudForm() {
  const { profile } = useAuth()
  const { areas, cargos, turnos, coordinadores, loading } = useCatalogos()

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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
        estado: 'PENDIENTE',
        solicitante_id: profile!.id,
      })
      .select('codigo, id')
      .single()
    setLoadingSubmit(false)
    if (error) return setError(error.message)

    // Notificaciones por correo (no bloquea el flujo si falla)
    supabase.functions.invoke('notificar', { body: { tipo: 'nueva', solicitud_id: data!.id } }).catch(() => {})
    setDone(data!.codigo ?? `#${data!.id}`)
  }

  if (loading)
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-clinica" /></div>

  if (done)
    return (
      <div className="mx-auto max-w-lg">
        <div className="card animate-fade-in p-10 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          <h2 className="mt-4 text-2xl font-bold text-clinica">¡Solicitud enviada!</h2>
          <p className="mt-2 text-slate-600">Tu solicitud fue registrada con el identificador</p>
          <p className="my-3 inline-block rounded-lg bg-clinica-soft px-5 py-2 text-2xl font-extrabold tracking-wide text-clinica">{done}</p>
          <p className="text-sm text-slate-500">Recibirás un correo de confirmación. El coordinador revisará tu solicitud.</p>
          <button onClick={() => { setDone(null); setForm((f) => ({ ...f, nombre_acepta: '', doc_acepta: '', correo_acepta: '', obser_solicitud: '', acepta_terminos: false })) }} className="btn-primary mt-6">
            Nueva solicitud
          </button>
        </div>
      </div>
    )

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 bg-clinica px-6 py-4 text-white">
          <ArrowLeftRight className="h-6 w-6" />
          <div>
            <h2 className="text-lg font-bold">Solicitud de Cambio de Turno</h2>
            <p className="text-xs text-clinica-soft">Completa los datos. Los campos marcados con * son obligatorios.</p>
          </div>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}

          {/* Sección 1: Datos del solicitante */}
          <Section n={1} title="Datos del solicitante" icon={<User className="h-4 w-4" />}>
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
          </Section>

          {/* Sección 2: Datos del Proceso / Área */}
          <Section n={2} title="Datos del proceso / área" icon={<Building2 className="h-4 w-4" />}>
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
          </Section>

          {/* Sección 3: Datos del cambio de turno */}
          <Section n={3} title="Datos del cambio de turno" icon={<CalendarClock className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Tu turno *">
                <select required className="input" value={form.turno_solicitante} onChange={(e) => set('turno_solicitante', e.target.value)}>
                  <option value="">Seleccione…</option>
                  {turnos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
              </Field>
              <Field label="Fecha de tu turno *"><input type="date" required className="input" value={form.fecha_turno_solicitante} onChange={(e) => set('fecha_turno_solicitante', e.target.value)} /></Field>
              <Field label="Turno a recibir *">
                <select required className="input" value={form.turno_acepta} onChange={(e) => set('turno_acepta', e.target.value)}>
                  <option value="">Seleccione…</option>
                  {turnos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
              </Field>
              <Field label="Fecha del turno a recibir *"><input type="date" required className="input" value={form.fecha_turno_acepta} onChange={(e) => set('fecha_turno_acepta', e.target.value)} /></Field>
            </div>
            <div className="mt-3">
              <label className="label">Observaciones</label>
              <textarea rows={2} className="input resize-none" value={form.obser_solicitud} onChange={(e) => set('obser_solicitud', e.target.value)} placeholder="Motivo del cambio u observaciones…" />
            </div>
          </Section>

          {/* Sección 4: Datos de quien acepta el cambio */}
          <Section n={4} title="Datos de quien acepta el cambio" icon={<UserCheck className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Nombre *"><input required className="input" value={form.nombre_acepta} onChange={(e) => set('nombre_acepta', e.target.value)} /></Field>
              <Field label="Documento"><input className="input" value={form.doc_acepta} onChange={(e) => set('doc_acepta', e.target.value)} /></Field>
              <Field label="Correo *"><input type="email" required className="input" value={form.correo_acepta} onChange={(e) => set('correo_acepta', e.target.value)} /></Field>
            </div>
          </Section>

          <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.acepta_terminos} onChange={(e) => set('acepta_terminos', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-clinica focus:ring-clinica-mid" />
              Acepto los términos y la responsabilidad del cambio de turno.
            </label>
            <button type="submit" disabled={loadingSubmit} className="btn-primary w-full sm:w-auto">
              {loadingSubmit ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Enviar solicitud</>}
            </button>
          </div>
        </div>
      </div>
    </form>
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

function Section({ n, title, icon, children }: { n: number; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-clinica text-xs font-bold text-white">{n}</span>
        <span className="text-clinica-mid">{icon}</span>
        <h3 className="text-sm font-bold text-clinica">{title}</h3>
      </div>
      {children}
    </div>
  )
}

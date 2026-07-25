// =====================================================================
//  Respuesta del compañero al que se le solicita el cambio de turno.
//  Es una página pública: el enlace del correo trae el token de la
//  solicitud y la respuesta (acepto / no acepto), que se registra
//  automáticamente al abrirla. No requiere iniciar sesión.
// =====================================================================
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Loader2, CheckCircle2, XCircle, ArrowLeftRight, User, CalendarClock,
  AlertTriangle, MessageSquare, Send,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { APP_URL } from '../lib/config'
import { Dato } from '../components/Banda'
import { fmtFechaTurno } from '../utils/format'

interface Detalle {
  id: number; codigo: string | null; estado: string; respuesta_acepta: string
  nombre_solicitante: string; cargo_solicitante: string | null; proceso: string | null
  turno_solicitante: string | null; fecha_turno_solicitante: string | null
  nombre_acepta: string | null; turno_acepta: string | null; fecha_turno_acepta: string | null
  obser_solicitud: string | null; obser_acepta: string | null
}

type Resultado = 'ACEPTADO' | 'RECHAZADO' | null

export default function Responder() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const r = (params.get('r') ?? '').toLowerCase()

  const [detalle, setDetalle] = useState<Detalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState<Resultado>(null)
  const [resultado, setResultado] = useState<Resultado>(null)
  const [error, setError] = useState<string | null>(null)
  const [comentario, setComentario] = useState('')
  const [comentarioOk, setComentarioOk] = useState(false)

  const responder = useCallback(async (respuesta: Exclude<Resultado, null>) => {
    setGuardando(respuesta); setError(null)
    const { data, error } = await supabase.rpc('responder_solicitud', { p_token: token, p_respuesta: respuesta })
    setGuardando(null)
    if (error) return setError(error.message)
    const res = data as any
    if (!res?.ok) {
      if (res?.yaRespondida) { setResultado(res.respuesta as Resultado); return }
      return setError(res?.error ?? 'No fue posible registrar tu respuesta.')
    }
    setResultado(respuesta)
    // Avisa al coordinador (si aceptó) y al solicitante
    supabase.functions.invoke('notificar', { body: { tipo: 'companero_respondio', solicitud_id: res.id } }).catch(() => {})
    const { data: d } = await supabase.rpc('solicitud_por_token', { p_token: token })
    if (d) setDetalle(d as Detalle)
  }, [token])

  useEffect(() => {
    (async () => {
      if (!token) { setError('El enlace no es válido.'); setCargando(false); return }
      const { data, error } = await supabase.rpc('solicitud_por_token', { p_token: token })
      if (error || !data) { setError('El enlace no corresponde a ninguna solicitud.'); setCargando(false); return }
      const d = data as Detalle
      setDetalle(d)
      setCargando(false)
      if (d.respuesta_acepta !== 'PENDIENTE') {
        setResultado(d.respuesta_acepta === 'ACEPTADO' ? 'ACEPTADO' : d.respuesta_acepta === 'RECHAZADO' ? 'RECHAZADO' : null)
        return
      }
      // Un solo clic desde el correo: la respuesta se registra al abrir
      if (r === 'acepto') responder('ACEPTADO')
      else if (r === 'rechazo') responder('RECHAZADO')
    })()
  }, [token, r, responder])

  async function guardarComentario() {
    const { data } = await supabase.rpc('comentar_respuesta', { p_token: token, p_obser: comentario })
    if ((data as any)?.ok) setComentarioOk(true)
  }

  const aceptado = resultado === 'ACEPTADO'

  return (
    <div className="flex min-h-screen items-center justify-center bg-neu-bg p-4">
      <div className="modal-card w-full max-w-xl animate-fade-in overflow-hidden">
        <div className="bg-gradient-to-r from-[#0D2D6B] to-[#2A6FD6] px-6 py-6 text-center text-white">
          <img src="/cambiodeturnos/logo-blanco.png" alt="Clínica Santa Bárbara" className="mx-auto h-11 object-contain" />
          <h1 className="mt-3 flex items-center justify-center gap-2 text-lg font-bold">
            <ArrowLeftRight className="h-5 w-5" /> Solicitud de Cambio de Turno
          </h1>
          {detalle?.codigo && <p className="text-sm text-clinica-soft">{detalle.codigo}</p>}
        </div>

        <div className="space-y-4 p-6">
          {cargando || guardando ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-clinica" />
              <p className="mt-3 text-sm text-slate-500">{guardando ? 'Registrando tu respuesta…' : 'Cargando la solicitud…'}</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-6 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-rose-500" />
              <p className="mt-2 font-semibold text-rose-700">{error}</p>
            </div>
          ) : (
            <>
              {/* Resultado de la respuesta */}
              {resultado && (
                <div className={`rounded-2xl px-5 py-5 text-center text-white shadow-neu-sm ${aceptado ? 'bg-gradient-to-r from-[#065F46] to-[#10B981]' : 'bg-gradient-to-r from-[#9F1239] to-[#F43F5E]'}`}>
                  {aceptado ? <CheckCircle2 className="mx-auto h-12 w-12" /> : <XCircle className="mx-auto h-12 w-12" />}
                  <p className="mt-2 text-xl font-extrabold tracking-wide">{aceptado ? 'ACEPTASTE EL CAMBIO' : 'NO ACEPTASTE EL CAMBIO'}</p>
                  <p className="mt-1 text-sm text-white/85">
                    {aceptado
                      ? 'Tu respuesta quedó registrada. El coordinador fue notificado para dar el visto bueno final.'
                      : 'Tu respuesta quedó registrada y el solicitante fue notificado. La solicitud no continúa.'}
                  </p>
                </div>
              )}

              {/* Datos del solicitante — banda azul */}
              <div className="overflow-hidden rounded-2xl bg-neu-bg shadow-neu-sm ring-1 ring-[#16468E]/25">
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#0D2D6B] to-[#2A6FD6] px-4 py-2 text-white">
                  <User className="h-4 w-4" /><span className="text-sm font-bold">Quien solicita el cambio</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <Dato tono="solicitante" label="Nombre" value={detalle?.nombre_solicitante} />
                  <Dato tono="solicitante" label="Cargo" value={detalle?.cargo_solicitante} />
                  <Dato tono="solicitante" label="Proceso" value={detalle?.proceso} />
                  <Dato tono="solicitante" label="Su turno" value={detalle?.turno_solicitante} />
                  <div className="col-span-2">
                    <Dato tono="solicitante" label="Fecha del turno que te cede" value={fmtFechaTurno(detalle?.fecha_turno_solicitante)} />
                  </div>
                </div>
              </div>

              {/* Turno que asumirías — banda ámbar */}
              <div className="overflow-hidden rounded-2xl bg-neu-bg shadow-neu-sm ring-1 ring-[#D97706]/25">
                <div className="flex items-center gap-2 bg-gradient-to-r from-[#B45309] to-[#F59E0B] px-4 py-2 text-white">
                  <CalendarClock className="h-4 w-4" /><span className="text-sm font-bold">El cambio propuesto</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <Dato tono="cambio" label="Turno que entregas" value={detalle?.turno_acepta} />
                  <Dato tono="cambio" label="Fecha" value={fmtFechaTurno(detalle?.fecha_turno_acepta)} />
                  {detalle?.obser_solicitud && (
                    <div className="col-span-2"><Dato tono="cambio" label="Observación del solicitante" value={detalle.obser_solicitud} /></div>
                  )}
                </div>
              </div>

              {/* Botones de respuesta (si aún no ha respondido) */}
              {!resultado && (
                <div className="panel-inset p-4">
                  <p className="mb-3 text-center text-sm font-semibold text-clinica">
                    ¿Aceptas asumir este cambio de turno con {detalle?.nombre_solicitante}?
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button onClick={() => responder('ACEPTADO')} className="btn-primary flex-1 bg-emerald-600 py-3 text-base hover:bg-emerald-700">
                      <CheckCircle2 className="h-5 w-5" /> ACEPTO
                    </button>
                    <button onClick={() => responder('RECHAZADO')} className="btn-danger flex-1 py-3 text-base">
                      <XCircle className="h-5 w-5" /> NO ACEPTO
                    </button>
                  </div>
                </div>
              )}

              {/* Comentario opcional */}
              {resultado && !detalle?.obser_acepta && (
                comentarioOk ? (
                  <p className="rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">Comentario guardado. ¡Gracias!</p>
                ) : (
                  <div className="panel-inset p-4">
                    <label className="label flex items-center gap-2"><MessageSquare className="h-4 w-4 text-clinica-mid" /> ¿Deseas agregar un comentario? (opcional)</label>
                    <textarea rows={2} className="input resize-none" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escribe aquí tu observación…" />
                    <button onClick={guardarComentario} disabled={!comentario.trim()} className="btn-secondary mt-2 w-full disabled:opacity-50">
                      <Send className="h-4 w-4" /> Guardar comentario
                    </button>
                  </div>
                )
              )}

              {detalle?.obser_acepta && (
                <div className="panel-inset p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Tu comentario</p>
                  <p className="text-sm text-slate-700">{detalle.obser_acepta}</p>
                </div>
              )}
            </>
          )}

          <a href={APP_URL} className="block pt-1 text-center text-xs font-semibold text-clinica-mid hover:underline">
            Ir a la aplicación de Cambios de Turnos
          </a>
        </div>
      </div>
    </div>
  )
}

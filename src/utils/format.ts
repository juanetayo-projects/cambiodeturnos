import { Estado, RespuestaAcepta } from '../types'

export function fmtFecha(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return d.toLocaleString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function fmtFechaHora(v?: string | null): { fecha: string; hora: string } {
  if (!v) return { fecha: '—', hora: '' }
  const d = new Date(v)
  if (isNaN(d.getTime())) return { fecha: v, hora: '' }
  return {
    fecha: d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    hora: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  }
}

export function fmtSoloFecha(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v + (v.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return v
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/** Fecha del turno con el día de la semana (p. ej. "Miércoles 29/07/2026"). */
export function fmtFechaTurno(v?: string | null): string {
  if (!v) return '—'
  const d = new Date(v + (v.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return v
  const dia = d.toLocaleDateString('es-CO', { weekday: 'long' })
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
}

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

/** Todos los estados del ciclo de vida, en orden de avance. */
export const ESTADOS: Estado[] = [
  'PENDIENTE_COMPANERO',
  'PENDIENTE_COORDINADOR',
  'APROBADA',
  'NEGADA',
  'RECHAZADA_COMPANERO',
  'PENDIENTE',
]

export const ESTADO_LABEL: Record<Estado, string> = {
  PENDIENTE: 'PENDIENTE',
  PENDIENTE_COMPANERO: 'ESPERA COMPAÑERO',
  PENDIENTE_COORDINADOR: 'ESPERA VoBo.',
  RECHAZADA_COMPANERO: 'NO ACEPTADA',
  APROBADA: 'APROBADA',
  NEGADA: 'NEGADA',
}

export const ESTADO_COLOR: Record<Estado, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 ring-amber-200',
  PENDIENTE_COMPANERO: 'bg-teal-100 text-teal-700 ring-teal-200',
  PENDIENTE_COORDINADOR: 'bg-pink-100 text-pink-700 ring-pink-200',
  RECHAZADA_COMPANERO: 'bg-orange-100 text-orange-700 ring-orange-200',
  APROBADA: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  NEGADA: 'bg-rose-100 text-rose-700 ring-rose-200',
}

export const RESPUESTA_LABEL: Record<RespuestaAcepta, string> = {
  PENDIENTE: 'Pendiente de respuesta',
  ACEPTADO: 'Aceptó el cambio',
  RECHAZADO: 'No aceptó el cambio',
  NO_APLICA: 'No aplica (histórico)',
}

export const RESPUESTA_COLOR: Record<RespuestaAcepta, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 ring-amber-200',
  ACEPTADO: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  RECHAZADO: 'bg-rose-100 text-rose-700 ring-rose-200',
  NO_APLICA: 'bg-slate-100 text-slate-500 ring-slate-200',
}

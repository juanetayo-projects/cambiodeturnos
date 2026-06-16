import { Estado } from '../types'

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

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const ESTADO_COLOR: Record<Estado, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 ring-amber-200',
  APROBADA: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  NEGADA: 'bg-rose-100 text-rose-700 ring-rose-200',
}

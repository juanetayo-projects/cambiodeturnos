// =====================================================================
//  Reglas de negocio del cambio de turno (espejo de las validaciones
//  que aplica la base de datos en la migración 0011).
//
//  1. Los dos turnos deben estar dentro de la misma semana (lunes a domingo).
//  2. El cambio debe registrarse/autorizarse con al menos 24 horas de
//     anticipación al turno más próximo.
//  5/6. Máximo 3 solicitudes por mes, salvo que el colaborador sea estudiante.
// =====================================================================

export const LIMITE_MENSUAL = 3
export const HORAS_ANTICIPACION = 24

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** Convierte 'YYYY-MM-DD' a Date local (evita el corrimiento por UTC). */
export function aFecha(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function aISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Lunes de la semana a la que pertenece la fecha. */
export function inicioSemana(iso: string): Date {
  const d = aFecha(iso)
  const offset = (d.getDay() + 6) % 7 // 0 = lunes
  d.setDate(d.getDate() - offset)
  return d
}

/** Domingo de la semana a la que pertenece la fecha. */
export function finSemana(iso: string): Date {
  const d = inicioSemana(iso)
  d.setDate(d.getDate() + 6)
  return d
}

export function mismaSemana(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return true
  return aISO(inicioSemana(a)) === aISO(inicioSemana(b))
}

/** Los 7 días hábiles de la semana permitida, para mostrarlos en el modal. */
export function diasDeLaSemana(iso: string): { dia: string; fecha: string; iso: string; hoy: boolean; vencido: boolean }[] {
  const lunes = inicioSemana(iso)
  const hoyISO = aISO(new Date())
  return DIAS_SEMANA.map((dia, i) => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + i)
    const isoDia = aISO(d)
    return {
      dia,
      iso: isoDia,
      fecha: d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
      hoy: isoDia === hoyISO,
      vencido: !cumple24h(isoDia),
    }
  })
}

/** Horas que faltan para el inicio (00:00) del turno indicado. */
export function horasHastaTurno(iso: string): number {
  return (aFecha(iso).getTime() - Date.now()) / 36e5
}

/** ¿La fecha del turno está a más de 24 horas? */
export function cumple24h(iso?: string | null): boolean {
  if (!iso) return true
  return horasHastaTurno(iso) > HORAS_ANTICIPACION
}

/** Primera fecha seleccionable en los campos de turno (hoy + 2 días). */
export function fechaMinimaTurno(): string {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return aISO(d)
}

export function fmtDMY(d: Date): string {
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function rangoSemana(iso: string): string {
  return `${fmtDMY(inicioSemana(iso))} al ${fmtDMY(finSemana(iso))}`
}

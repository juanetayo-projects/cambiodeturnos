export type Rol = 'asistencial' | 'coordinador' | 'administrador'

/** Ciclo de vida de la solicitud (PENDIENTE queda solo para el histórico). */
export type Estado =
  | 'PENDIENTE'
  | 'PENDIENTE_COMPANERO'
  | 'PENDIENTE_COORDINADOR'
  | 'RECHAZADA_COMPANERO'
  | 'APROBADA'
  | 'NEGADA'

/** Respuesta del compañero que asume el turno (se registra desde el correo). */
export type RespuestaAcepta = 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'NO_APLICA'

export interface Profile {
  id: string
  nombre: string
  correo: string
  rol: Rol
  cargo: string | null
  documento: string | null
  activo: boolean
  es_estudiante: boolean
  created_at: string
  updated_at: string
}

export interface Area {
  id: number
  nombre: string
  activo: boolean
}

export interface Cargo {
  id: number
  nombre: string
  activo: boolean
}

export interface Turno {
  id: number
  nombre: string
  orden: number
  activo: boolean
}

export interface Coordinador {
  id: number
  area_id: number | null
  cargo: string
  nombre: string | null
  correo: string
  link: string | null
  activo: boolean
}

export interface Solicitud {
  id: number
  codigo: string | null
  fecha_solicitud: string
  cargo_solicitante: string | null
  area_id: number | null
  proceso: string | null
  jefe_proceso: string | null
  correo_coordinador: string | null
  nombre_solicitante: string
  doc_solicitante: string | null
  correo_solicitante: string
  turno_solicitante: string | null
  fecha_turno_solicitante: string | null
  nombre_acepta: string | null
  doc_acepta: string | null
  correo_acepta: string | null
  turno_acepta: string | null
  fecha_turno_acepta: string | null
  acepta_terminos: boolean
  estado: Estado
  respuesta_acepta: RespuestaAcepta
  fecha_respuesta_acepta: string | null
  obser_acepta: string | null
  token_acepta: string | null
  obser_solicitud: string | null
  obser_respuesta: string | null
  solicitante_id: string | null
  resuelto_por: string | null
  fecha_resolucion: string | null
  created_at: string
  updated_at: string
}

/** Cupo mensual de solicitudes del colaborador (RPC cupo_solicitudes). */
export interface Cupo {
  usadas: number
  limite: number
  es_estudiante: boolean
  ilimitado: boolean
}

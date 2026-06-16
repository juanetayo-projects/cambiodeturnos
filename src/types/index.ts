export type Rol = 'asistencial' | 'coordinador' | 'administrador'
export type Estado = 'PENDIENTE' | 'APROBADA' | 'NEGADA'

export interface Profile {
  id: string
  nombre: string
  correo: string
  rol: Rol
  cargo: string | null
  documento: string | null
  activo: boolean
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
  obser_solicitud: string | null
  obser_respuesta: string | null
  solicitante_id: string | null
  resuelto_por: string | null
  fecha_resolucion: string | null
  created_at: string
  updated_at: string
}

// Configuración pública de Supabase.
// La clave "publishable/anon" es pública por diseño: el acceso está protegido por RLS.
// Puede sobreescribirse con variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_KEY.

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://rykondrasrvnuurolqqk.supabase.co'

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_oB0FQDX-skyHx7DOG2odww_nWMKA1kE'

// URL pública de la app (para enlaces en correos)
export const APP_URL =
  import.meta.env.VITE_APP_URL || 'https://juanetayo-projects.github.io/cambiodeturnos/'

export const CLINICA = {
  nombre: 'Clínica de Alta Complejidad Santa Bárbara',
  app: 'Cambios de Turnos',
}

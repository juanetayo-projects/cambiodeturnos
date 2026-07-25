import { ReactNode } from 'react'

/**
 * Banda de color que identifica cada grupo de información.
 * Cada actor del proceso tiene su propio tono para diferenciarlo de un vistazo.
 */
export type Tono = 'solicitante' | 'proceso' | 'cambio' | 'acepta' | 'coordinador'

export const TONOS: Record<Tono, { grad: string; texto: string; suave: string; borde: string; punto: string }> = {
  // Azul institucional — quien solicita el cambio
  solicitante: { grad: 'from-[#0D2D6B] to-[#2A6FD6]', texto: 'text-[#0D2D6B]', suave: 'bg-[#E8EEF8]', borde: 'ring-[#16468E]/25', punto: 'bg-[#16468E]' },
  // Violeta — proceso / área
  proceso: { grad: 'from-[#4C1D95] to-[#8B5CF6]', texto: 'text-[#5B21B6]', suave: 'bg-[#EDE9FE]', borde: 'ring-[#7C3AED]/25', punto: 'bg-[#7C3AED]' },
  // Ámbar — datos del cambio (turnos y fechas)
  cambio: { grad: 'from-[#B45309] to-[#F59E0B]', texto: 'text-[#92400E]', suave: 'bg-[#FEF3C7]', borde: 'ring-[#D97706]/25', punto: 'bg-[#D97706]' },
  // Verde azulado — quien acepta (o no) el cambio
  acepta: { grad: 'from-[#0F766E] to-[#2DD4BF]', texto: 'text-[#0F766E]', suave: 'bg-[#CCFBF1]', borde: 'ring-[#0D9488]/25', punto: 'bg-[#0D9488]' },
  // Magenta — visto bueno del coordinador
  coordinador: { grad: 'from-[#9D174D] to-[#F472B6]', texto: 'text-[#9D174D]', suave: 'bg-[#FCE7F3]', borde: 'ring-[#DB2777]/25', punto: 'bg-[#DB2777]' },
}

export default function Banda({
  tono, titulo, subtitulo, icono, n, extra, children,
}: {
  tono: Tono
  titulo: string
  subtitulo?: string
  icono?: ReactNode
  n?: number
  extra?: ReactNode
  children: ReactNode
}) {
  const t = TONOS[tono]
  return (
    <div className={`mb-4 overflow-hidden rounded-2xl bg-neu-bg shadow-neu-sm ring-1 ${t.borde}`}>
      <div className={`flex items-center gap-2.5 bg-gradient-to-r ${t.grad} px-4 py-2.5 text-white`}>
        {n !== undefined && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-extrabold">{n}</span>
        )}
        {icono}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold tracking-wide">{titulo}</h3>
          {subtitulo && <p className="truncate text-[11px] text-white/75">{subtitulo}</p>}
        </div>
        {extra && <div className="ml-auto shrink-0">{extra}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

/** Dato de solo lectura, con el punto de color del grupo al que pertenece. */
export function Dato({ label, value, tono }: { label: string; value?: string | null; tono: Tono }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span className={`h-1.5 w-1.5 rounded-full ${TONOS[tono].punto}`} />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-slate-800">{value || '—'}</p>
    </div>
  )
}

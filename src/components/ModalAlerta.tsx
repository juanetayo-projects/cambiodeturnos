import { ReactNode } from 'react'
import { AlertTriangle, CalendarRange, Clock, Ban, Info, X, CheckCircle2 } from 'lucide-react'

export type TipoAlerta = 'semana' | 'horas' | 'limite' | 'error' | 'info' | 'exito'

const META: Record<TipoAlerta, { grad: string; icono: ReactNode; anillo: string }> = {
  semana: { grad: 'from-[#B45309] to-[#F59E0B]', icono: <CalendarRange className="h-6 w-6" />, anillo: 'ring-[#D97706]/30' },
  horas: { grad: 'from-[#9D174D] to-[#F472B6]', icono: <Clock className="h-6 w-6" />, anillo: 'ring-[#DB2777]/30' },
  limite: { grad: 'from-[#7C2D12] to-[#EA580C]', icono: <Ban className="h-6 w-6" />, anillo: 'ring-[#EA580C]/30' },
  error: { grad: 'from-[#991B1B] to-[#EF4444]', icono: <AlertTriangle className="h-6 w-6" />, anillo: 'ring-[#EF4444]/30' },
  info: { grad: 'from-[#0D2D6B] to-[#2A6FD6]', icono: <Info className="h-6 w-6" />, anillo: 'ring-[#16468E]/30' },
  exito: { grad: 'from-[#065F46] to-[#10B981]', icono: <CheckCircle2 className="h-6 w-6" />, anillo: 'ring-[#10B981]/30' },
}

export default function ModalAlerta({
  tipo = 'info', titulo, mensaje, children, onClose, textoCerrar = 'Entendido',
}: {
  tipo?: TipoAlerta
  titulo: string
  mensaje?: string
  children?: ReactNode
  onClose: () => void
  textoCerrar?: string
}) {
  const m = META[tipo]
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`modal-card w-full max-w-lg animate-fade-in overflow-hidden ring-1 ${m.anillo}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-3 bg-gradient-to-r ${m.grad} px-5 py-4 text-white`}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20">{m.icono}</div>
          <h3 className="text-base font-bold leading-tight">{titulo}</h3>
          <button onClick={onClose} className="ml-auto rounded-lg p-1 transition hover:bg-white/20"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-5">
          {mensaje && <p className="text-sm leading-relaxed text-slate-700">{mensaje}</p>}
          {children}
          <button onClick={onClose} className="btn-primary w-full">{textoCerrar}</button>
        </div>
      </div>
    </div>
  )
}

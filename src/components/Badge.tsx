import { Estado } from '../types'
import { ESTADO_COLOR, ESTADO_LABEL } from '../utils/format'

export default function Badge({ estado }: { estado: Estado }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ESTADO_COLOR[estado] ?? ESTADO_COLOR.PENDIENTE}`}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  )
}

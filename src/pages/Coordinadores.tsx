import { Coordinadores as CoordinadoresManager } from './Catalogos'

export default function CoordinadoresPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Coordinadores / aprobadores por proceso. El correo aquí registrado es el que recibe la
        notificación cuando un colaborador de su área solicita un cambio de turno.
      </p>
      <CoordinadoresManager />
    </div>
  )
}

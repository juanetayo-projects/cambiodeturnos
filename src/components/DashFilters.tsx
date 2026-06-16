import { Filter, RotateCcw } from 'lucide-react'
import { useCatalogos } from '../lib/useCatalogos'
import { MESES } from '../utils/format'

export interface DashFiltersState {
  anio: string
  mes: string
  area_id: string
  estado: string
  turno: string
  cargo: string
}

export const emptyDashFilters: DashFiltersState = { anio: '', mes: '', area_id: '', estado: '', turno: '', cargo: '' }

const ESTADOS = ['PENDIENTE', 'APROBADA', 'NEGADA']
const ANIOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export function dashParams(f: DashFiltersState) {
  return {
    p_anio: f.anio ? Number(f.anio) : null,
    p_mes: f.mes ? Number(f.mes) : null,
    p_area_id: f.area_id ? Number(f.area_id) : null,
    p_estado: f.estado || null,
    p_turno: f.turno || null,
    p_cargo: f.cargo || null,
  }
}

export default function DashFilters({
  filters, setFilters,
}: { filters: DashFiltersState; setFilters: (f: DashFiltersState) => void }) {
  const { areas, turnos, cargos } = useCatalogos()
  const set = (k: keyof DashFiltersState, v: string) => setFilters({ ...filters, [k]: v })

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2 text-clinica">
        <Filter className="h-4 w-4" /><span className="text-sm font-semibold">Filtros</span>
        <button onClick={() => setFilters(emptyDashFilters)} className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-clinica">
          <RotateCcw className="h-3 w-3" /> Limpiar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <select className="input" value={filters.anio} onChange={(e) => set('anio', e.target.value)}>
          <option value="">Año</option>{ANIOS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input" value={filters.mes} onChange={(e) => set('mes', e.target.value)}>
          <option value="">Mes</option>{MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input" value={filters.area_id} onChange={(e) => set('area_id', e.target.value)}>
          <option value="">Proceso / Área</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
        <select className="input" value={filters.estado} onChange={(e) => set('estado', e.target.value)}>
          <option value="">Estado</option>{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="input" value={filters.turno} onChange={(e) => set('turno', e.target.value)}>
          <option value="">Turno</option>{turnos.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
        </select>
        <select className="input" value={filters.cargo} onChange={(e) => set('cargo', e.target.value)}>
          <option value="">Cargo</option>{cargos.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </select>
      </div>
    </div>
  )
}

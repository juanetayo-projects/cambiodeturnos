import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { ClipboardList, CheckCircle2, XCircle, Clock, CalendarRange, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MetricCard from '../components/MetricCard'
import DashFilters, { DashFiltersState, emptyDashFilters, dashParams } from '../components/DashFilters'
import { MESES } from '../utils/format'

const COLORS = ['#0D2D6B', '#16468E', '#1F5BB5', '#3B82F6', '#60A5FA', '#93C5FD', '#0891B2', '#06B6D4', '#0EA5E9', '#6366F1', '#8B5CF6', '#A78BFA', '#F59E0B', '#10B981']
const ESTADO_COLORS: Record<string, string> = { APROBADA: '#10B981', NEGADA: '#EF4444', PENDIENTE: '#F59E0B' }

export default function Dashboard() {
  const [filters, setFilters] = useState<DashFiltersState>(emptyDashFilters)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.rpc('dashboard_data', dashParams(filters)).then(({ data }) => {
      setData(data)
      setLoading(false)
    })
  }, [filters])

  const resumen = data?.resumen
  const pct = (n: number) => resumen?.total ? Math.round((n / Number(resumen.total)) * 100) : 0
  const porMes = MESES.map((nombre, i) => {
    const row = (data?.por_mes ?? []).find((x: any) => x.mes === i + 1)
    return { mes: nombre.slice(0, 3), Aprobadas: row?.aprobadas ?? 0, Negadas: row?.negadas ?? 0, Pendientes: row?.pendientes ?? 0 }
  })
  const estados = (data?.estados ?? []).map((x: any) => ({ name: x.estado, value: Number(x.n) }))
  const porTurno = (data?.por_turno ?? []).map((x: any) => ({ name: x.turno, value: Number(x.n) }))
  const porArea = (data?.por_area ?? []).map((x: any) => ({ name: x.area, value: Number(x.n) }))

  return (
    <div className="space-y-6">
      <DashFilters filters={filters} setFilters={setFilters} />

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-clinica" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard title="Total solicitudes" value={Number(resumen?.total ?? 0).toLocaleString('es-CO')} icon={<ClipboardList className="h-6 w-6" />} color="blue" />
            <MetricCard title="Aprobadas" value={Number(resumen?.aprobadas ?? 0).toLocaleString('es-CO')} subtitle={`${pct(Number(resumen?.aprobadas ?? 0))}% del total`} icon={<CheckCircle2 className="h-6 w-6" />} color="green" />
            <MetricCard title="Negadas" value={Number(resumen?.negadas ?? 0).toLocaleString('es-CO')} subtitle={`${pct(Number(resumen?.negadas ?? 0))}% del total`} icon={<XCircle className="h-6 w-6" />} color="red" />
            <MetricCard title="Pendientes" value={Number(resumen?.pendientes ?? 0).toLocaleString('es-CO')} icon={<Clock className="h-6 w-6" />} color="amber" />
            <MetricCard title="Este mes" value={Number(resumen?.este_mes ?? 0).toLocaleString('es-CO')} icon={<CalendarRange className="h-6 w-6" />} color="violet" />
          </div>

          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold text-clinica">Solicitudes por mes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Aprobadas" stackId="a" fill="#10B981" />
                <Bar dataKey="Negadas" stackId="a" fill="#EF4444" />
                <Bar dataKey="Pendientes" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-bold text-clinica">Distribución por estado</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={estados} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={(e: any) => `${e.name}: ${e.value}`}>
                    {estados.map((e: any) => <Cell key={e.name} fill={ESTADO_COLORS[e.name] ?? '#16468E'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-sm font-bold text-clinica">Solicitudes por turno</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porTurno} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16468E" radius={[0, 4, 4, 0]} name="Solicitudes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 text-sm font-bold text-clinica">Solicitudes por proceso / área</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={porArea} margin={{ bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={80} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Solicitudes">
                  {porArea.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

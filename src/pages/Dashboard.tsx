import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { ClipboardList, CheckCircle2, XCircle, Clock, CalendarRange, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import MetricCard from '../components/MetricCard'
import { MESES } from '../utils/format'

const COLORS = ['#0D2D6B', '#16468E', '#1F5BB5', '#3B82F6', '#60A5FA', '#93C5FD', '#0891B2', '#06B6D4', '#0EA5E9', '#6366F1', '#8B5CF6', '#A78BFA', '#F59E0B', '#10B981']
const ESTADO_COLORS: Record<string, string> = { APROBADA: '#10B981', NEGADA: '#EF4444', PENDIENTE: '#F59E0B' }
const ANIOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function Dashboard() {
  const [anio, setAnio] = useState(new Date().getFullYear())
  const [resumen, setResumen] = useState<any>(null)
  const [porMes, setPorMes] = useState<any[]>([])
  const [porArea, setPorArea] = useState<any[]>([])
  const [porTurno, setPorTurno] = useState<any[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.rpc('stats_resumen'),
      supabase.rpc('stats_por_mes', { p_anio: anio }),
      supabase.rpc('stats_por_area'),
      supabase.rpc('stats_por_turno'),
      supabase.rpc('stats_estados'),
    ]).then(([r, m, a, t, e]) => {
      setResumen(r.data?.[0] ?? null)
      const mesesData = MESES.map((nombre, i) => {
        const row = (m.data ?? []).find((x: any) => x.mes === i + 1)
        return { mes: nombre.slice(0, 3), Aprobadas: row?.aprobadas ?? 0, Negadas: row?.negadas ?? 0, Pendientes: row?.pendientes ?? 0 }
      })
      setPorMes(mesesData)
      setPorArea((a.data ?? []).map((x: any) => ({ name: x.area, value: Number(x.n) })))
      setPorTurno((t.data ?? []).map((x: any) => ({ name: x.turno, value: Number(x.n) })))
      setEstados((e.data ?? []).map((x: any) => ({ name: x.estado, value: Number(x.n) })))
      setLoading(false)
    })
  }, [anio])

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-clinica" /></div>

  const pct = (n: number) => resumen?.total ? Math.round((n / Number(resumen.total)) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Resumen general de solicitudes de cambio de turno</p>
        <select className="input w-auto" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
          {ANIOS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Total solicitudes" value={Number(resumen?.total ?? 0).toLocaleString('es-CO')} icon={<ClipboardList className="h-6 w-6" />} color="blue" />
        <MetricCard title="Aprobadas" value={Number(resumen?.aprobadas ?? 0).toLocaleString('es-CO')} subtitle={`${pct(Number(resumen?.aprobadas ?? 0))}% del total`} icon={<CheckCircle2 className="h-6 w-6" />} color="green" />
        <MetricCard title="Negadas" value={Number(resumen?.negadas ?? 0).toLocaleString('es-CO')} subtitle={`${pct(Number(resumen?.negadas ?? 0))}% del total`} icon={<XCircle className="h-6 w-6" />} color="red" />
        <MetricCard title="Pendientes" value={Number(resumen?.pendientes ?? 0).toLocaleString('es-CO')} icon={<Clock className="h-6 w-6" />} color="amber" />
        <MetricCard title="Este mes" value={Number(resumen?.este_mes ?? 0).toLocaleString('es-CO')} icon={<CalendarRange className="h-6 w-6" />} color="violet" />
      </div>

      {/* Gráfico mensual */}
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-bold text-clinica">Solicitudes por mes · {anio}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={porMes}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Aprobadas" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Negadas" stackId="a" fill="#EF4444" />
            <Bar dataKey="Pendientes" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Estados pie */}
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-clinica">Distribución por estado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={estados} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={(e: any) => `${e.name}: ${e.value}`}>
                {estados.map((e) => <Cell key={e.name} fill={ESTADO_COLORS[e.name] ?? '#16468E'} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Por turno */}
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

      {/* Por área */}
      <div className="card p-5">
        <h3 className="mb-4 text-sm font-bold text-clinica">Solicitudes por proceso / área</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={porArea} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={80} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Solicitudes">
              {porArea.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

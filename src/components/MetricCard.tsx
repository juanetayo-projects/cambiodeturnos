import { ReactNode } from 'react'

type Color = 'blue' | 'green' | 'red' | 'amber' | 'violet' | 'cyan'

const STYLES: Record<Color, { bg: string; ring: string; text: string; icon: string }> = {
  blue:   { bg: 'from-clinica to-clinica-mid', ring: 'ring-clinica/20', text: 'text-white', icon: 'bg-white/20' },
  green:  { bg: 'from-emerald-500 to-emerald-600', ring: 'ring-emerald-200', text: 'text-white', icon: 'bg-white/20' },
  red:    { bg: 'from-rose-500 to-rose-600', ring: 'ring-rose-200', text: 'text-white', icon: 'bg-white/20' },
  amber:  { bg: 'from-amber-400 to-amber-500', ring: 'ring-amber-200', text: 'text-white', icon: 'bg-white/25' },
  violet: { bg: 'from-violet-500 to-violet-600', ring: 'ring-violet-200', text: 'text-white', icon: 'bg-white/20' },
  cyan:   { bg: 'from-cyan-500 to-cyan-600', ring: 'ring-cyan-200', text: 'text-white', icon: 'bg-white/20' },
}

export default function MetricCard({
  title, value, icon, color = 'blue', subtitle,
}: { title: string; value: ReactNode; icon: ReactNode; color?: Color; subtitle?: string }) {
  const s = STYLES[color]
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.bg} p-5 shadow-metric ring-1 ${s.ring} transition hover:-translate-y-0.5 hover:shadow-card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium opacity-90 ${s.text}`}>{title}</p>
          <p className={`mt-2 text-3xl font-extrabold ${s.text}`}>{value}</p>
          {subtitle && <p className={`mt-1 text-xs opacity-80 ${s.text}`}>{subtitle}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.icon} ${s.text}`}>{icon}</div>
      </div>
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
    </div>
  )
}

import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FilePlus2, ClipboardList, BarChart3, Users, Settings,
  LogOut, Menu, X, ChevronDown,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Rol } from '../types'

interface NavItem { to: string; label: string; icon: ReactNode; roles: Rol[] }

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, roles: ['coordinador', 'administrador'] },
  { to: '/solicitar', label: 'Nueva Solicitud', icon: <FilePlus2 className="h-5 w-5" />, roles: ['asistencial', 'administrador'] },
  { to: '/solicitudes', label: 'Solicitudes', icon: <ClipboardList className="h-5 w-5" />, roles: ['asistencial', 'coordinador', 'administrador'] },
  { to: '/reportes', label: 'Reportes', icon: <BarChart3 className="h-5 w-5" />, roles: ['coordinador', 'administrador'] },
  { to: '/usuarios', label: 'Usuarios', icon: <Users className="h-5 w-5" />, roles: ['administrador'] },
  { to: '/catalogos', label: 'Catálogos', icon: <Settings className="h-5 w-5" />, roles: ['administrador'] },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)

  const items = NAV.filter((n) => profile && n.roles.includes(profile.rol))

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-clinica-tint">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-clinica text-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative border-b border-white/10 px-5 py-6 text-center">
          <img src="/cambiodeturnos/logo-blanco.png" alt="Logo" className="mx-auto h-12 object-contain" />
          <p className="mt-3 text-base font-bold leading-tight">Cambios de Turnos</p>
          <p className="text-[11px] text-clinica-soft">Clínica Santa Bárbara</p>
          <button className="absolute right-4 top-4 lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((it) => {
            const active = location.pathname === it.to
            return (
              <Link
                key={it.to}
                to={it.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? 'bg-white text-clinica shadow-card' : 'text-clinica-soft hover:bg-white/10'
                }`}
              >
                {it.icon}
                {it.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Contenido */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-6 w-6 text-clinica" /></button>
          <h1 className="text-lg font-bold text-clinica">
            {items.find((i) => i.to === location.pathname)?.label ?? 'Cambios de Turnos'}
          </h1>
          <div className="relative ml-auto">
            <button
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-clinica-tint"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clinica font-bold text-white">
                {profile?.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-700">{profile?.nombre}</p>
                <p className="text-xs capitalize text-slate-400">{profile?.rol}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {menu && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-card">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-700">{profile?.nombre}</p>
                  <p className="truncate text-xs text-slate-400">{profile?.correo}</p>
                </div>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

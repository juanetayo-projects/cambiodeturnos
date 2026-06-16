import { useEffect, useState } from 'react'
import { Loader2, Search, Pencil, X, ShieldCheck, UserCog, User as UserIcon, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCatalogos } from '../lib/useCatalogos'
import { Profile, Rol } from '../types'

const ROL_META: Record<Rol, { label: string; color: string; icon: any }> = {
  administrador: { label: 'Administrador', color: 'bg-violet-100 text-violet-700', icon: ShieldCheck },
  coordinador: { label: 'Coordinador', color: 'bg-clinica-soft text-clinica', icon: UserCog },
  asistencial: { label: 'Asistencial', color: 'bg-slate-100 text-slate-600', icon: UserIcon },
}

export default function Usuarios() {
  const { areas } = useCatalogos()
  const [users, setUsers] = useState<Profile[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<Profile | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers((data as Profile[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = users.filter((u) =>
    !q || u.nombre.toLowerCase().includes(q.toLowerCase()) || u.correo.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-4">
      <div className="card flex items-center gap-3 p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Buscar usuario…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <span className="ml-auto text-sm text-slate-500">{filtered.length} usuarios</span>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-clinica text-left text-xs uppercase text-white">
              <th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th><th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-10 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-clinica" /></td></tr>
            ) : filtered.map((u, i) => {
              const M = ROL_META[u.rol]; const Icon = M.icon
              return (
                <tr key={u.id} className={`border-b border-slate-50 ${i % 2 ? 'bg-clinica-tint' : 'bg-white'}`}>
                  <td className="px-4 py-3"><p className="font-medium text-slate-800">{u.nombre}</p><p className="text-xs text-slate-400">{u.correo}</p></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${M.color}`}><Icon className="h-3 w-3" />{M.label}</span></td>
                  <td className="px-4 py-3">{u.activo ? <span className="text-xs font-medium text-emerald-600">● Activo</span> : <span className="text-xs font-medium text-slate-400">● Inactivo</span>}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setEdit(u)} className="rounded-lg p-1.5 text-clinica hover:bg-clinica-soft"><Pencil className="h-4 w-4" /></button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {edit && <EditUserModal user={edit} areas={areas} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </div>
  )
}

function EditUserModal({ user, areas, onClose, onSaved }: { user: Profile; areas: any[]; onClose: () => void; onSaved: () => void }) {
  const [rol, setRol] = useState<Rol>(user.rol)
  const [activo, setActivo] = useState(user.activo)
  const [selAreas, setSelAreas] = useState<number[]>([])
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('profile_areas').select('area_id').eq('profile_id', user.id)
      .then(({ data }) => setSelAreas((data ?? []).map((r: any) => r.area_id)))
  }, [user.id])

  function toggleArea(id: number) {
    setSelAreas((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  async function save() {
    setError(null)
    if (password && password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    setSaving(true)
    await supabase.from('profiles').update({ rol, activo }).eq('id', user.id)
    await supabase.from('profile_areas').delete().eq('profile_id', user.id)
    if (rol === 'coordinador' && selAreas.length)
      await supabase.from('profile_areas').insert(selAreas.map((area_id) => ({ profile_id: user.id, area_id })))
    if (password) {
      const { data, error } = await supabase.functions.invoke('set-password', { body: { user_id: user.id, password } })
      if (error || (data && (data as any).error)) {
        setSaving(false)
        return setError('No se pudo cambiar la contraseña: ' + (error?.message || (data as any).error))
      }
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-clinica px-6 py-4 text-white">
          <h3 className="text-lg font-bold">Editar usuario</h3><button onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4 p-6">
          <div><p className="font-semibold text-slate-800">{user.nombre}</p><p className="text-sm text-slate-400">{user.correo}</p></div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <div>
            <label className="label">Rol</label>
            <select className="input" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
              <option value="asistencial">Asistencial</option>
              <option value="coordinador">Coordinador</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          {rol === 'coordinador' && (
            <div>
              <label className="label">Áreas / procesos que supervisa</label>
              <div className="grid max-h-44 grid-cols-1 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
                {areas.map((a) => (
                  <button key={a.id} type="button" onClick={() => toggleArea(a.id)}
                    className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${selAreas.includes(a.id) ? 'bg-clinica-soft text-clinica' : 'hover:bg-slate-50'}`}>
                    <span className={`flex h-4 w-4 items-center justify-center rounded border ${selAreas.includes(a.id) ? 'border-clinica bg-clinica text-white' : 'border-slate-300'}`}>
                      {selAreas.includes(a.id) && <Check className="h-3 w-3" />}
                    </span>
                    {a.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="label">Nueva contraseña <span className="font-normal text-slate-400">(opcional — déjala vacía para no cambiarla)</span></label>
            <input type="text" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-clinica" />
            Usuario activo
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

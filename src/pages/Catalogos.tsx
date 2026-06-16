import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

type Tab = 'areas' | 'cargos' | 'turnos' | 'coordinadores'
const TABS: { key: Tab; label: string }[] = [
  { key: 'areas', label: 'Áreas / Procesos' },
  { key: 'cargos', label: 'Cargos' },
  { key: 'turnos', label: 'Turnos' },
  { key: 'coordinadores', label: 'Coordinadores' },
]

export default function Catalogos() {
  const [tab, setTab] = useState<Tab>('areas')
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === t.key ? 'bg-clinica text-white shadow-card' : 'bg-white text-clinica hover:bg-clinica-soft'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'coordinadores' ? <Coordinadores /> : <SimpleCatalog tabla={tab} key={tab} />}
    </div>
  )
}

function SimpleCatalog({ tabla }: { tabla: 'areas' | 'cargos' | 'turnos' }) {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevo, setNuevo] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  async function load() {
    setLoading(true)
    const order = tabla === 'turnos' ? 'orden' : 'nombre'
    const { data } = await supabase.from(tabla).select('*').order(order)
    setRows(data ?? []); setLoading(false)
  }
  useEffect(() => { load() }, [tabla])

  async function agregar() {
    if (!nuevo.trim()) return
    const payload: any = { nombre: nuevo.trim() }
    if (tabla === 'turnos') payload.orden = rows.length + 1
    await supabase.from(tabla).insert(payload)
    setNuevo(''); load()
  }
  async function guardar(id: number) {
    await supabase.from(tabla).update({ nombre: editVal }).eq('id', id)
    setEditId(null); load()
  }
  async function toggle(r: any) { await supabase.from(tabla).update({ activo: !r.activo }).eq('id', r.id); load() }
  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este registro?')) return
    const { error } = await supabase.from(tabla).delete().eq('id', id)
    if (error) alert('No se puede eliminar: está en uso por otros registros.')
    load()
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-2 border-b border-slate-100 p-4">
        <input className="input" placeholder="Nuevo registro…" value={nuevo} onChange={(e) => setNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregar()} />
        <button onClick={agregar} className="btn-primary whitespace-nowrap"><Plus className="h-4 w-4" /> Agregar</button>
      </div>
      {loading ? <div className="py-10 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-clinica" /></div> : (
        <table className="min-w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-slate-400"><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">Estado</th><th className="px-4 py-2 text-right">Acciones</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-t border-slate-50 ${i % 2 ? 'bg-clinica-tint' : ''}`}>
                <td className="px-4 py-2">
                  {editId === r.id ? <input className="input py-1" value={editVal} onChange={(e) => setEditVal(e.target.value)} /> : <span className="text-slate-700">{r.nombre}</span>}
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => toggle(r)} className={`text-xs font-medium ${r.activo ? 'text-emerald-600' : 'text-slate-400'}`}>● {r.activo ? 'Activo' : 'Inactivo'}</button>
                </td>
                <td className="px-4 py-2 text-right">
                  {editId === r.id ? (
                    <button onClick={() => guardar(r.id)} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>
                  ) : (
                    <button onClick={() => { setEditId(r.id); setEditVal(r.nombre) }} className="rounded p-1.5 text-clinica hover:bg-clinica-soft"><Pencil className="h-4 w-4" /></button>
                  )}
                  <button onClick={() => eliminar(r.id)} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function Coordinadores() {
  const [rows, setRows] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [edit, setEdit] = useState<any | null>(null)

  async function load() {
    setLoading(true)
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('coordinadores').select('*').order('cargo'),
      supabase.from('areas').select('*').order('nombre'),
    ])
    setRows(c ?? []); setAreas(a ?? []); setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar coordinador?')) return
    await supabase.from('coordinadores').delete().eq('id', id); load()
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex justify-between border-b border-slate-100 p-4">
        <h3 className="text-sm font-bold text-clinica">Coordinadores / Aprobadores</h3>
        <button onClick={() => setEdit({ cargo: '', correo: '', nombre: '', area_id: '', link: '', activo: true })} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo</button>
      </div>
      {loading ? <div className="py-10 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-clinica" /></div> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead><tr className="bg-clinica text-left text-xs uppercase text-white"><th className="px-4 py-3">Cargo</th><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Área</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={`border-b border-slate-50 ${i % 2 ? 'bg-clinica-tint' : 'bg-white'}`}>
                  <td className="px-4 py-2.5 text-slate-700">{r.cargo}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.nombre}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.correo}</td>
                  <td className="px-4 py-2.5 text-slate-600">{areas.find((a) => a.id === r.area_id)?.nombre ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => setEdit(r)} className="rounded p-1.5 text-clinica hover:bg-clinica-soft"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => eliminar(r.id)} className="rounded p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {edit && <CoordModal row={edit} areas={areas} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </div>
  )
}

function CoordModal({ row, areas, onClose, onSaved }: { row: any; areas: any[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({ ...row })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }))

  async function save() {
    setSaving(true)
    const payload = { cargo: f.cargo, nombre: f.nombre, correo: f.correo, link: f.link || null, area_id: f.area_id ? Number(f.area_id) : null, activo: f.activo }
    if (row.id) await supabase.from('coordinadores').update(payload).eq('id', row.id)
    else await supabase.from('coordinadores').insert(payload)
    setSaving(false); onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-clinica px-6 py-4 text-white"><h3 className="text-lg font-bold">{row.id ? 'Editar' : 'Nuevo'} coordinador</h3><button onClick={onClose}><X className="h-5 w-5" /></button></div>
        <div className="space-y-3 p-6">
          <div><label className="label">Cargo *</label><input className="input" value={f.cargo} onChange={(e) => set('cargo', e.target.value)} /></div>
          <div><label className="label">Nombre</label><input className="input" value={f.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} /></div>
          <div><label className="label">Correo *</label><input type="email" className="input" value={f.correo} onChange={(e) => set('correo', e.target.value)} /></div>
          <div><label className="label">Área / Proceso</label>
            <select className="input" value={f.area_id ?? ''} onChange={(e) => set('area_id', e.target.value)}>
              <option value="">—</option>{areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.activo} onChange={(e) => set('activo', e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-clinica" /> Activo</label>
          <div className="flex justify-end gap-2 pt-2"><button onClick={onClose} className="btn-secondary">Cancelar</button><button onClick={save} disabled={saving} className="btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}</button></div>
        </div>
      </div>
    </div>
  )
}

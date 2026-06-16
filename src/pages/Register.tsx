import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', documento: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.')
    if (form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    setLoading(true)
    const { error } = await signUp({
      email: form.email,
      password: form.password,
      nombre: form.nombre,
      documento: form.documento,
    })
    setLoading(false)
    if (error) setError(error)
    else setOk(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0D2D6B 0%, #16468E 100%)' }}>
      <div className="w-full max-w-md animate-fade-in overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-clinica px-8 py-7 text-center">
          <img src="/cambiodeturnos/logo-blanco.png" alt="Clínica Santa Bárbara" className="mx-auto h-12 object-contain" />
          <h1 className="mt-3 text-lg font-bold text-white">Crear Cuenta</h1>
          <p className="text-sm text-clinica-soft">Personal Asistencial</p>
        </div>

        {ok ? (
          <div className="px-8 py-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h2 className="mt-4 text-xl font-bold text-clinica">¡Cuenta creada!</h2>
            <p className="mt-2 text-sm text-slate-600">Ya puedes iniciar sesión con tu correo y contraseña.</p>
            <Link to="/login" className="btn-primary mt-6 w-full">Ir a Iniciar Sesión</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-7">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
            <div className="mb-3">
              <label className="label">Nombre completo</label>
              <input className="input" required value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="label">Documento</label>
              <input className="input" value={form.documento} onChange={(e) => set('documento', e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="label">Correo electrónico</label>
              <input type="email" className="input" required value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contraseña</label>
                <input type="password" className="input" required value={form.password} onChange={(e) => set('password', e.target.value)} />
              </div>
              <div>
                <label className="label">Confirmar</label>
                <input type="password" className="input" required value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Registrarme'}
            </button>
            <div className="mt-4 text-center text-sm text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-clinica-mid hover:underline">Inicia sesión</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

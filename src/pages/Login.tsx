import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0D2D6B 0%, #16468E 100%)' }}
    >
      <div className="w-full max-w-md animate-fade-in overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Encabezado azul con logo */}
        <div className="bg-clinica px-8 py-8 text-center">
          <img src="/cambiodeturnos/logo-blanco.png" alt="Clínica Santa Bárbara" className="mx-auto h-14 object-contain" />
          <h1 className="mt-4 text-xl font-bold text-white">Cambios de Turnos</h1>
          <p className="mt-1 text-sm text-clinica-soft">Clínica de Alta Complejidad Santa Bárbara</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-8 py-8">
          <h2 className="mb-6 text-center text-2xl font-bold text-clinica">Iniciar Sesión</h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="label">Correo electrónico</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@cacsantabarbara.co"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="label">Contraseña</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={show ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-clinica"
                tabIndex={-1}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar'}
          </button>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm font-medium text-clinica-mid hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-semibold text-clinica-mid hover:underline">
              Regístrate
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Clínica Santa Bárbara — Sistema Interno
          </p>
        </form>
      </div>
    </div>
  )
}

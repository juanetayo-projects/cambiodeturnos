import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MailCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    if (error) setError(error)
    else setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0D2D6B 0%, #16468E 100%)' }}>
      <div className="w-full max-w-md animate-fade-in overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-clinica px-8 py-7 text-center">
          <img src="/cambiodeturnos/logo-blanco.png" alt="Clínica Santa Bárbara" className="mx-auto h-12 object-contain" />
          <h1 className="mt-3 text-lg font-bold text-white">Recuperar Contraseña</h1>
        </div>
        {sent ? (
          <div className="px-8 py-10 text-center">
            <MailCheck className="mx-auto h-14 w-14 text-green-500" />
            <p className="mt-4 text-sm text-slate-600">
              Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
            </p>
            <Link to="/login" className="btn-primary mt-6 w-full">Volver a Iniciar Sesión</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-8">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
            <p className="mb-4 text-sm text-slate-600">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
            <label className="label">Correo electrónico</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar enlace'}
            </button>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm font-medium text-clinica-mid hover:underline">Volver</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

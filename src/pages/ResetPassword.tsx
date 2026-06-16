import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.')
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0D2D6B 0%, #16468E 100%)' }}>
      <div className="w-full max-w-md animate-fade-in overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-clinica px-8 py-7 text-center">
          <img src="/cambiodeturnos/logo-blanco.png" alt="Clínica Santa Bárbara" className="mx-auto h-12 object-contain" />
          <h1 className="mt-3 text-lg font-bold text-white">Nueva Contraseña</h1>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-8">
          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</div>}
          <label className="label">Nueva contraseña</label>
          <input type="password" required className="input mb-4" value={password} onChange={(e) => setPassword(e.target.value)} />
          <label className="label">Confirmar contraseña</label>
          <input type="password" required className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

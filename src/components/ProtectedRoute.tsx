import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Rol } from '../types'
import Layout from './Layout'

export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Rol[] }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinica-tint">
        <Loader2 className="h-8 w-8 animate-spin text-clinica" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clinica-tint">
        <Loader2 className="h-8 w-8 animate-spin text-clinica" />
      </div>
    )
  }
  if (roles && !roles.includes(profile.rol)) {
    // Redirige según rol al destino por defecto
    return <Navigate to={profile.rol === 'asistencial' ? '/solicitar' : '/'} replace />
  }

  return <Layout>{children}</Layout>
}

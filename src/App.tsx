import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import SolicitudForm from './pages/SolicitudForm'
import Solicitudes from './pages/Solicitudes'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'
import Catalogos from './pages/Catalogos'

function Home() {
  const { session, profile, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (profile?.rol === 'asistencial') return <Navigate to="/solicitar" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<ProtectedRoute roles={['coordinador', 'administrador']}><Dashboard /></ProtectedRoute>} />
      <Route path="/solicitar" element={<ProtectedRoute roles={['asistencial', 'administrador']}><SolicitudForm /></ProtectedRoute>} />
      <Route path="/solicitudes" element={<ProtectedRoute><Solicitudes /></ProtectedRoute>} />
      <Route path="/reportes" element={<ProtectedRoute roles={['coordinador', 'administrador']}><Reportes /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute roles={['administrador']}><Usuarios /></ProtectedRoute>} />
      <Route path="/catalogos" element={<ProtectedRoute roles={['administrador']}><Catalogos /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

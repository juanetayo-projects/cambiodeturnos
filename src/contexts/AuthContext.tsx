import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { APP_URL } from '../lib/config'
import { Profile } from '../types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: SignUpData) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  refreshProfile: () => Promise<void>
}

export interface SignUpData {
  email: string
  password: string
  nombre: string
  documento?: string
  cargo?: string
}

const AuthContext = createContext<AuthState>({} as AuthState)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile((data as Profile) ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess)
      if (sess) await loadProfile(sess.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn: AuthState['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return { error: error ? traducir(error.message) : null }
  }

  const signUp: AuthState['signUp'] = async ({ email, password, nombre, documento, cargo }) => {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nombre, documento, cargo }, emailRedirectTo: APP_URL },
    })
    return { error: error ? traducir(error.message) : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const resetPassword: AuthState['resetPassword'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: APP_URL.replace(/\/$/, '/') + '#/reset-password',
    })
    return { error: error ? traducir(error.message) : null }
  }

  const updatePassword: AuthState['updatePassword'] = async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error: error ? traducir(error.message) : null }
  }

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user.id)
  }

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, signIn, signUp, signOut, resetPassword, updatePassword, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function traducir(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Tu correo aún no ha sido confirmado.'
  if (m.includes('already registered')) return 'Este correo ya está registrado.'
  if (m.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres.'
  if (m.includes('rate limit')) return 'Demasiados intentos. Espera un momento.'
  return msg
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)

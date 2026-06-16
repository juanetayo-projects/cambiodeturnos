import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { Area, Cargo, Turno, Coordinador } from '../types'

export function useCatalogos() {
  const [areas, setAreas] = useState<Area[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [coordinadores, setCoordinadores] = useState<Coordinador[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('areas').select('*').eq('activo', true).order('nombre'),
      supabase.from('cargos').select('*').eq('activo', true).order('nombre'),
      supabase.from('turnos').select('*').eq('activo', true).order('orden'),
      supabase.from('coordinadores').select('*').eq('activo', true).order('cargo'),
    ]).then(([a, c, t, co]) => {
      if (!active) return
      setAreas((a.data as Area[]) ?? [])
      setCargos((c.data as Cargo[]) ?? [])
      setTurnos((t.data as Turno[]) ?? [])
      setCoordinadores((co.data as Coordinador[]) ?? [])
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return { areas, cargos, turnos, coordinadores, loading }
}

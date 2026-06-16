// Importa el histórico de la hoja DATA (docs/data/DATA_export.csv) a Supabase.
// Se autentica como administrador para cumplir las políticas RLS.
//   node scripts/importar_historico.mjs
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const URL = 'https://rykondrasrvnuurolqqk.supabase.co'
const KEY = 'sb_publishable_oB0FQDX-skyHx7DOG2odww_nWMKA1kE'
const ADMIN = { email: 'juan.etayo@cacsantabarbara.co', password: 'admin123*' }

function parseCSV(t) {
  const rows = []; let f = '', row = [], q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++ } else q = false } else f += c }
    else { if (c === '"') q = true; else if (c === ',') { row.push(f); f = '' } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = '' } else if (c === '\r') {} else f += c }
  }
  if (f.length || row.length) { row.push(f); rows.push(row) }
  return rows
}
const pad = (n) => String(n).padStart(2, '0')
function parseTs(s) {
  s = (s || '').trim(); if (!s) return null
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(a\.?\s*m\.?|p\.?\s*m\.?)?/i)
  if (m) { let [, d, mo, y, h, mi, se, ap] = m; h = +h; if (ap) { ap = ap.toLowerCase(); if (ap.startsWith('p') && h < 12) h += 12; if (ap.startsWith('a') && h === 12) h = 0 } return `${y}-${pad(+mo)}-${pad(+d)}T${pad(h)}:${mi}:${se}` }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}T00:00:00`
  return null
}
function parseDate(s) {
  s = (s || '').trim(); if (!s) return null
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (m) return `${m[3]}-${pad(+m[2])}-${pad(+m[1])}`
  return null
}

const main = async () => {
  const sb = createClient(URL, KEY)
  const { error: e } = await sb.auth.signInWithPassword(ADMIN)
  if (e) { console.error('Login admin falló:', e.message); process.exit(1) }
  console.log('Autenticado como admin.')

  // Mapa de áreas
  const { data: areas } = await sb.from('areas').select('id,nombre')
  const areaMap = new Map(areas.map((a) => [a.nombre.trim().toLowerCase(), a.id]))

  const rows = parseCSV(fs.readFileSync('docs/data/DATA_export.csv', 'utf8'))
  const data = rows.slice(1).filter((r) => r.slice(0, 20).some((c) => c && c.trim()) && (r[5] || '').trim())

  const registros = data.map((r) => {
    const estado = (r[15] || '').trim().toUpperCase()
    const proceso = (r[3] || '').trim() || null
    return {
      fecha_solicitud: parseTs(r[1]) ?? new Date().toISOString(),
      cargo_solicitante: (r[2] || '').trim() || null,
      proceso,
      area_id: proceso ? areaMap.get(proceso.toLowerCase()) ?? null : null,
      jefe_proceso: (r[4] || '').trim() || null,
      nombre_solicitante: (r[5] || '').trim() || 'N/D',
      doc_solicitante: (r[6] || '').trim() || null,
      correo_solicitante: (r[7] || '').trim() || 'no-registrado@cacsantabarbara.co',
      turno_solicitante: (r[8] || '').trim() || null,
      fecha_turno_solicitante: parseDate(r[9]),
      nombre_acepta: (r[10] || '').trim() || null,
      doc_acepta: (r[11] || '').trim() || null,
      turno_acepta: (r[12] || '').trim() || null,
      fecha_turno_acepta: parseDate(r[13]),
      correo_acepta: (r[17] || '').trim() || null,
      acepta_terminos: (r[14] || '').trim().toUpperCase() === 'SI',
      estado: ['APROBADA', 'NEGADA'].includes(estado) ? estado : 'PENDIENTE',
      obser_solicitud: (r[18] || '').trim() || null,
      obser_respuesta: (r[19] || '').trim() || null,
    }
  })

  console.log('Registros a importar:', registros.length)
  const BATCH = 500
  let ok = 0
  for (let i = 0; i < registros.length; i += BATCH) {
    const lote = registros.slice(i, i + BATCH)
    const { error } = await sb.from('solicitudes').insert(lote)
    if (error) { console.error(`Lote ${i}-${i + lote.length} ERROR:`, error.message); process.exit(1) }
    ok += lote.length
    console.log(`Insertados ${ok}/${registros.length}`)
  }
  console.log('✔ Importación completa.')
  process.exit(0)
}
main()

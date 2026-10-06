// Edge Function: crear-usuario
// Permite a un ADMINISTRADOR crear usuarios desde la app.
// Verifica que quien invoca sea administrador (vía su JWT) y usa el
// service_role para crear el usuario en auth (ya confirmado) y completar
// su perfil (rol, documento, cargo, estudiante y áreas si es coordinador).
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const ROLES = ["asistencial", "coordinador", "administrador"]

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  try {
    const url = Deno.env.get("SUPABASE_URL")!
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const admin = createClient(url, serviceKey)

    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "")
    const { data: { user }, error: uerr } = await admin.auth.getUser(jwt)
    if (uerr || !user) return json({ error: "No autenticado" }, 401)

    const { data: prof } = await admin.from("profiles").select("rol").eq("id", user.id).single()
    if (prof?.rol !== "administrador") return json({ error: "Solo administradores" }, 403)

    const body = await req.json()
    const nombre = String(body.nombre ?? "").trim()
    const correo = String(body.correo ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const documento = body.documento ? String(body.documento).trim() : null
    const cargo = body.cargo ? String(body.cargo).trim() : null
    const rol = ROLES.includes(body.rol) ? body.rol : "asistencial"
    const es_estudiante = !!body.es_estudiante
    const areas: number[] = Array.isArray(body.areas) ? body.areas.map(Number).filter(Boolean) : []

    if (!nombre) return json({ error: "El nombre es obligatorio." }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return json({ error: "Correo no válido." }, 400)
    if (password.length < 6) return json({ error: "La contraseña debe tener al menos 6 caracteres." }, 400)

    const { data: created, error: cerr } = await admin.auth.admin.createUser({
      email: correo,
      password,
      email_confirm: true,
      user_metadata: { nombre, documento, cargo, es_estudiante },
    })
    if (cerr || !created?.user) {
      const msg = cerr?.message ?? "No se pudo crear el usuario"
      if (/already|registered|exists/i.test(msg)) return json({ error: "Ya existe un usuario con ese correo." }, 409)
      return json({ error: msg }, 500)
    }
    const id = created.user.id

    // El trigger handle_new_user crea el perfil base; aquí lo completamos.
    const { error: perr } = await admin.from("profiles").upsert({
      id, nombre, correo, rol, documento, cargo, es_estudiante, activo: true,
    }, { onConflict: "id" })
    if (perr) return json({ error: "Usuario creado, pero falló el perfil: " + perr.message }, 500)

    if (rol === "coordinador" && areas.length) {
      await admin.from("profile_areas").insert(areas.map((area_id) => ({ profile_id: id, area_id })))
    }

    return json({ ok: true, id }, 200)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}

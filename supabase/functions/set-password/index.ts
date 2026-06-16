// Edge Function: set-password
// Permite a un ADMINISTRADOR cambiar la contraseña de cualquier usuario.
// Verifica que quien invoca sea administrador (vía su JWT) y usa el
// service_role para actualizar la contraseña del usuario objetivo.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

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

    const { user_id, password } = await req.json()
    if (!user_id || !password || String(password).length < 6)
      return json({ error: "La contraseña debe tener al menos 6 caracteres." }, 400)

    const { error } = await admin.auth.admin.updateUserById(user_id, { password })
    if (error) return json({ error: error.message }, 500)

    return json({ ok: true }, 200)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } })
}

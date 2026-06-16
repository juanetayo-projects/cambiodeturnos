// Edge Function: notificar
// Envía correos (Resend) en dos momentos:
//   tipo 'nueva'    -> confirmación al solicitante + aviso al coordinador (con botón a la app)
//   tipo 'resuelta' -> resultado (APROBADA/NEGADA) al solicitante con el comentario
//
// Credenciales: se leen desde Supabase Vault vía la función public.get_secret()
//   RESEND_API_KEY -> API key de Resend ("notificacionturnos")
//   RESEND_FROM    -> remitente, p.ej. "Cambios de Turnos <notificaciones@cacsantabarbara.co>"
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const APP_URL = Deno.env.get("APP_URL") ?? "https://juanetayo-projects.github.io/cambiodeturnos/"
const LOGO = APP_URL.replace(/\/$/, "") + "/logo-blanco.png"
const AZUL = "#0D2D6B"
const AZUL2 = "#16468E"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function plantilla(titulo: string, cuerpo: string, boton?: { texto: string; url: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f7fc;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fc;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(13,45,107,.1)">
        <tr><td style="background:${AZUL};padding:24px;text-align:center">
          <img src="${LOGO}" alt="Clínica Santa Bárbara" height="50" style="display:inline-block"/>
          <div style="color:#fff;font-size:18px;font-weight:bold;margin-top:12px">${titulo}</div>
          <div style="color:#cdd9f0;font-size:13px">Clínica de Alta Complejidad Santa Bárbara</div>
        </td></tr>
        <tr><td style="padding:28px 32px;font-size:15px;line-height:1.6">${cuerpo}
          ${boton ? `<div style="text-align:center;margin:28px 0 8px">
            <a href="${boton.url}" style="background:${AZUL2};color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;display:inline-block">${boton.texto}</a>
          </div>` : ""}
        </td></tr>
        <tr><td style="background:#f4f7fc;padding:16px;text-align:center;font-size:11px;color:#94a3b8">
          Este es un correo automático del sistema de Cambios de Turnos.<br/>© ${new Date().getFullYear()} Clínica de Alta Complejidad Santa Bárbara.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}

const idChip = (id: string) =>
  `<div style="text-align:center;margin:0 0 22px">
     <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px">N° de Solicitud</div>
     <div style="display:inline-block;background:#E8EEF8;color:${AZUL};font-size:26px;font-weight:800;letter-spacing:1px;padding:10px 28px;border-radius:12px;border:1px solid #c9d8ef;margin-top:6px">${id}</div>
   </div>`

const estadoChip = (estado: string, bg: string) =>
  `<div style="text-align:center;margin:0 0 18px">
     <span style="display:inline-block;background:${bg};color:#fff;font-size:22px;font-weight:800;padding:10px 34px;border-radius:30px;letter-spacing:2px">${estado}</span>
   </div>`

function filaDato(label: string, valor: string | null) {
  return `<tr><td style="padding:4px 0;color:#64748b;width:160px">${label}</td><td style="padding:4px 0;font-weight:bold">${valor ?? "—"}</td></tr>`
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors })
  try {
    const { tipo, solicitud_id } = await req.json()
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

    const { data: apiKey } = await sb.rpc("get_secret", { p_name: "RESEND_API_KEY" })
    const { data: fromVault } = await sb.rpc("get_secret", { p_name: "RESEND_FROM" })
    const RESEND_API_KEY = (apiKey as string) || Deno.env.get("RESEND_API_KEY") || ""
    const RESEND_FROM = (fromVault as string) || Deno.env.get("RESEND_FROM") || "Cambios de Turnos <onboarding@resend.dev>"

    async function enviar(to: string, subject: string, html: string) {
      if (!RESEND_API_KEY) { console.warn("RESEND_API_KEY no disponible; correo omitido."); return }
      if (!to) return
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
      })
      if (!res.ok) console.error("Resend error:", await res.text())
    }

    const { data: s, error } = await sb.from("solicitudes").select("*").eq("id", solicitud_id).single()
    if (error || !s) return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), { status: 404, headers: cors })

    // Nombre del coordinador del proceso (desde la tabla coordinadores)
    let coordNombre = ""
    if (s.correo_coordinador) {
      const { data: coord } = await sb.from("coordinadores").select("nombre").eq("correo", s.correo_coordinador).limit(1).maybeSingle()
      coordNombre = (coord?.nombre as string) || ""
    }

    const id = s.codigo ?? `#${s.id}`
    const resumen = `<table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;margin-top:10px">
      ${filaDato("Identificador", id)}
      ${filaDato("Solicitante", s.nombre_solicitante)}
      ${filaDato("Proceso / Área", s.proceso)}
      ${filaDato("Turno actual", `${s.turno_solicitante ?? ""} (${s.fecha_turno_solicitante ?? ""})`)}
      ${filaDato("Compañero", s.nombre_acepta)}
      ${filaDato("Turno a recibir", `${s.turno_acepta ?? ""} (${s.fecha_turno_acepta ?? ""})`)}
    </table>`

    if (tipo === "nueva") {
      await enviar(s.correo_solicitante,
        `Solicitud de cambio de turno registrada ${id}`,
        plantilla("Solicitud Registrada",
          `${idChip(id)}Hola <b>${s.nombre_solicitante}</b>,<br/><br/>Tu solicitud de cambio de turno fue registrada correctamente. Será revisada por tu coordinador${coordNombre ? ` <b>${coordNombre}</b>` : ""}.${resumen}`))
      if (s.correo_coordinador) {
        await enviar(s.correo_coordinador,
          `Nueva solicitud de cambio de turno ${id} — ${s.proceso ?? ""}`,
          plantilla("Nueva Solicitud por Aprobar",
            `${idChip(id)}Hola,<br/>El colaborador <b>${s.nombre_solicitante}</b> de tu área (<b>${s.proceso ?? ""}</b>) ha registrado una solicitud de cambio de turno. Ingresa a la aplicación para aprobarla o negarla.${resumen}`,
            { texto: "Ir a la aplicación", url: APP_URL }))
      }
    } else if (tipo === "resuelta") {
      const aprob = s.estado === "APROBADA"
      const color = aprob ? "#10B981" : "#EF4444"
      await enviar(s.correo_solicitante,
        `Tu solicitud ${id} fue ${s.estado}`,
        plantilla(`Solicitud ${s.estado}`,
          `${estadoChip(s.estado, color)}${idChip(id)}Hola <b>${s.nombre_solicitante}</b>,<br/><br/>Tu solicitud de cambio de turno ha sido <b style="color:${color}">${s.estado}</b> por el coordinador${coordNombre ? ` <b>${coordNombre}</b>` : ""}.
           ${s.obser_respuesta ? `<div style="margin-top:14px;padding:12px;background:#f4f7fc;border-left:4px solid ${color};border-radius:6px"><b>Comentario:</b><br/>${s.obser_respuesta}</div>` : ""}
           ${resumen}`))
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors })
  }
})

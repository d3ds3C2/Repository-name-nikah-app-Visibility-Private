// POST { consent: true } → { url, session_id }
// Creates a Didit hosted verification session for the calling user.
// Secrets: DIDIT_API_KEY, DIDIT_WORKFLOW_ID, SITE_URL
// Deploy: supabase functions deploy verify-start
import { admin, callerUser, cors, json } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await callerUser(req);
  if (!user) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => ({}));
  if (body.consent !== true) return json({ error: "consent_required" }, 400);

  const db = admin();
  // reuse an open session if one exists (avoid burning free quota)
  const { data: open } = await db.from("verification_sessions")
    .select("session_id,url,status").eq("user_id", user.id)
    .in("status", ["Not Started", "In Progress", "Resubmitted"])
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (open?.url) return json({ url: open.url, session_id: open.session_id, reused: true });

  const site = Deno.env.get("SITE_URL") ?? "https://nikah.app";
  const r = await fetch("https://verification.didit.me/v3/session/", {
    method: "POST",
    headers: { "x-api-key": Deno.env.get("DIDIT_API_KEY")!, "Content-Type": "application/json" },
    body: JSON.stringify({
      workflow_id: Deno.env.get("DIDIT_WORKFLOW_ID"),
      vendor_data: user.id,
      callback: `${site}/profile?verification=returned`,
      metadata: { app: "nikah" },
    }),
  });
  if (!r.ok) return json({ error: `didit ${r.status}: ${await r.text()}` }, 502);
  const s = await r.json();
  const url = s.url ?? s.verification_url;
  await db.from("verification_sessions").insert({
    session_id: s.session_id, user_id: user.id, provider: "didit", status: s.status ?? "Not Started", url, consent_at: new Date().toISOString(),
  });
  return json({ url, session_id: s.session_id });
});

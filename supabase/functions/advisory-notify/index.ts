// Database Webhook target: advisory_requests INSERT / UPDATE(status) → email the advisor.
// Configure in Supabase Dashboard → Database → Webhooks → table advisory_requests, events INSERT, UPDATE
//   → HTTP request → this function URL, header  Authorization: Bearer <WEBHOOK_SECRET>
// Secrets: WEBHOOK_SECRET, RESEND_API_KEY, ADVISOR_EMAIL (e.g. info@ivogsan.com), FROM_EMAIL
// Deploy: supabase functions deploy advisory-notify --no-verify-jwt
import { admin, json } from "../_shared.ts";

Deno.serve(async (req) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${Deno.env.get("WEBHOOK_SECRET")}`) return json({ error: "unauthorized" }, 401);
  const payload = await req.json().catch(() => null);
  const row = payload?.record;
  if (!row) return json({ error: "no record" }, 400);
  // only notify on new requests and on payment
  const interesting = payload.type === "INSERT" || (payload.type === "UPDATE" && payload.old_record?.status !== row.status && row.status === "paid");
  if (!interesting) return json({ skipped: true });

  const db = admin();
  const { data: prof } = await db.from("profiles").select("first_name,last_name,country,city,lang").eq("id", row.user_id).single();
  const { data: docs } = await db.from("advisory_documents").select("doc_type,original_name").eq("request_id", row.id);

  const subject = payload.type === "INSERT"
    ? `[Nikah.App] Yeni danışmanlık talebi — ${row.package_code.toUpperCase()}`
    : `[Nikah.App] ÖDEME ALINDI — ${row.package_code.toUpperCase()} — ${(row.price_cents / 100).toFixed(2)} ${row.currency}`;
  const lines = [
    `Talep ID: ${row.id}`,
    `Durum: ${row.status}`,
    `Paket: ${row.package_code}  (${(row.price_cents / 100).toFixed(2)} ${row.currency})`,
    `Kullanıcı: ${prof?.first_name ?? ""} ${prof?.last_name ?? ""}  (${prof?.city ?? ""}, ${prof?.country ?? ""}, dil: ${prof?.lang ?? ""})`,
    `E-posta: ${row.contact_email ?? "-"}`,
    `Telefon: ${row.contact_phone ?? "-"}`,
    `WhatsApp: ${row.contact_whatsapp ?? "-"}`,
    `Ülke: ${row.country_from ?? "-"} → ${row.country_to ?? "-"}`,
    `Not: ${row.notes ?? "-"}`,
    `Evraklar: ${(docs ?? []).map((d) => `${d.doc_type}:${d.original_name ?? ""}`).join(", ") || "-"}`,
  ];

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("FROM_EMAIL") ?? "Nikah.App <noreply@nikah.app>",
      to: [Deno.env.get("ADVISOR_EMAIL")!],
      subject,
      text: lines.join("\n"),
    }),
  });
  return json({ ok: res.ok, status: res.status });
});

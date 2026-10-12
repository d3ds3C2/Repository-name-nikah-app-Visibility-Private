// Didit webhook receiver (status.updated / data.updated). Verifies X-Signature-V2,
// then writes verification flags with the service role. The client can never do this.
// Secrets: DIDIT_WEBHOOK_SECRET
// Deploy: supabase functions deploy didit-webhook --no-verify-jwt
import { admin, json } from "../_shared.ts";

function shortenFloats(d: unknown): unknown {
  if (Array.isArray(d)) return d.map(shortenFloats);
  if (d && typeof d === "object") return Object.fromEntries(Object.entries(d as Record<string, unknown>).map(([k, v]) => [k, shortenFloats(v)]));
  if (typeof d === "number" && !Number.isInteger(d) && d % 1 === 0) return Math.trunc(d);
  return d;
}
function sortKeys(o: unknown): unknown {
  if (Array.isArray(o)) return o.map(sortKeys);
  if (o && typeof o === "object") return Object.keys(o as Record<string, unknown>).sort().reduce((acc: Record<string, unknown>, k) => { acc[k] = sortKeys((o as Record<string, unknown>)[k]); return acc; }, {});
  return o;
}
async function hmacHex(secret: string, msg: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEq(a: string, b: string) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

Deno.serve(async (req) => {
  const secret = Deno.env.get("DIDIT_WEBHOOK_SECRET")!;
  const raw = await req.text();
  const ts = req.headers.get("x-timestamp") ?? "";
  if (!ts || Math.abs(Math.floor(Date.now() / 1000) - parseInt(ts, 10)) > 300) return json({ error: "stale" }, 401);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }

  const sigV2 = req.headers.get("x-signature-v2") ?? "";
  const sigRaw = req.headers.get("x-signature") ?? "";
  const canonical = JSON.stringify(sortKeys(shortenFloats(body)));
  const okV2 = sigV2 && safeEq(await hmacHex(secret, canonical), sigV2);
  const okRaw = !okV2 && sigRaw && safeEq(await hmacHex(secret, raw), sigRaw);
  if (!okV2 && !okRaw) return json({ error: "invalid signature" }, 401);
  if (req.headers.get("x-didit-test-webhook") === "true") return json({ ok: true, test: true });

  const db = admin();
  // idempotency
  const { error: dup } = await db.from("verification_events").insert({ event_id: body.event_id, session_id: body.session_id, webhook_type: body.webhook_type, status: body.status });
  if (dup) return json({ ok: true, duplicate: true });

  const type = body.webhook_type as string;
  if (type !== "status.updated" && type !== "data.updated") return json({ ok: true, ignored: type });
  const sessionId = body.session_id as string;
  const status = body.status as string;
  const userId = (body.vendor_data as string) || null;
  const decision = (body.decision ?? {}) as Record<string, unknown>;

  // sanitised summary — never store document numbers or images
  const idv = (decision.id_verifications as Record<string, unknown>[] | undefined)?.[0];
  const live = (decision.liveness_checks as Record<string, unknown>[] | undefined)?.[0];
  const face = (decision.face_matches as Record<string, unknown>[] | undefined)?.[0];
  const summary = {
    status, id_status: idv?.status ?? null, liveness_status: live?.status ?? null, face_status: face?.status ?? null,
    document_type: idv?.document_type ?? null, issuing_state: idv?.issuing_state ?? null,
    warnings: [idv, live, face].flatMap((x) => ((x?.warnings as Record<string, unknown>[]) ?? []).map((w) => w.risk)),
  };
  await db.from("verification_sessions").upsert({ session_id: sessionId, user_id: userId, status, decision_summary: summary }, { onConflict: "session_id" });
  if (!userId) return json({ ok: true, no_user: true });

  if (status === "Approved") {
    const idOk = !idv || idv.status === "Approved";
    const liveOk = !live || live.status === "Approved";
    const faceOk = !face || face.status === "Approved";
    // cross-check date of birth against the profile (fail → review, not auto-approve)
    let dobMatches: boolean | null = null;
    if (idv?.date_of_birth) {
      const { data: prof } = await db.from("profiles").select("birth_date").eq("id", userId).maybeSingle();
      if (prof?.birth_date) dobMatches = String(prof.birth_date) === String(idv.date_of_birth);
    }
    const approve = idOk && liveOk && faceOk && dobMatches !== false;
    await db.from("verifications").upsert({
      user_id: userId,
      selfie_verified: approve && liveOk && faceOk,
      identity_verified: approve && idOk,
      dob_matches: dobMatches, document_country: (idv?.issuing_state as string) ?? null,
      provider: "didit", provider_ref: sessionId, last_status: approve ? "Approved" : "DOB mismatch — manual review",
      verified_at: approve ? new Date().toISOString() : null,
    }, { onConflict: "user_id" });
  } else if (["Declined", "Expired", "Kyc Expired", "Abandoned", "In Review", "In Progress", "Resubmitted"].includes(status)) {
    await db.from("verifications").upsert({ user_id: userId, provider: "didit", provider_ref: sessionId, last_status: status }, { onConflict: "user_id" });
    if (status === "Declined") await db.from("verifications").update({ selfie_verified: false, identity_verified: false }).eq("user_id", userId);
  }
  return json({ ok: true });
});

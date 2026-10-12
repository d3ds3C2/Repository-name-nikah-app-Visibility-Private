// POST { text, target } → { text }  — DeepL translation for profile bios / messages.
// Secrets: DEEPL_API_KEY (free tier works; set DEEPL_HOST=api.deepl.com for pro).
// Supported targets here: tr, id, en, zh, th.
import { callerUser, cors, json } from "../_shared.ts";

const MAP: Record<string, string> = { tr: "TR", id: "ID", en: "EN-US", zh: "ZH", th: "TH" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await callerUser(req);
  if (!user) return json({ error: "unauthorized" }, 401);
  const { text, target } = await req.json().catch(() => ({}));
  if (!text || !MAP[target]) return json({ error: "text/target required" }, 400);
  if (String(text).length > 2000) return json({ error: "too long" }, 413);
  const host = Deno.env.get("DEEPL_HOST") ?? "api-free.deepl.com";
  const r = await fetch(`https://${host}/v2/translate`, {
    method: "POST",
    headers: { Authorization: `DeepL-Auth-Key ${Deno.env.get("DEEPL_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: [text], target_lang: MAP[target] }),
  });
  if (!r.ok) return json({ error: "translation failed" }, 502);
  const data = await r.json();
  return json({ text: data.translations?.[0]?.text ?? "" });
});

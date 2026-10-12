// POST { request_id } → { url }  — creates a Stripe Checkout session for an advisory request.
// Secrets: STRIPE_SECRET_KEY, SITE_URL (e.g. https://nikah.app), SUPABASE_* (auto).
// Deploy: supabase functions deploy create-checkout
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { admin, callerUser, cors, json } from "../_shared.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const user = await callerUser(req);
  if (!user) return json({ error: "unauthorized" }, 401);
  const { request_id } = await req.json().catch(() => ({}));
  if (!request_id) return json({ error: "request_id required" }, 400);

  const db = admin();
  const { data: reqRow, error } = await db.from("advisory_requests")
    .select("id,user_id,package_code,price_cents,currency,status,contact_email")
    .eq("id", request_id).single();
  if (error || !reqRow) return json({ error: "request not found" }, 404);
  if (reqRow.user_id !== user.id) return json({ error: "forbidden" }, 403);
  if (reqRow.status !== "awaiting_payment") return json({ error: `status is ${reqRow.status}` }, 409);

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
  const site = Deno.env.get("SITE_URL") ?? "https://nikah.app";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: reqRow.contact_email ?? user.email ?? undefined,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: reqRow.currency.toLowerCase(),
        unit_amount: reqRow.price_cents,
        product_data: { name: `Nikah.App Advisory — ${reqRow.package_code.toUpperCase()}` },
      },
    }],
    metadata: { request_id: reqRow.id, user_id: user.id },
    success_url: `${site}/marriage?paid=${reqRow.id}`,
    cancel_url: `${site}/marriage?cancelled=${reqRow.id}`,
  });

  await db.from("payments").insert({
    request_id: reqRow.id, user_id: user.id, provider: "stripe", provider_ref: session.id,
    amount_cents: reqRow.price_cents, currency: reqRow.currency, status: "pending",
  });
  return json({ url: session.url });
});

// Stripe webhook: checkout.session.completed → payment paid, request status 'paid'.
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
// Deploy with --no-verify-jwt:  supabase functions deploy stripe-webhook --no-verify-jwt
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { admin, json } from "../_shared.ts";

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET")!);
  } catch (e) {
    return json({ error: `signature: ${(e as Error).message}` }, 400);
  }
  const db = admin();
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object as Stripe.Checkout.Session;
    const requestId = s.metadata?.request_id;
    if (s.payment_status === "paid" && requestId) {
      await db.from("payments").update({ status: "paid", raw: s as unknown as Record<string, unknown> })
        .eq("provider", "stripe").eq("provider_ref", s.id);
      await db.from("advisory_requests").update({ status: "paid" }).eq("id", requestId).eq("status", "awaiting_payment");
    }
  }
  if (event.type === "checkout.session.async_payment_failed") {
    const s = event.data.object as Stripe.Checkout.Session;
    await db.from("payments").update({ status: "failed" }).eq("provider", "stripe").eq("provider_ref", s.id);
  }
  return json({ received: true });
});

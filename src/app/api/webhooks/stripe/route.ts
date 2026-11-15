import { NextResponse } from "next/server";
import Stripe from "stripe";
import { creditUser } from "@/lib/ledger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-10-28.endive" as Stripe.LatestApiVersion,
});

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Raw body required — Stripe verifies the HMAC over exact bytes sent.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const credits = session.metadata?.credits;

    if (!userId || !credits) {
      console.error("Stripe webhook: missing userId or credits in metadata", { userId, credits });
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const amount = parseInt(credits, 10);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid credits value in metadata" }, { status: 400 });
    }

    await creditUser(userId, amount, "stripe_topup");
  }

  // All other event types are acknowledged and ignored.
  return NextResponse.json({ received: true });
}

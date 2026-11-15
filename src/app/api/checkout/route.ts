import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { CREDIT_PACKS } from "@/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-10-28.endive" as Stripe.LatestApiVersion,
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { packId } = body as { packId?: unknown };
  if (!packId || typeof packId !== "string") {
    return NextResponse.json({ error: "packId is required" }, { status: 400 });
  }

  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return NextResponse.json({ error: `Unknown pack: ${packId}` }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Price comes from server config — never from the request.
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: { name: `${pack.credits} BuruStudio Credits – ${pack.label}` },
          unit_amount: Math.round(pack.priceGBP * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      credits: pack.credits.toString(),
    },
    success_url: `${appUrl}/studio?topup=success`,
    cancel_url: `${appUrl}/studio?topup=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}

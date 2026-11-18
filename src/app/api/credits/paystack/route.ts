import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// NGN credit packages: [credits, ngnKobo (100 kobo = 1 NGN)]
const PACKAGES = [
  { credits: 100,  ngnKobo: 150_000,  label: "Starter"    },
  { credits: 300,  ngnKobo: 400_000,  label: "Creator"    },
  { credits: 1000, ngnKobo: 1_200_000, label: "Studio"    },
  { credits: 3000, ngnKobo: 3_200_000, label: "Pro Studio" },
];

export async function GET() {
  return NextResponse.json(PACKAGES);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { credits } = await req.json();
  const pkg = PACKAGES.find((p) => p.credits === credits);
  if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 });

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.user.email,
      amount: pkg.ngnKobo,
      currency: "NGN",
      callback_url: `${baseUrl}/credits?paystack=success`,
      metadata: {
        app: "buru",
        userId: session.user.id,
        credits: pkg.credits,
        label: pkg.label,
        cancel_action: `${baseUrl}/credits`,
      },
    }),
  });

  const data = await res.json();
  if (!data.status) {
    return NextResponse.json({ error: data.message ?? "Paystack error" }, { status: 502 });
  }

  return NextResponse.json({ url: data.data.authorization_url, reference: data.data.reference });
}

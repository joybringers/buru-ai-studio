import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const signature = req.headers.get("x-paystack-signature") ?? "";
  const body = await req.text();

  // Verify signature
  const hash = createHmac("sha512", secret).update(body).digest("hex");
  if (hash !== signature) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);
  if (event.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const { reference, metadata, amount } = event.data as {
    reference: string;
    amount: number;
    metadata: { userId?: string; credits?: number; label?: string };
  };

  const userId = metadata?.userId;
  const credits = Number(metadata?.credits ?? 0);

  if (!userId || credits <= 0) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  // Idempotency — check if this reference was already processed
  const existing = await prisma.creditLedgerEntry.findFirst({
    where: { userId, jobId: reference },
  });
  if (existing) return NextResponse.json({ received: true });

  // Top up balance
  await prisma.$transaction([
    prisma.creditLedgerEntry.create({
      data: {
        userId,
        delta: credits,
        reason: "paystack_topup",
        jobId: reference, // reuse jobId as idempotency key
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: credits } },
    }),
  ]);

  console.log(`Paystack topup: user=${userId} credits=${credits} ref=${reference} NGN=${amount / 100}`);
  return NextResponse.json({ received: true });
}

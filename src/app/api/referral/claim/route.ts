import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creditUser } from "@/lib/ledger";
import { sendReferralBonus } from "@/lib/email";

export const dynamic = "force-dynamic";

const REFERRAL_CREDITS = 20;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { referrerId } = await req.json() as { referrerId?: string };
  if (!referrerId || typeof referrerId !== "string") {
    return NextResponse.json({ error: "Missing referrerId" }, { status: 400 });
  }
  if (referrerId === userId) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // Idempotent — only process once per user.
  const alreadyClaimed = await prisma.creditLedgerEntry.findFirst({
    where: { userId, reason: "referral_bonus_received" },
  });
  if (alreadyClaimed) {
    return NextResponse.json({ ok: false, reason: "already_claimed" });
  }

  // Referrer must exist.
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { id: true, email: true },
  });
  if (!referrer) {
    return NextResponse.json({ error: "Referrer not found" }, { status: 404 });
  }

  const newUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  // Credit both parties.
  await creditUser(userId, REFERRAL_CREDITS, "referral_bonus_received");
  await creditUser(referrer.id, REFERRAL_CREDITS, "referral_bonus_sent");

  // Fire-and-forget emails.
  if (newUser?.email) {
    sendReferralBonus({ to: newUser.email, credits: REFERRAL_CREDITS, type: "referee" }).catch(() => {});
  }
  if (referrer.email) {
    sendReferralBonus({ to: referrer.email, credits: REFERRAL_CREDITS, type: "referrer" }).catch(() => {});
  }

  return NextResponse.json({ ok: true, credits: REFERRAL_CREDITS });
}

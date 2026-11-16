import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { creditUser } from "@/lib/ledger";

export const dynamic = "force-dynamic";

function isAdmin(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

// One-off: give 50 welcome credits to users who have never received them.
// Call once from /admin, then leave it — it's idempotent (checks the ledger first).
export async function POST() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  const credited: string[] = [];

  for (const user of users) {
    const existing = await prisma.creditLedgerEntry.findFirst({
      where: { userId: user.id, reason: "welcome_bonus" },
    });
    if (!existing) {
      await creditUser(user.id, 50, "welcome_bonus");
      credited.push(user.email ?? user.id);
    }
  }

  return NextResponse.json({ credited, skipped: users.length - credited.length });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAdmin(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalUsers = await prisma.user.count();
  const totalJobs = await prisma.job.count();
  const doneJobs = await prisma.job.count({ where: { status: "done" } });
  const failedJobs = await prisma.job.count({ where: { status: "failed" } });
  const totalAssets = await prisma.asset.count();
  const creditsTopupSum = await prisma.creditLedgerEntry.aggregate({
    where: { reason: "stripe_topup", delta: { gt: 0 } },
    _sum: { delta: true },
  });
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      email: true,
      creditBalance: true,
      createdAt: true,
    },
  });

  const creditsSold = creditsTopupSum._sum.delta ?? 0;
  const revenueGBP = +(creditsSold * 0.016).toFixed(2);

  return NextResponse.json({
    totalUsers,
    totalJobs,
    doneJobs,
    failedJobs,
    totalAssets,
    creditsSold,
    revenueGBP,
    recentUsers,
  });
}

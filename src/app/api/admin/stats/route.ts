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

  const [
    totalUsers,
    totalJobs,
    totalAssets,
    jobsByStatus,
    creditsTopupSum,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.count(),
    prisma.asset.count(),
    prisma.job.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.creditLedgerEntry.aggregate({
      where: { reason: "stripe_topup", delta: { gt: 0 } },
      _sum: { delta: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        email: true,
        creditBalance: true,
        createdAt: true,
        _count: { select: { jobs: true, assets: true } },
      },
    }),
  ]);

  const creditsSold = creditsTopupSum._sum.delta ?? 0;
  const revenueGBP = +(creditsSold * 0.016).toFixed(2); // approx £0.016/credit

  return NextResponse.json({
    totalUsers,
    totalJobs,
    totalAssets,
    jobsByStatus: Object.fromEntries(jobsByStatus.map((r) => [r.status, r._count._all])),
    creditsSold,
    revenueGBP,
    recentUsers,
  });
}

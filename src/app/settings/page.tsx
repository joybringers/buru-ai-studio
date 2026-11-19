import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export const metadata = { title: "Settings — BuruStudio" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const userId = session.user.id;

  const [user, ledger, jobs, referralEntries] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.creditLedgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        prompt: true,
        modelId: true,
        status: true,
        creditsCharged: true,
        createdAt: true,
        resultUrl: true,
      },
    }),
    prisma.creditLedgerEntry.findMany({
      where: { userId, reason: "referral_bonus_sent" },
      select: { delta: true },
    }),
  ]);

  const referralCount = referralEntries.length;
  const referralCredits = referralEntries.reduce((sum, e) => sum + e.delta, 0);

  return (
    <SettingsClient
      data={{
        userId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        balance: user.creditBalance,
        referralCount,
        referralCredits,
        recentLedger: ledger.map((e) => ({
          id: e.id,
          delta: e.delta,
          reason: e.reason,
          createdAt: e.createdAt.toISOString(),
        })),
        recentJobs: jobs.map((j) => ({
          id: j.id,
          prompt: j.prompt,
          modelId: j.modelId,
          status: j.status,
          creditsCharged: j.creditsCharged,
          createdAt: j.createdAt.toISOString(),
          resultUrl: j.resultUrl,
        })),
      }}
    />
  );
}

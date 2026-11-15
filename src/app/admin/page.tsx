import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAdmin(email: string | null | undefined): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-bold text-zinc-100 mt-2">{value}</p>
      {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (!isAdmin(session?.user?.email)) redirect("/studio");

  const [
    totalUsers,
    totalJobs,
    totalAssets,
    jobsByStatusRaw,
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
      take: 25,
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
  const revenueGBP = (creditsSold * 0.016).toFixed(2);
  const jobsByStatus = Object.fromEntries(jobsByStatusRaw.map((r) => [r.status, r._count._all]));

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Admin</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Users" value={totalUsers.toString()} />
        <StatCard label="Jobs" value={totalJobs.toString()}
          sub={`${jobsByStatus.done ?? 0} done · ${jobsByStatus.failed ?? 0} failed`} />
        <StatCard label="Assets" value={totalAssets.toString()} />
        <StatCard label="Revenue" value={`£${revenueGBP}`}
          sub={`${creditsSold} credits sold`} />
      </div>

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
          Recent users
        </h2>
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Email</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Credits</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Jobs</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Assets</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u, i) => (
                <tr key={u.id}
                  className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"}`}>
                  <td className="px-4 py-3 text-zinc-300">{u.email}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{u.creditBalance}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{u._count.jobs}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{u._count.assets}</td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-600">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

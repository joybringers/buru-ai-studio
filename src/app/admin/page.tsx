import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) redirect("/");

  const [users, projects, recentLedger] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, email: true, name: true, creditBalance: true, createdAt: true,
        _count: { select: { projects: true, jobs: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { email: true } }, quote: true },
    }),
    prisma.creditLedgerEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const totalCreditsIssued = recentLedger.filter((e) => e.delta > 0).reduce((s, e) => s + e.delta, 0);
  const totalCreditsSpent = recentLedger.filter((e) => e.delta < 0).reduce((s, e) => s + Math.abs(e.delta), 0);

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF] p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-xl font-bold text-[#F2F6FF]">Admin Console</h1>
          <p className="text-xs text-[#A8B0D8] mt-1">BuruStudio · Internal dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Users",           value: users.length },
            { label: "Projects",        value: projects.length },
            { label: "Credits issued",  value: totalCreditsIssued },
            { label: "Credits spent",   value: totalCreditsSpent },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#121530] border border-[#1E2140] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#6A4CFF]">{value.toLocaleString()}</div>
              <div className="text-xs text-[#A8B0D8] mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <section>
          <h2 className="text-sm font-semibold text-[#A8B0D8] uppercase tracking-wide mb-3">Users</h2>
          <div className="bg-[#121530] border border-[#1E2140] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1E2140] text-[#A8B0D8]">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-right px-4 py-3">Credits</th>
                  <th className="text-right px-4 py-3">Projects</th>
                  <th className="text-right px-4 py-3">Jobs</th>
                  <th className="text-left px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1E2140]/50 hover:bg-[#1E2140]/30 transition-colors">
                    <td className="px-4 py-2.5 text-[#F2F6FF]">{u.email}</td>
                    <td className="px-4 py-2.5 text-[#A8B0D8]">{u.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#6A4CFF]">{u.creditBalance}</td>
                    <td className="px-4 py-2.5 text-right text-[#A8B0D8]">{u._count.projects}</td>
                    <td className="px-4 py-2.5 text-right text-[#A8B0D8]">{u._count.jobs}</td>
                    <td className="px-4 py-2.5 text-[#4A5280]">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent projects */}
        <section>
          <h2 className="text-sm font-semibold text-[#A8B0D8] uppercase tracking-wide mb-3">Recent Projects</h2>
          <div className="bg-[#121530] border border-[#1E2140] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1E2140] text-[#A8B0D8]">
                  <th className="text-left px-4 py-3">Title</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Spent / Cap</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-[#1E2140]/50 hover:bg-[#1E2140]/30 transition-colors">
                    <td className="px-4 py-2.5 text-[#F2F6FF] max-w-[200px] truncate">{p.title}</td>
                    <td className="px-4 py-2.5 text-[#A8B0D8]">{p.user.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        p.status === "done" ? "bg-emerald-900/40 text-emerald-400" :
                        p.status === "rendering" ? "bg-[#6A4CFF]/20 text-[#A88FFF]" :
                        "bg-[#1E2140] text-[#A8B0D8]"
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#A8B0D8]">
                      {p.quote ? `${p.quote.spentCredits} / ${p.quote.hardCap}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#4A5280]">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Credit ledger */}
        <section>
          <h2 className="text-sm font-semibold text-[#A8B0D8] uppercase tracking-wide mb-3">Recent Ledger (30 entries)</h2>
          <div className="bg-[#121530] border border-[#1E2140] rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1E2140] text-[#A8B0D8]">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-right px-4 py-3">Delta</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLedger.map((e) => (
                  <tr key={e.id} className="border-b border-[#1E2140]/50 hover:bg-[#1E2140]/30 transition-colors">
                    <td className="px-4 py-2 text-[#A8B0D8]">{e.user.email}</td>
                    <td className="px-4 py-2 text-[#A8B0D8]">{e.reason}</td>
                    <td className={`px-4 py-2 text-right font-mono ${e.delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {e.delta > 0 ? "+" : ""}{e.delta}
                    </td>
                    <td className="px-4 py-2 text-[#4A5280]">{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

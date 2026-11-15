"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  doneJobs: number;
  failedJobs: number;
  totalAssets: number;
  creditsSold: number;
  revenueGBP: number;
  recentUsers: Array<{
    id: string;
    email: string;
    creditBalance: number;
    createdAt: string;
  }>;
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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
      return;
    }
    if (status !== "authenticated") return;

    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 403) {
          router.replace("/studio");
          return null;
        }
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then((data) => { if (data) setStats(data); })
      .catch((e) => setError(e.message));
  }, [status, router]);

  if (status === "loading" || (!stats && !error)) {
    return (
      <div className="max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Admin</h1>
          <p className="text-sm text-zinc-500 mt-1 animate-pulse">Loading…</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Admin</h1>
        <p className="text-sm text-zinc-500 mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Users" value={stats.totalUsers.toString()} />
        <StatCard
          label="Jobs"
          value={stats.totalJobs.toString()}
          sub={`${stats.doneJobs} done · ${stats.failedJobs} failed`}
        />
        <StatCard label="Assets" value={stats.totalAssets.toString()} />
        <StatCard
          label="Revenue"
          value={`£${stats.revenueGBP.toFixed(2)}`}
          sub={`${stats.creditsSold} credits sold`}
        />
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
                <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"}`}
                >
                  <td className="px-4 py-3 text-zinc-300">{u.email}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{u.creditBalance}</td>
                  <td className="px-4 py-3 text-right text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {stats.recentUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-zinc-600">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

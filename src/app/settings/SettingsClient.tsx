"use client";
import { useState } from "react";
import { creditsToGBP } from "@/config";

interface SettingsData {
  name: string | null;
  email: string;
  createdAt: string;
  balance: number;
  recentLedger: Array<{ id: string; delta: number; reason: string; createdAt: string }>;
  recentJobs: Array<{
    id: string;
    prompt: string;
    modelId: string;
    status: string;
    creditsCharged: number;
    createdAt: string;
    resultUrl: string | null;
  }>;
}

function reasonLabel(reason: string) {
  if (reason === "stripe_topup") return "Top-up";
  if (reason === "image_gen" || reason === "video_gen") return "Generation";
  if (reason === "admin") return "Admin";
  return reason;
}

function statusDot(status: string) {
  if (status === "done")    return "bg-green-500";
  if (status === "failed")  return "bg-red-500";
  if (status === "running") return "bg-yellow-400";
  return "bg-zinc-600";
}

export default function SettingsClient({ data }: { data: SettingsData }) {
  const [name, setName]       = useState(data.name ?? "");
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function saveName() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else        { const d = await res.json(); setError(d.error ?? "Save failed"); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your profile and account</p>
      </div>

      {/* Profile */}
      <section className="space-y-5">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Profile</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800">

          {/* Email */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Email</p>
              <p className="text-sm text-zinc-100 mt-0.5">{data.email}</p>
            </div>
            <span className="text-xs text-zinc-600 italic">Magic link sign-in</span>
          </div>

          {/* Display name */}
          <div className="px-5 py-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Display name</p>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                maxLength={80}
                className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={saveName}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 shrink-0"
              >
                {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
              </button>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {/* Member since */}
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Member since</p>
            <p className="text-sm text-zinc-400">
              {new Date(data.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </section>

      {/* Credits */}
      <section className="space-y-5">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Credits</h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50">

          <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800">
            <div>
              <p className="text-2xl font-black text-zinc-100">{data.balance} cr</p>
              <p className="text-xs text-zinc-500 mt-0.5">{creditsToGBP(data.balance)} remaining</p>
            </div>
            <a
              href="/#pricing"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Top up
            </a>
          </div>

          {data.recentLedger.length > 0 && (
            <div className="divide-y divide-zinc-800/60">
              {data.recentLedger.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-zinc-300">{reasonLabel(entry.reason)}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {new Date(entry.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${entry.delta > 0 ? "text-green-400" : "text-zinc-400"}`}>
                    {entry.delta > 0 ? "+" : ""}{entry.delta} cr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent jobs */}
      <section className="space-y-5">
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Recent creations</h2>
        {data.recentJobs.length === 0 ? (
          <p className="text-sm text-zinc-600">No creations yet.</p>
        ) : (
          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Prompt</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Model</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Credits</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentJobs.map((job, i) => (
                  <tr key={job.id} className={`border-b border-zinc-800/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/20"}`}>
                    <td className="px-4 py-3 text-zinc-400 max-w-[180px] truncate">
                      {job.resultUrl ? (
                        <a href={job.resultUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                          {job.prompt || "—"}
                        </a>
                      ) : (job.prompt || "—")}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell text-xs">{job.modelId}</td>
                    <td className="px-4 py-3 text-right text-zinc-400">{job.creditsCharged}</td>
                    <td className="px-4 py-3 text-right text-zinc-600 hidden sm:table-cell text-xs">
                      {new Date(job.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${statusDot(job.status)}`} title={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}

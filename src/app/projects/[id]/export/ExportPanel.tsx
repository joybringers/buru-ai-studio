"use client";
import { useState } from "react";
import Link from "next/link";

type Checklist = {
  quote: boolean; script: boolean; bible: boolean; storyboard: boolean; timeline: boolean;
};
type Stats = {
  scenes: number; shots: number; approvedShots: number;
  totalDuration: number; spentCredits: number; hardCap: number;
};

const STEPS: { key: keyof Checklist; label: string; icon: string; href: (id: string) => string }[] = [
  { key: "quote",      label: "Film quote accepted",    icon: "💰", href: (id) => `/projects/${id}/quote` },
  { key: "script",     label: "Script written",         icon: "✍️", href: (id) => `/projects/${id}/script` },
  { key: "bible",      label: "Story bible populated",  icon: "📖", href: (id) => `/projects/${id}/bible` },
  { key: "storyboard", label: "All shots approved",     icon: "🎞️", href: (id) => `/projects/${id}/storyboard` },
  { key: "timeline",   label: "Timeline locked",        icon: "🎬", href: (id) => `/projects/${id}/timeline` },
];

export default function ExportPanel({
  projectId, projectTitle, reviewToken: initialToken,
  checklist, stats, timelineLocked,
}: {
  projectId: string;
  projectTitle: string;
  reviewToken: string | null;
  checklist: Checklist;
  stats: Stats;
  timelineLocked: boolean;
}) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const allReady = Object.values(checklist).every(Boolean);
  const doneCount = Object.values(checklist).filter(Boolean).length;

  const generateLink = async () => {
    setGenerating(true);
    const res = await fetch(`/api/projects/${projectId}/export`, { method: "POST" });
    const data = await res.json();
    setToken(data.reviewToken ?? null);
    setGenerating(false);
  };

  const revokeLink = async () => {
    await fetch(`/api/projects/${projectId}/export`, { method: "DELETE" });
    setToken(null);
  };

  const reviewUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/review/${token}` : null;

  const copyLink = () => {
    if (!reviewUrl) return;
    navigator.clipboard.writeText(reviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF]">
      {/* Header */}
      <div className="border-b border-[#1E2140] bg-[#121530] px-6 py-4 flex items-center gap-4">
        <Link href={`/projects/${projectId}/timeline`} className="text-[#A8B0D8] hover:text-[#F2F6FF] text-sm">← Timeline</Link>
        <div className="flex-1">
          <div className="text-xs text-[#A8B0D8] truncate">{projectTitle}</div>
          <div className="text-sm font-semibold text-[#2BE4FF]">📤 Export & Review</div>
        </div>
        <Link href="/projects" className="text-xs text-[#A8B0D8] hover:text-[#F2F6FF]">My Films</Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Scenes",   value: stats.scenes },
            { label: "Shots",    value: `${stats.approvedShots}/${stats.shots}` },
            { label: "Duration", value: `${stats.totalDuration}s` },
            { label: "Credits",  value: `${stats.spentCredits}/${stats.hardCap}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#121530] border border-[#1E2140] rounded-xl p-4 text-center">
              <div className="text-xl font-bold text-[#F2F6FF]">{value}</div>
              <div className="text-xs text-[#A8B0D8] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Readiness checklist */}
        <div className="bg-[#121530] border border-[#1E2140] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#F2F6FF]">Readiness</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${allReady ? "bg-emerald-900/40 text-emerald-400" : "bg-[#1E2140] text-[#A8B0D8]"}`}>
              {doneCount}/5 complete
            </span>
          </div>
          <div className="space-y-2">
            {STEPS.map(({ key, label, icon, href }) => (
              <div key={key} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                  checklist[key] ? "bg-emerald-500 text-white" : "bg-[#1E2140] text-[#4A5280]"
                }`}>
                  {checklist[key] ? "✓" : "○"}
                </span>
                <span className="text-sm">{icon}</span>
                <span className={`flex-1 text-sm ${checklist[key] ? "text-[#F2F6FF]" : "text-[#A8B0D8]"}`}>{label}</span>
                {!checklist[key] && (
                  <Link href={href(projectId)} className="text-xs text-[#6A4CFF] hover:text-[#A88FFF] transition-colors">
                    Go →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Shareable review link */}
        <div className="bg-[#121530] border border-[#1E2140] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#F2F6FF] mb-1">Shareable Review Link</h2>
          <p className="text-xs text-[#A8B0D8] mb-4">
            Share a view-only page of your script, characters, and shot list — no sign-in required.
          </p>

          {token ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input readOnly value={reviewUrl ?? ""}
                  className="flex-1 bg-[#0D0F1E] border border-[#1E2140] text-xs text-[#A8B0D8] rounded-lg px-3 py-2 outline-none font-mono" />
                <button onClick={copyLink}
                  className={`px-3 py-2 text-xs rounded-lg transition-colors ${copied ? "bg-emerald-700 text-white" : "bg-[#1E2140] text-[#A8B0D8] hover:text-[#F2F6FF]"}`}>
                  {copied ? "Copied!" : "Copy"}
                </button>
                {reviewUrl && (
                  <a href={reviewUrl} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-2 text-xs bg-[#1E2140] text-[#A8B0D8] hover:text-[#F2F6FF] rounded-lg transition-colors">
                    Preview ↗
                  </a>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={generateLink} disabled={generating}
                  className="text-xs text-[#A8B0D8] hover:text-[#F2F6FF] transition-colors">
                  Regenerate link
                </button>
                <button onClick={revokeLink} className="text-xs text-red-500 hover:text-red-400 transition-colors">
                  Revoke
                </button>
              </div>
            </div>
          ) : (
            <button onClick={generateLink} disabled={generating}
              className="bg-[#6A4CFF] hover:bg-[#5636F0] disabled:opacity-40 text-white text-sm px-5 py-2.5 rounded-xl transition-colors">
              {generating ? "Generating…" : "Generate Review Link"}
            </button>
          )}
        </div>

        {/* Export script as text */}
        <div className="bg-[#121530] border border-[#1E2140] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#F2F6FF] mb-1">Script Export</h2>
          <p className="text-xs text-[#A8B0D8] mb-4">Download your script as plain text for printing or sharing.</p>
          <a
            href={`/api/projects/${projectId}/export/script.txt`}
            download
            className="inline-block bg-[#1E2140] hover:bg-[#2A2F5E] text-[#F2F6FF] text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            ↓ Download script.txt
          </a>
        </div>

        {/* Next: render shots (placeholder) */}
        <div className={`rounded-xl p-5 border ${allReady ? "border-[#6A4CFF]/40 bg-[#6A4CFF]/10" : "border-[#1E2140] bg-[#121530]"}`}>
          <h2 className="text-sm font-semibold text-[#F2F6FF] mb-1">🎬 Render Shots</h2>
          <p className="text-xs text-[#A8B0D8] mb-4">
            {allReady
              ? "Your film is ready. Submit each shot to the AI video renderer (Kling) to generate video clips."
              : "Complete all 5 steps above before rendering."}
          </p>
          <button disabled={!allReady}
            className="bg-[#6A4CFF] hover:bg-[#5636F0] disabled:opacity-30 text-white text-sm px-5 py-2.5 rounded-xl transition-colors">
            Start Rendering — coming soon
          </button>
        </div>
      </div>
    </div>
  );
}

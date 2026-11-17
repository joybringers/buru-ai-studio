"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LineItem { stage: string; description: string; credits: number }
interface Quote {
  id: string;
  totalCredits: number;
  hardCap: number;
  spentCredits: number;
  acceptedAt: string | null;
  lockedUntil: string | null;
  lineItems: LineItem[];
}
interface Project {
  id: string;
  title: string;
  status: string;
  targetLength: number;
  quote: Quote | null;
}

const STAGE_ICONS: Record<string, string> = {
  script: "✍️", bible: "📖", storyboard: "🎞️",
  video: "🎬", voice: "🎙️", music: "🎵", export: "📤",
};

function creditsToUSD(c: number) {
  return `$${(c * 0.001).toFixed(2)}`;
}

export default function QuoteClient({ project, creditBalance }: { project: Project; creditBalance: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quote, setQuote] = useState<Quote | null>(project.quote);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [capValue, setCapValue] = useState(project.quote?.totalCredits ?? 0);
  const [error, setError] = useState("");

  const isLocked = !!quote?.acceptedAt;
  const lockedUntil = quote?.lockedUntil ? new Date(quote.lockedUntil) : null;
  const canAfford = creditBalance >= (quote?.hardCap ?? 0);

  async function generateQuote() {
    setGenerating(true); setError("");
    const res = await fetch(`/api/projects/${project.id}/quote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    if (res.ok) { setQuote(data); setCapValue(data.totalCredits); }
    else setError(data.error ?? "Failed to generate quote");
    setGenerating(false);
  }

  async function acceptQuote() {
    if (!quote) return;
    setAccepting(true); setError("");
    const res = await fetch(`/api/projects/${project.id}/quote/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hardCap: capValue }),
    });
    const data = await res.json();
    if (res.ok) {
      setQuote(data);
      startTransition(() => router.refresh());
    } else setError(data.error ?? "Failed to accept quote");
    setAccepting(false);
  }

  const pct = quote ? Math.round((quote.spentCredits / quote.hardCap) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/projects" className="text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6 inline-block">
        ← All Films
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">{project.title}</h1>
      <p className="text-sm text-gray-500 mb-8">
        {Math.floor(project.targetLength / 60)}m {project.targetLength % 60}s target ·{" "}
        Your balance: <span className="text-[#2BE4FF] font-semibold">{creditBalance.toLocaleString()} credits</span>
      </p>

      {/* Locked banner + Start Writing CTA */}
      {isLocked && lockedUntil && (
        <div className="bg-[#022B1E] border border-emerald-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-emerald-400 text-xl mt-0.5">🔒</span>
          <div className="flex-1">
            <p className="text-emerald-300 font-semibold text-sm">Quote locked — price guaranteed</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Price is fixed until {lockedUntil.toLocaleString()}. You will never be charged above your cap.
            </p>
          </div>
          <a
            href={`/projects/${project.id}/script`}
            className="flex-shrink-0 bg-[#6A4CFF] hover:bg-[#5636F0] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            ✍️ Start Writing
          </a>
        </div>
      )}

      {/* No quote yet */}
      {!quote && (
        <div className="bg-[#121530] border border-[#1E2244] rounded-xl p-8 text-center">
          <p className="text-gray-300 mb-2 font-semibold">No quote yet</p>
          <p className="text-gray-500 text-sm mb-6">
            Get one locked price for your whole film — before anything is generated.
          </p>
          <button
            onClick={generateQuote}
            disabled={generating}
            className="bg-[#6A4CFF] hover:bg-[#5636F0] disabled:opacity-40 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            {generating ? "Calculating…" : "Get Film Quote"}
          </button>
        </div>
      )}

      {/* Quote card */}
      {quote && (
        <div className="bg-[#121530] border border-[#1E2244] rounded-xl overflow-hidden mb-6">
          {/* Line items */}
          <div className="divide-y divide-[#1E2244]">
            {quote.lineItems.map((item) => (
              <div key={item.stage} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-base">{STAGE_ICONS[item.stage] ?? "•"}</span>
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{item.stage}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white font-variant-numeric tabular-nums">
                    {item.credits.toLocaleString()} cr
                  </p>
                  <p className="text-xs text-gray-600">{creditsToUSD(item.credits)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="bg-[#0D0F24] px-5 py-4 flex justify-between items-center">
            <span className="font-bold text-white">Total</span>
            <div className="text-right">
              <span className="font-bold text-white text-lg font-variant-numeric tabular-nums">
                {quote.totalCredits.toLocaleString()} credits
              </span>
              <p className="text-xs text-gray-500">{creditsToUSD(quote.totalCredits)} est.</p>
            </div>
          </div>
        </div>
      )}

      {/* Cap + accept */}
      {quote && !isLocked && (
        <div className="bg-[#121530] border border-[#1E2244] rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-white">Spending cap</label>
            <span className="text-sm font-bold text-[#6A4CFF] font-variant-numeric tabular-nums">
              {capValue.toLocaleString()} credits
            </span>
          </div>
          <input
            type="range"
            min={Math.ceil(quote.totalCredits * 0.5)}
            max={quote.totalCredits}
            value={capValue}
            onChange={e => setCapValue(Number(e.target.value))}
            className="w-full accent-[#6A4CFF] mb-2"
          />
          <p className="text-xs text-gray-500">
            Rendering stops if spending reaches this cap. Finished work is kept. Default: full quote.
          </p>
        </div>
      )}

      {/* Spend meter (after lock) */}
      {quote && isLocked && (
        <div className="bg-[#121530] border border-[#1E2244] rounded-xl p-5 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Credits used</span>
            <span className="font-semibold text-white font-variant-numeric tabular-nums">
              {quote.spentCredits.toLocaleString()} / {quote.hardCap.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-[#1E2244] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: pct >= 90 ? "#F87171" : "linear-gradient(90deg, #6A4CFF, #2F6BFF)",
              }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1.5">{pct}% of cap used</p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!canAfford && quote && !isLocked && (
        <div className="bg-[#2D1E00] border border-amber-800 rounded-lg p-3 mb-4">
          <p className="text-amber-400 text-sm">
            Your balance ({creditBalance.toLocaleString()} credits) is below the quote.{" "}
            <Link href="/pricing" className="underline">Top up →</Link>
          </p>
        </div>
      )}

      {quote && !isLocked && (
        <div className="flex gap-3">
          <button
            onClick={generateQuote}
            disabled={generating || isPending}
            className="border border-[#1E2244] text-gray-400 hover:border-gray-500 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Recalculate
          </button>
          <button
            onClick={acceptQuote}
            disabled={accepting || !canAfford || isPending}
            className="flex-1 bg-[#6A4CFF] hover:bg-[#5636F0] disabled:opacity-40 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors"
          >
            {accepting ? "Locking…" : "Accept Quote + Lock for 24h →"}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { CREDIT_PACKS, creditsToGBP, type CreditPack } from "@/config";

interface Props {
  onClose: () => void;
}

export default function TopUpModal({ onClose }: Props) {
  const [selected, setSelected] = useState<CreditPack>(CREDIT_PACKS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selected.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-100">Top up credits</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {CREDIT_PACKS.map((pack) => {
            const isSelected = pack.id === selected.id;
            return (
              <button
                key={pack.id}
                onClick={() => setSelected(pack)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all text-left ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-zinc-800 hover:border-zinc-600 bg-zinc-900"
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-zinc-100">
                    {pack.credits} cr
                  </span>
                  <span className="text-xs text-zinc-500 ml-2">{pack.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-zinc-100">
                    £{pack.priceGBP.toFixed(2)}
                  </span>
                  <span className="block text-xs text-zinc-600">
                    {creditsToGBP(1)} / cr
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">{error}</p>
        )}

        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
        >
          {loading ? "Redirecting to Stripe…" : `Buy ${selected.credits} cr for £${selected.priceGBP.toFixed(2)}`}
        </button>

        <p className="text-xs text-zinc-600 text-center mt-3">
          Secure payment via Stripe · Credits never expire
        </p>
      </div>
    </div>
  );
}

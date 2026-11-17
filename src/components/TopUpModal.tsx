"use client";
import { useState } from "react";
import { CREDIT_PACKS, creditsToGBP, type CreditPack } from "@/config";

const NGN_PACKS = [
  { id: "ngn-100",  credits: 100,  ngnKobo: 150_000,  label: "Starter",    ngnDisplay: "₦1,500" },
  { id: "ngn-300",  credits: 300,  ngnKobo: 400_000,  label: "Creator",    ngnDisplay: "₦4,000" },
  { id: "ngn-1000", credits: 1000, ngnKobo: 1_200_000, label: "Studio",    ngnDisplay: "₦12,000" },
  { id: "ngn-3000", credits: 3000, ngnKobo: 3_200_000, label: "Pro Studio", ngnDisplay: "₦32,000" },
];

interface Props {
  onClose: () => void;
}

export default function TopUpModal({ onClose }: Props) {
  const [currency, setCurrency] = useState<"GBP" | "NGN">("GBP");
  const [selected, setSelected] = useState<CreditPack>(CREDIT_PACKS[1]);
  const [selectedNgn, setSelectedNgn] = useState(NGN_PACKS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      if (currency === "GBP") {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId: selected.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Checkout failed");
        window.location.href = data.url;
      } else {
        const res = await fetch("/api/credits/paystack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credits: selectedNgn.credits }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Payment failed");
        window.location.href = data.url;
      }
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

        {/* Currency tabs */}
        <div className="flex gap-1 bg-zinc-800 rounded-xl p-1 mb-4">
          {(["GBP", "NGN"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${
                currency === c
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {c === "GBP" ? "£ GBP" : "₦ NGN"}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 mb-5">
          {currency === "GBP"
            ? CREDIT_PACKS.map((pack) => {
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
                      <span className="text-sm font-medium text-zinc-100">{pack.credits} cr</span>
                      <span className="text-xs text-zinc-500 ml-2">{pack.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-zinc-100">£{pack.priceGBP.toFixed(2)}</span>
                      <span className="block text-xs text-zinc-600">{creditsToGBP(1)} / cr</span>
                    </div>
                  </button>
                );
              })
            : NGN_PACKS.map((pack) => {
                const isSelected = pack.id === selectedNgn.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => setSelectedNgn(pack)}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all text-left ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-zinc-800 hover:border-zinc-600 bg-zinc-900"
                    }`}
                  >
                    <div>
                      <span className="text-sm font-medium text-zinc-100">{pack.credits} cr</span>
                      <span className="text-xs text-zinc-500 ml-2">{pack.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-100">{pack.ngnDisplay}</span>
                  </button>
                );
              })
          }
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
        >
          {loading
            ? currency === "GBP" ? "Redirecting to Stripe…" : "Redirecting to Paystack…"
            : currency === "GBP"
              ? `Buy ${selected.credits} cr for £${selected.priceGBP.toFixed(2)}`
              : `Buy ${selectedNgn.credits} cr for ${selectedNgn.ngnDisplay}`}
        </button>

        <p className="text-xs text-zinc-600 text-center mt-3">
          {currency === "GBP"
            ? "Secure payment via Stripe · Credits never expire"
            : "Secure payment via Paystack · Credits never expire"}
        </p>
      </div>
    </div>
  );
}

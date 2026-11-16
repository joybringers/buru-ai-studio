import Link from "next/link";
import { Suspense } from "react";
import { CREDIT_PACKS, IMAGE_MODELS, creditsToGBP } from "@/config";
import RefCapture from "@/components/RefCapture";

export default function Home() {
  return (
    <div className="space-y-24 pb-24">
      <Suspense fallback={null}><RefCapture /></Suspense>

      {/* ── Hero ── */}
      <section className="pt-16 pb-8 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          AI image &amp; video generation
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-zinc-100 leading-tight tracking-tight max-w-2xl mx-auto">
          Create stunning visuals{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            in seconds
          </span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Generate professional images for your brand using the latest AI models.
          No subscription — pay only for what you create.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/auth/signin"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Get started free
          </Link>
          <Link
            href="/gallery"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
          >
            See examples
          </Link>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 text-center">
          Everything you need
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              icon: "✦",
              title: "Top AI models",
              body: "FLUX Schnell for fast drafts, FLUX Dev for high quality, Ideogram for text-heavy designs. Video generation coming soon.",
            },
            {
              icon: "⟳",
              title: "Pay as you go",
              body: "Buy a credit pack once, use it whenever. Credits never expire. No monthly fees, no hidden costs.",
            },
            {
              icon: "▦",
              title: "Your gallery",
              body: "Every image you generate is saved to your private gallery. Download, reuse, or delete at any time.",
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3"
            >
              <span className="text-2xl text-indigo-400">{icon}</span>
              <h3 className="font-semibold text-zinc-100">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Models ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 text-center">
          Available models
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {IMAGE_MODELS.map((model) => (
            <div
              key={model.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-zinc-100">{model.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{model.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-100">
                  {model.credits} cr
                </p>
                <p className="text-xs text-zinc-600">{creditsToGBP(model.credits)}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-zinc-600">
          Video generation (Gen-4 Turbo, Veo 3.1 Fast) — coming soon
        </p>
      </section>

      {/* ── Pricing ── */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 text-center">
          Credit packs
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack, i) => {
            const isPopular = i === 1;
            return (
              <div
                key={pack.id}
                className={`relative bg-zinc-900 rounded-2xl p-6 space-y-4 border ${
                  isPopular ? "border-indigo-500" : "border-zinc-800"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-400">{pack.label}</p>
                  <p className="text-3xl font-bold text-zinc-100 mt-1">
                    £{pack.priceGBP.toFixed(2)}
                  </p>
                </div>
                <p className="text-sm text-zinc-300">
                  <span className="font-semibold text-zinc-100">{pack.credits} credits</span>
                  {" "}— {Math.floor(pack.credits / 3)} FLUX Schnell images
                </p>
                <Link
                  href="/auth/signin"
                  className={`block text-center text-sm font-medium py-2.5 rounded-xl transition-colors ${
                    isPopular
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                  }`}
                >
                  Get started
                </Link>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs text-zinc-600">
          Credits never expire · Secure payment via Stripe
        </p>
      </section>

      {/* ── Final CTA ── */}
      <section className="text-center space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl py-12 px-6">
        <h2 className="text-2xl font-bold text-zinc-100">
          Ready to create?
        </h2>
        <p className="text-sm text-zinc-400 max-w-sm mx-auto">
          Sign in with your email — no password needed. Start generating in under a minute.
        </p>
        <Link
          href="/auth/signin"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm"
        >
          Sign in with magic link →
        </Link>
      </section>

    </div>
  );
}

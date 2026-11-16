import Link from "next/link";
import { Suspense } from "react";
import { CREDIT_PACKS, MODELS, creditsToGBP } from "@/config";
import RefCapture from "@/components/RefCapture";

// ── Use-case tool cards ───────────────────────────────────────────────────────

const TOOLS = [
  {
    category: "FOR BUSINESS",
    items: [
      {
        title: "Product Ads",
        desc: "AI-generated product videos and images that sell",
        icon: "🎯",
        href: "/studio",
        badge: null,
      },
      {
        title: "Brand Images",
        desc: "Consistent visual identity at scale — no designer needed",
        icon: "✦",
        href: "/studio",
        badge: null,
      },
      {
        title: "Social Content",
        desc: "Scroll-stopping visuals for Instagram, TikTok, LinkedIn",
        icon: "📱",
        href: "/studio",
        badge: null,
      },
      {
        title: "Film Trailer",
        desc: "Cinematic brand stories in seconds",
        icon: "🎬",
        href: "/studio",
        badge: null,
      },
      {
        title: "UGC Ads",
        desc: "Authentic creator-style ads that convert",
        icon: "📢",
        href: "/studio",
        badge: null,
      },
      {
        title: "Branding Ads",
        desc: "On-brand video ads at scale",
        icon: "⚡",
        href: "/studio",
        badge: null,
      },
    ],
  },
  {
    category: "VIDEO",
    items: [
      {
        title: "Text to Video",
        desc: "Turn your words into cinematic AI clips",
        icon: "▶",
        href: "/studio",
        badge: null,
      },
      {
        title: "Animate Images",
        desc: "Bring any photo or illustration to life",
        icon: "🌀",
        href: "/studio",
        badge: "NEW",
      },
      {
        title: "Music Video",
        desc: "Sync AI visuals to any audio track",
        icon: "🎵",
        href: "/studio",
        badge: "SOON",
      },
      {
        title: "Motion Control",
        desc: "Direct precise camera movement in your video",
        icon: "🎥",
        href: "/studio",
        badge: "SOON",
      },
    ],
  },
  {
    category: "IMAGE",
    items: [
      {
        title: "Image Generator",
        desc: "Generate stunning images from text prompts",
        icon: "🖼",
        href: "/studio",
        badge: null,
      },
      {
        title: "Product Shots",
        desc: "Studio-quality product photography without a studio",
        icon: "📦",
        href: "/studio",
        badge: null,
      },
      {
        title: "Poster Design",
        desc: "Bold typographic and graphic posters",
        icon: "🖊",
        href: "/studio",
        badge: null,
      },
      {
        title: "Image Upscale",
        desc: "Enhance resolution and add fine detail with AI",
        icon: "🔍",
        href: "/studio",
        badge: "SOON",
      },
    ],
  },
];

// ── Gradient sample tiles for hero mosaic ─────────────────────────────────────

const TILES = [
  { from: "#1e1b4b", to: "#312e81", label: "Brand Film" },
  { from: "#450a0a", to: "#7f1d1d", label: "Product Ad" },
  { from: "#0c4a6e", to: "#075985", label: "Social Reel" },
  { from: "#1a1a2e", to: "#16213e", label: "Music Video" },
  { from: "#14532d", to: "#166534", label: "Portrait" },
  { from: "#3b0764", to: "#581c87", label: "Animation" },
];

export default function Home() {
  const VIDEO_MODELS = MODELS.filter((m) => m.type === "video" && !m.inputType);
  const I2V_MODELS = MODELS.filter((m) => m.inputType === "image");
  const IMAGE_MODELS = MODELS.filter((m) => m.type === "image");

  return (
    <div className="pb-24">
      <Suspense fallback={null}><RefCapture /></Suspense>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block animate-pulse" />
              AI image &amp; video studio
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Create AI videos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                &amp; images
              </span>{" "}
              that convert
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
              From product ads to cinematic brand films — generate professional
              content in seconds using the latest AI models. No subscription,
              no designer needed.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/auth/signin"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Start for free →
              </Link>
              <Link
                href="/gallery"
                className="text-zinc-400 hover:text-zinc-200 font-medium px-4 py-3 rounded-xl transition-colors text-sm border border-zinc-800 hover:border-zinc-600"
              >
                See examples
              </Link>
            </div>
            <p className="text-xs text-zinc-600">50 free credits on sign up · no credit card needed</p>
          </div>

          {/* Right: mosaic of gradient tiles */}
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            {TILES.map((tile) => (
              <div
                key={tile.label}
                className="aspect-square rounded-xl overflow-hidden relative group cursor-default"
                style={{ background: `linear-gradient(135deg, ${tile.from}, ${tile.to})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-xs text-white/60 font-medium">{tile.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-zinc-800/60 py-5">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap justify-center sm:justify-between gap-6 text-center sm:text-left">
            {[
              { value: "7+", label: "AI models" },
              { value: "T2V + I2V", label: "Video generation" },
              { value: "5 ratios", label: "Aspect ratios" },
              { value: "Pay-as-you-go", label: "No subscription" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-xl font-bold text-zinc-100">{value}</p>
                <p className="text-xs text-zinc-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tool cards ────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-8">
        <div className="max-w-5xl mx-auto px-4 space-y-14">
          {TOOLS.map(({ category, items }) => (
            <div key={category} className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
                  {category}
                </span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((tool) => (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    className={`group relative bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition-all hover:bg-zinc-900/80 ${
                      tool.badge === "SOON" ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{tool.icon}</span>
                      {tool.badge && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          tool.badge === "NEW"
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-zinc-100 mb-1 group-hover:text-white transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{tool.desc}</p>
                    {tool.badge !== "SOON" && (
                      <span className="absolute bottom-5 right-5 text-zinc-700 group-hover:text-indigo-400 transition-colors text-sm">→</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Models ────────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-8">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-zinc-100">All AI models</h2>
            <p className="text-sm text-zinc-500">The best open and commercial models, one platform</p>
          </div>

          {/* Video T2V */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Text → Video</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {VIDEO_MODELS.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{m.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-100">{m.credits} cr</p>
                    <p className="text-xs text-zinc-600">{creditsToGBP(m.credits)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* I2V */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Image → Video</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {I2V_MODELS.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{m.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-100">{m.credits} cr</p>
                    <p className="text-xs text-zinc-600">{creditsToGBP(m.credits)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Image</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {IMAGE_MODELS.map((m) => (
                <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 space-y-2">
                  <p className="text-sm font-semibold text-zinc-100">{m.name}</p>
                  <p className="text-xs text-zinc-500">{m.description}</p>
                  <p className="text-xs font-bold text-zinc-100">{m.credits} cr <span className="text-zinc-600 font-normal">{creditsToGBP(m.credits)}</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-8" id="pricing">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-zinc-100">Simple pricing</h2>
            <p className="text-sm text-zinc-500">Buy credits once — they never expire. No monthly fees.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {CREDIT_PACKS.map((pack, i) => {
              const isPopular = i === 1;
              return (
                <div key={pack.id}
                  className={`relative bg-zinc-900 rounded-2xl p-6 space-y-4 border ${
                    isPopular ? "border-indigo-500 ring-1 ring-indigo-500/20" : "border-zinc-800"
                  }`}>
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-400">{pack.label}</p>
                    <p className="text-3xl font-bold text-zinc-100 mt-1">£{pack.priceGBP.toFixed(2)}</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    <li className="flex gap-2"><span className="text-green-400">✓</span> {pack.credits} credits</li>
                    <li className="flex gap-2"><span className="text-green-400">✓</span> {Math.floor(pack.credits / 3)} quick images</li>
                    <li className="flex gap-2"><span className="text-green-400">✓</span> Credits never expire</li>
                  </ul>
                  <Link href="/auth/signin"
                    className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                      isPopular
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    }`}>
                    Get started
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-zinc-600">Secure payments via Stripe</p>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="pt-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-900 border border-indigo-500/20 rounded-3xl py-16 px-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative space-y-4">
              <h2 className="text-3xl font-bold text-white">Ready to create?</h2>
              <p className="text-zinc-400 max-w-sm mx-auto text-sm leading-relaxed">
                Sign in with your email — no password, no card. Get 50 free credits instantly.
              </p>
              <Link href="/auth/signin"
                className="inline-block bg-white hover:bg-zinc-100 text-zinc-900 font-semibold px-8 py-3 rounded-xl transition-colors text-sm mt-2">
                Start creating free →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

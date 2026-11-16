import Link from "next/link";
import { Suspense } from "react";
import { CREDIT_PACKS, MODELS, creditsToGBP } from "@/config";
import RefCapture from "@/components/RefCapture";

// ── Hero tile mosaic data ─────────────────────────────────────────────────────

const HERO_TILES = [
  { bg: "linear-gradient(145deg,#1e1b4b 0%,#3730a3 100%)", label: "Brand Film",    delay: "0s",    scanDelay: "0s" },
  { bg: "linear-gradient(145deg,#450a0a 0%,#991b1b 100%)", label: "Product Ad",    delay: "0.6s",  scanDelay: "1.2s" },
  { bg: "linear-gradient(145deg,#082f49 0%,#0369a1 100%)", label: "Social Reel",   delay: "1.2s",  scanDelay: "2.4s" },
  { bg: "linear-gradient(145deg,#1a0533 0%,#7e22ce 100%)", label: "Mood Film",     delay: "1.8s",  scanDelay: "3.6s" },
  { bg: "linear-gradient(145deg,#2e1065 0%,#7c3aed 100%)", label: "Animation",     delay: "0.4s",  scanDelay: "0.8s" },
  { bg: "linear-gradient(145deg,#431407 0%,#c2410c 100%)", label: "Music Video",   delay: "1.0s",  scanDelay: "2.0s" },
  { bg: "linear-gradient(145deg,#172554 0%,#1d4ed8 100%)", label: "Commercial",    delay: "1.6s",  scanDelay: "3.2s" },
  { bg: "linear-gradient(145deg,#042f2e 0%,#0d9488 100%)", label: "AI Art",        delay: "2.2s",  scanDelay: "4.4s" },
  { bg: "linear-gradient(145deg,#052e16 0%,#166534 100%)", label: "Portrait",      delay: "0.2s",  scanDelay: "0.4s" },
  { bg: "linear-gradient(145deg,#3b0a0a 0%,#b91c1c 100%)", label: "Drama",        delay: "0.8s",  scanDelay: "1.6s" },
  { bg: "linear-gradient(145deg,#0f172a 0%,#334155 100%)", label: "Film Noir",     delay: "1.4s",  scanDelay: "2.8s" },
  { bg: "linear-gradient(145deg,#78350f 0%,#92400e 100%)", label: "UGC Ad",        delay: "2.0s",  scanDelay: "4.0s" },
];

// ── Tool cards (no emojis) ────────────────────────────────────────────────────

const TOOLS = [
  {
    category: "FOR BUSINESS",
    accent: "bg-indigo-500",
    items: [
      { title: "Product Ads",    desc: "AI-generated product videos and images that sell",          href: "/create/product-ad",   badge: null },
      { title: "Brand Images",   desc: "Consistent visual identity at scale — no designer needed", href: "/create/brand-image",  badge: null },
      { title: "Social Content", desc: "Scroll-stopping visuals for Instagram, TikTok, LinkedIn",  href: "/create/social-reel",  badge: null },
      { title: "Film Trailer",   desc: "Cinematic brand stories in seconds",                        href: "/create/brand-film",   badge: null },
      { title: "UGC Ads",        desc: "Authentic creator-style ads that convert",                  href: "/create/ugc-ad",       badge: null },
      { title: "Branding Ads",   desc: "On-brand video ads at scale",                              href: "/create/product-ad",   badge: null },
    ],
  },
  {
    category: "VIDEO",
    accent: "bg-violet-500",
    items: [
      { title: "Text to Video",   desc: "Turn your words into cinematic AI clips",             href: "/create/text-to-video", badge: null },
      { title: "Animate Images",  desc: "Bring any photo or illustration to life",             href: "/studio",               badge: "NEW" },
      { title: "Music Video",     desc: "Sync AI visuals to any audio track",                  href: "/studio",               badge: "SOON" },
      { title: "Motion Control",  desc: "Direct precise camera movement in your video",        href: "/studio",               badge: "SOON" },
    ],
  },
  {
    category: "IMAGE",
    accent: "bg-rose-500",
    items: [
      { title: "Image Generator", desc: "Generate stunning images from text prompts",             href: "/create/image",        badge: null },
      { title: "Product Shots",   desc: "Studio-quality product photography without a studio",   href: "/create/product-shot", badge: null },
      { title: "Poster Design",   desc: "Bold typographic and graphic posters",                   href: "/create/poster",       badge: null },
      { title: "Image Upscale",   desc: "Enhance resolution and add fine detail with AI",         href: "/studio",              badge: "SOON" },
    ],
  },
];

export default function Home() {
  const VIDEO_MODELS = MODELS.filter((m) => m.type === "video" && !m.inputType);
  const I2V_MODELS   = MODELS.filter((m) => m.inputType === "image");
  const IMAGE_MODELS = MODELS.filter((m) => m.type === "image");

  return (
    <div className="pb-24">
      <Suspense fallback={null}><RefCapture /></Suspense>

      {/* ── HERO — full-bleed, full-screen ────────────────────────────────── */}
      <section className="breakout -mt-8 relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Animated tile grid — full background */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3">
          {HERO_TILES.map((tile, i) => (
            <div
              key={i}
              className="tile-scan animate-tile"
              style={{
                background: tile.bg,
                animationDelay: tile.delay,
              }}
            >
              {/* Scan sweep — different delay per tile */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)",
                  animation: `scan-sweep 6s linear infinite`,
                  animationDelay: tile.scanDelay,
                }}
              />
              <span className="absolute bottom-2 left-2.5 text-[10px] text-white/30 font-medium tracking-widest uppercase">
                {tile.label}
              </span>
            </div>
          ))}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/62" />

        {/* Edge vignette — adds cinematic depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_50%,transparent_30%,rgba(0,0,0,0.7)_100%)]" />

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-sm text-white/50 text-xs font-semibold px-5 py-2 rounded-full mb-10 tracking-[0.15em] uppercase hero-reveal-sub" style={{ animationDelay: "0s" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            AI Image &amp; Video Studio
          </div>

          {/* Main headline */}
          <h1 className="hero-reveal font-black tracking-tighter leading-[0.88] uppercase text-white mb-10"
              style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}>
            WHERE<br />
            PROMPTS<br />
            BECOME{" "}
            <span
              className="animate-gradient-text text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(90deg, #818cf8, #a78bfa, #c084fc, #818cf8)",
                backgroundSize: "200% 200%",
              }}
            >
              CINEMATIC<br />
              REALITY
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="hero-reveal-sub text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed mb-10"
             style={{ animationDelay: "0.4s" }}>
            AI image &amp; video generation for brands and creators.
            <br className="hidden sm:block" />
            No subscription — pay per creation.
          </p>

          {/* CTAs */}
          <div className="hero-reveal-cta flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/signin"
              className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl transition-all text-sm tracking-widest uppercase"
            >
              Start for free
            </Link>
            <Link
              href="/gallery"
              className="border border-white/15 hover:border-white/35 text-white/65 hover:text-white px-8 py-4 rounded-2xl transition-all text-sm tracking-widest uppercase backdrop-blur-sm"
            >
              See gallery
            </Link>
          </div>

          <p className="text-xs text-zinc-600 mt-7 tracking-[0.18em] uppercase">
            50 free credits on sign up · No credit card needed
          </p>
        </div>

        {/* Bottom fade-to-black */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-zinc-800/60 py-6 mt-0">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800/60">
            {[
              { value: "7+",             label: "AI Models" },
              { value: "T2V + I2V",      label: "Video Generation" },
              { value: "5 Ratios",       label: "Aspect Ratios" },
              { value: "Pay Per Use",    label: "No Subscription" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center sm:px-8 py-2">
                <p className="text-xl font-black text-zinc-100 tracking-tight">{value}</p>
                <p className="text-xs text-zinc-600 mt-0.5 tracking-widest uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tool cards ────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-8">
        <div className="max-w-5xl mx-auto px-4 space-y-16">

          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-100 uppercase">
              Everything you need to create
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              Professional AI content generation for every use case
            </p>
          </div>

          {TOOLS.map(({ category, accent, items }) => (
            <div key={category} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-4 rounded-full ${accent}`} />
                <span className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
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
                      tool.badge === "SOON" ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {/* Accent line at top */}
                    <div className={`absolute top-0 left-5 right-5 h-px ${accent} opacity-0 group-hover:opacity-60 transition-opacity rounded-full`} />

                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-2 h-2 rounded-full mt-1 ${accent} opacity-60`} />
                      {tool.badge && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full tracking-wider ${
                          tool.badge === "NEW"
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}>
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-100 mb-1.5 group-hover:text-white transition-colors tracking-tight">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{tool.desc}</p>
                    {tool.badge !== "SOON" && (
                      <span className="absolute bottom-5 right-5 text-zinc-700 group-hover:text-indigo-400 transition-colors text-sm">
                        →
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── All models ────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-8">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-zinc-100 uppercase">All AI models</h2>
            <p className="text-sm text-zinc-500">The best open and commercial models, one platform</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Text to Video</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {VIDEO_MODELS.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-100 tracking-tight">{m.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-100">{m.credits} cr</p>
                    <p className="text-xs text-zinc-600">{creditsToGBP(m.credits)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Image to Video</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {I2V_MODELS.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-100 tracking-tight">{m.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-100">{m.credits} cr</p>
                    <p className="text-xs text-zinc-600">{creditsToGBP(m.credits)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Image Generation</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {IMAGE_MODELS.map((m) => (
                <div key={m.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 space-y-1.5">
                  <p className="text-sm font-bold text-zinc-100 tracking-tight">{m.name}</p>
                  <p className="text-xs text-zinc-500">{m.description}</p>
                  <p className="text-xs font-black text-zinc-100">
                    {m.credits} cr{" "}
                    <span className="text-zinc-600 font-normal">{creditsToGBP(m.credits)}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-8" id="pricing">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-zinc-100 uppercase">Simple pricing</h2>
            <p className="text-sm text-zinc-500">Buy credits once — they never expire. No monthly fees.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {CREDIT_PACKS.map((pack, i) => {
              const isPopular = i === 1;
              return (
                <div
                  key={pack.id}
                  className={`relative bg-zinc-900 rounded-2xl p-6 space-y-4 border ${
                    isPopular ? "border-indigo-500 ring-1 ring-indigo-500/20" : "border-zinc-800"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                      Most popular
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-400">{pack.label}</p>
                    <p className="text-3xl font-black text-zinc-100 mt-1 tracking-tight">
                      £{pack.priceGBP.toFixed(2)}
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      {pack.credits} credits
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      {Math.floor(pack.credits / 3)} quick images
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-400 font-bold">✓</span>
                      Credits never expire
                    </li>
                  </ul>
                  <Link
                    href="/auth/signin"
                    className={`block text-center text-sm font-bold py-2.5 rounded-xl transition-colors tracking-wide uppercase ${
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
          <p className="text-center text-xs text-zinc-600 tracking-widest uppercase">
            Secure payments via Stripe
          </p>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="pt-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative bg-gradient-to-br from-indigo-950/60 via-zinc-900 to-zinc-900 border border-indigo-500/20 rounded-3xl py-20 px-8 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative space-y-6">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase leading-tight">
                Ready to create<br />
                <span
                  className="animate-gradient-text text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #818cf8, #a78bfa, #c084fc, #818cf8)",
                    backgroundSize: "200% 200%",
                  }}
                >
                  something cinematic?
                </span>
              </h2>
              <p className="text-zinc-400 max-w-sm mx-auto text-sm leading-relaxed">
                Sign in with your email — no password, no card required.
                <br />Get 50 free credits instantly.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block bg-white hover:bg-zinc-100 text-zinc-900 font-bold px-10 py-4 rounded-2xl transition-colors text-sm tracking-widest uppercase mt-2"
              >
                Start creating free
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

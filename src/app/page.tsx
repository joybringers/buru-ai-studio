"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CREDIT_PACKS, MODELS, creditsToGBP } from "@/config";
import RefCapture from "@/components/RefCapture";

const MODES = [
  { id: "film",  label: "Film",  href: "/projects" },
  { id: "image", label: "Image", href: "/create/image" },
  { id: "video", label: "Video", href: "/studio" },
  { id: "audio", label: "Audio", href: "/studio?model=stable-audio" },
] as const;

type ModeId = (typeof MODES)[number]["id"];

const SUGGESTIONS = [
  "A short film about a Lagos street musician who finds a mysterious record",
  "Cinematic brand film for a luxury perfume — golden hour, slow motion",
  "Documentary intro: deep-sea creatures, 60 seconds, narrated",
];

const TOOLS = [
  { label: "Upscale 4×",   icon: "↑",  href: "/tools/upscale",    badge: null },
  { label: "Remove BG",    icon: "✂",  href: "/tools/background", badge: null },
  { label: "Edit Image",   icon: "✏",  href: "/tools/inpaint",    badge: null },
  { label: "Relight",      icon: "⊙",  href: "/tools/relight",    badge: "NEW" },
  { label: "Voice Over",   icon: "◎",  href: "/tools/voiceover",  badge: "NEW" },
  { label: "Lip Sync",     icon: "◉",  href: "/tools/lipsync",    badge: "NEW" },
  { label: "Face Swap",    icon: "⬡",  href: "/tools/faceswap",   badge: "HOT" },
  { label: "Inspirations", icon: "✦",  href: "/inspire",          badge: null },
];

const FEATURE_TABS = [
  {
    id: "film",
    label: "Film",
    accent: "#6A4CFF",
    accentBg: "rgba(106,76,255,.12)",
    headline: "From idea to screen, end to end",
    sub: "AI writes your script, plans every shot, and exports a shareable client review link — all in one project.",
    cards: [
      { icon: "✍", title: "AI Script Writer",  desc: "One idea becomes a full shooting script in seconds." },
      { icon: "🎬", title: "Shot Storyboard",   desc: "Auto-generate visual boards from your scenes." },
      { icon: "📖", title: "Film Bible",         desc: "Characters, world, tone — all organized in one place." },
      { icon: "🔗", title: "Client Review",      desc: "Share a secure review link. No account needed for clients." },
    ],
    cta: { label: "Start a film →", href: "/projects" },
  },
  {
    id: "video",
    label: "Video",
    accent: "#2F6BFF",
    accentBg: "rgba(47,107,255,.12)",
    headline: "Cinematic video in seconds",
    sub: "Text to video, image to video, 10-second pro clips — all powered by Kling Pro 2.0.",
    cards: [
      { icon: "▶", title: "Text to Video",   desc: "Describe a scene. Get a 5-second cinematic clip." },
      { icon: "⬛", title: "Image to Video", desc: "Animate any photo into a smooth, motion clip." },
      { icon: "⚡", title: "10s Pro Video",  desc: "Longer, higher-quality video with Kling Pro." },
      { icon: "🎥", title: "Camera Control", desc: "Zoom, pan, dolly — direct the virtual camera." },
    ],
    cta: { label: "Generate video →", href: "/studio" },
  },
  {
    id: "image",
    label: "Image",
    accent: "#2BE4FF",
    accentBg: "rgba(43,228,255,.10)",
    headline: "Studio-quality images, any style",
    sub: "FLUX 1.1 Pro, Ideogram, and more. From 3-credit quick drafts to 4K ultra-resolution.",
    cards: [
      { icon: "✦", title: "FLUX 1.1 Pro",          desc: "Best-in-class photorealism and artistic detail." },
      { icon: "T", title: "Ideogram v2",             desc: "AI that actually gets text and typography right." },
      { icon: "↑", title: "4× Upscale",             desc: "Sharpen and enlarge any image to print quality." },
      { icon: "✂", title: "Remove Background",      desc: "One click — perfect transparent cutout every time." },
    ],
    cta: { label: "Create image →", href: "/create/image" },
  },
  {
    id: "audio",
    label: "Audio",
    accent: "#A88FFF",
    accentBg: "rgba(168,143,255,.12)",
    headline: "Voice, music, sound — all AI",
    sub: "Voiceovers, cloned voices, lip sync, and original scores. Everything your film's soundtrack needs.",
    cards: [
      { icon: "◎", title: "AI Voiceover",  desc: "50+ voices. Paste your script, get the read." },
      { icon: "🎙", title: "Voice Clone",  desc: "Clone any voice from a 10-second sample." },
      { icon: "◉", title: "Lip Sync",      desc: "Match any audio track to a talking-head video." },
      { icon: "♪", title: "AI Music",      desc: "30-second original scores from a text description." },
    ],
    cta: { label: "Make audio →", href: "/tools/voiceover" },
  },
  {
    id: "tools",
    label: "Tools",
    accent: "#7B84B5",
    accentBg: "rgba(123,132,181,.12)",
    headline: "Transform anything you've already made",
    sub: "Edit, relight, inpaint, face swap — powerful post-production tools, AI-accelerated.",
    cards: [
      { icon: "⊙", title: "AI Relight",  desc: "Change the lighting of any photo in one prompt." },
      { icon: "⬡", title: "Face Swap",   desc: "Swap faces between images or video frames." },
      { icon: "✏", title: "Inpaint",     desc: "Edit any region of an image with a mask + prompt." },
      { icon: "✂", title: "Video Edit",  desc: "Restyle footage with AI prompts and effects." },
    ],
    cta: { label: "Explore tools →", href: "/tools/relight" },
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "How does the credit system work?",
    a: "Every generation costs credits based on the model and output type. A quick draft image is 3 credits, a pro image up to 25, a 5-second video 60–150. Credits never expire and stack with every purchase.",
  },
  {
    q: "Can I use BuruStudio for commercial projects?",
    a: "Yes. Maker pack and above include commercial rights. Film Pack covers unlimited projects. Free trial is personal use only. Full details on the Pricing page.",
  },
  {
    q: "What is the Film workflow?",
    a: "Film guides you from idea to screen: AI Script Writer → Shot Storyboard → Film Bible → Render via Studio → Client Review link. Everything lives in one project, organized by scene.",
  },
  {
    q: "Which AI models are available?",
    a: "FLUX Schnell, FLUX Dev, FLUX 1.1 Pro, Ideogram v2, Kling v1.6, Kling Pro 2.0, Kling Animate, MiniMax T2V, Stable Audio — plus voice, lip sync, face swap, relight, and more tools.",
  },
  {
    q: "Is there a subscription or monthly fee?",
    a: "No. BuruStudio is fully pay-as-you-go. Buy credits once, use them whenever you like. No auto-renewal, no monthly commitments, no surprises.",
  },
  {
    q: "Can I pay in Nigerian Naira?",
    a: "Yes — select Paystack at checkout to pay in NGN with any Nigerian debit or credit card. Credits are added to your account instantly after payment.",
  },
];

const MARQUEE_ROW_1 = [
  "Kling Pro 2.0", "FLUX 1.1 Pro", "Ideogram 2.0", "Stable Video",
  "Kokoro TTS", "Stable Audio", "Face Swap Pro", "4× AI Upscale",
  "Lip Sync AI", "Background Remove", "AI Relight", "Kling Standard",
];
const MARQUEE_ROW_2 = [
  "AI Director", "Story Bible", "Continuity Check", "Script Writer",
  "Shot Manager", "Storyboard AI", "Export Review", "Scene Planner",
  "Voice Clone", "Cinematic Grade", "AI Narration", "Film Export",
];

const SHOWCASE_ITEMS = [
  {
    type: "FILM",
    title: "Lagos Street Musician",
    sub: "90s short film · AI-scripted & storyboarded",
    gradient: "linear-gradient(145deg, #1a0533 0%, #2d1b69 40%, #1e3a8a 100%)",
    accent: "#A88FFF",
    visual: "film",
  },
  {
    type: "IMAGE",
    title: "Golden Hour Portrait",
    sub: "FLUX 1.1 Pro · 4K resolution",
    gradient: "linear-gradient(145deg, #082f49 0%, #0c4a6e 40%, #0369a1 100%)",
    accent: "#38bdf8",
    visual: "image",
  },
  {
    type: "VIDEO",
    title: "Luxury Product Commercial",
    sub: "Kling Pro 2.0 · 10 seconds · 1080p",
    gradient: "linear-gradient(145deg, #172554 0%, #1d4ed8 50%, #2563eb 100%)",
    accent: "#93c5fd",
    visual: "video",
  },
  {
    type: "AUDIO",
    title: "Cinematic Orchestral Score",
    sub: "Stable Audio · 2 minutes · 44.1 kHz",
    gradient: "linear-gradient(145deg, #042f2e 0%, #0d9488 50%, #0f766e 100%)",
    accent: "#2BE4FF",
    visual: "audio",
  },
  {
    type: "FILM",
    title: "Afrobeat Music Video",
    sub: "AI-directed · 3 minutes · Full production pipeline",
    gradient: "linear-gradient(145deg, #1e1b4b 0%, #3730a3 40%, #4f46e5 100%)",
    accent: "#c4b5fd",
    visual: "film",
  },
];

function MarqueeStrip({ items, direction }: { items: string[]; direction: "left" | "right" }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className="flex gap-3 w-max"
        style={{
          animation: `marquee-${direction} ${direction === "left" ? 32 : 38}s linear infinite`,
          willChange: "transform",
        }}
      >
        {doubled.map((name, i) => (
          <span
            key={i}
            className="shrink-0 px-4 py-1.5 rounded-pill text-xs font-semibold text-mist whitespace-nowrap"
            style={{
              background: "rgba(106,76,255,.10)",
              border: "1px solid rgba(106,76,255,.18)",
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ShowcaseVisual({ visual, accent }: { visual: string; accent: string }) {
  if (visual === "film") {
    return (
      <div className="absolute inset-6 flex flex-col gap-2 opacity-30">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-2 flex-1">
            {[0, 1, 2, 3].map((col) => (
              <div key={col} className="flex-1 rounded border opacity-60"
                style={{ borderColor: accent, background: `${accent}10` }} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (visual === "image") {
    return (
      <div className="absolute inset-8 rounded-xl opacity-25 border-2"
        style={{ borderColor: accent, background: `${accent}08` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-2 opacity-60" style={{ borderColor: accent }} />
        </div>
      </div>
    );
  }
  if (visual === "video") {
    return (
      <div className="absolute inset-0 flex items-center justify-center opacity-25">
        <div className="w-20 h-20 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: accent }}>
          <div className="ml-1 border-y-8 border-l-14 border-y-transparent"
            style={{ borderLeftColor: accent, width: 0, height: 0,
              borderTop: "8px solid transparent", borderBottom: "8px solid transparent",
              borderLeft: `14px solid ${accent}` }} />
        </div>
        {/* Scan line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 opacity-40"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            animation: "scan-line 2.5s linear infinite",
          }} />
      </div>
    );
  }
  if (visual === "audio") {
    return (
      <div className="absolute inset-0 flex items-end justify-center gap-1 pb-12 opacity-30">
        {[40, 70, 55, 90, 45, 80, 60, 75, 50, 85, 40, 65, 90, 55, 70, 45, 80].map((h, i) => (
          <div key={i} className="w-1 rounded-sm"
            style={{
              height: h * 0.6,
              background: accent,
              animation: `waveform ${0.6 + (i % 5) * 0.15}s ease-in-out infinite`,
              animationDelay: `${i * 0.07}s`,
            }} />
        ))}
      </div>
    );
  }
  return null;
}

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId>("film");
  const [prompt, setPrompt] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [featureTab, setFeatureTab] = useState<string>("film");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((s) => (s + 1) % SHOWCASE_ITEMS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const submit = () => {
    const m = MODES.find((x) => x.id === mode);
    if (!m) return;
    const href =
      prompt && mode !== "film"
        ? `${m.href}${m.href.includes("?") ? "&" : "?"}prompt=${encodeURIComponent(prompt)}`
        : m.href;
    router.push(href);
  };

  const VIDEO_MODELS = MODELS.filter((m) => m.type === "video" && !m.inputType);
  const IMAGE_MODELS = MODELS.filter((m) => m.type === "image");

  return (
    <div className="pb-24 bg-night min-h-screen">
      <Suspense fallback={null}><RefCapture /></Suspense>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="breakout -mt-8 relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden bg-night">

        {/* Animated floating blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{
            position: "absolute", top: "12%", left: "8%",
            width: 380, height: 380, borderRadius: "50%",
            background: "rgba(106,76,255,.13)", filter: "blur(90px)",
            animation: "float-blob 9s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute", top: "25%", right: "6%",
            width: 300, height: 300, borderRadius: "50%",
            background: "rgba(47,107,255,.10)", filter: "blur(80px)",
            animation: "float-blob 12s ease-in-out infinite reverse",
          }} />
          <div style={{
            position: "absolute", bottom: "18%", left: "28%",
            width: 240, height: 240, borderRadius: "50%",
            background: "rgba(43,228,255,.06)", filter: "blur(70px)",
            animation: "float-blob 15s ease-in-out infinite",
            animationDelay: "3s",
          }} />
        </div>

        {/* Volt-wash radial glow at top */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(100% 90% at 50% 0%, rgba(106,76,255,.5) 0%, rgba(106,76,255,0) 68%)" }}
        />
        {/* Arc accent bottom-right */}
        <div
          className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 opacity-15"
          style={{ background: "radial-gradient(circle at 100% 100%, #2F6BFF 0%, transparent 60%)" }}
        />

        <div className="relative z-10 w-full max-w-2xl mx-auto text-center space-y-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase px-5 py-2 rounded-pill text-mist"
            style={{ border: "1px solid rgba(106,76,255,.35)", background: "rgba(106,76,255,.08)", backdropFilter: "blur(8px)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-volt inline-block"
              style={{ boxShadow: "0 0 8px #6A4CFF" }} />
            AI Film &amp; Media Studio
          </div>

          {/* Headline */}
          <h1 className="font-display font-bold text-white-hot leading-tight tracking-tight"
            style={{ fontSize: "clamp(2.8rem, 7vw, 4.8rem)", lineHeight: 1.1 }}>
            Make anything.{" "}
            <span style={{
              background: "linear-gradient(100deg, #6A4CFF, #2F6BFF 55%, #A88FFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              AI-powered.
            </span>
          </h1>

          <p className="text-mist text-lg max-w-md mx-auto leading-relaxed">
            Films. Images. Videos. Voice. One platform, pay per creation.
          </p>

          {/* Mode tabs */}
          <div className="v-tabs !inline-flex">
            {MODES.map((m) => (
              <button key={m.id} role="tab" className="v-tab"
                aria-selected={mode === m.id} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Glowing prompt bar */}
          <div className="v-prompt text-left">
            <textarea
              rows={2}
              className="w-full bg-transparent border-0 outline-none resize-none text-white-hot placeholder:text-edge text-sm leading-relaxed"
              placeholder={
                mode === "film"  ? "Describe your film idea — genre, story, mood..." :
                mode === "image" ? "Describe the image you want to create..." :
                mode === "video" ? "What do you want to animate or generate as video?" :
                                   "Describe the audio or voiceover you need..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-edge">
                {mode === "film" ? "Start a guided film workflow →" : "Shift+Enter for new line"}
              </span>
              <button className="v-btn v-btn-primary" onClick={submit} style={{ minWidth: 120 }}>
                {mode === "film" ? "Start film →" : "Generate →"}
              </button>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="v-chip text-left cursor-pointer"
                style={{ fontSize: 11, maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                onClick={() => { setPrompt(s); setMode("film"); }}>
                {s}
              </button>
            ))}
          </div>

          <p className="text-xs text-edge tracking-widest uppercase">
            50 free credits on sign up · No credit card needed
          </p>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{ background: "linear-gradient(to top, #090B1A, transparent)" }} />
      </section>

      {/* ── SOCIAL PROOF STRIP ─────────────────────────────────────────── */}
      <div className="breakout py-6 px-4" style={{ borderTop: "1px solid #1E2140", background: "#090B1A" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { stat: "10+",    label: "AI models in one place" },
            { stat: "4",      label: "Creative formats" },
            { stat: "£0",     label: "No subscription needed" },
            { stat: "∞",      label: "Credits never expire" },
          ].map(({ stat, label }) => (
            <div key={label} className="text-center space-y-1">
              <p className="font-bold text-[#F2F6FF] text-2xl leading-none"
                style={{ fontFamily: "var(--font-poppins)" }}>{stat}</p>
              <p className="text-xs text-[#4A5280]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODEL MARQUEE ──────────────────────────────────────────────── */}
      <div className="breakout py-5 overflow-hidden"
        style={{ background: "#0D0F20", borderTop: "1px solid #1E2140", borderBottom: "1px solid #1E2140" }}>
        <div className="space-y-3">
          <MarqueeStrip items={MARQUEE_ROW_1} direction="left" />
          <MarqueeStrip items={MARQUEE_ROW_2} direction="right" />
        </div>
      </div>

      {/* ── SHOWCASE CAROUSEL ──────────────────────────────────────────── */}
      <section className="pt-20 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.18em] text-edge uppercase mb-3">Showcase</p>
            <h2 className="font-display font-bold text-white-hot tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              See what creators make
            </h2>
          </div>

          {/* Carousel */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: 320 }}>
            {SHOWCASE_ITEMS.map((item, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-700"
                style={{
                  opacity: i === activeSlide ? 1 : 0,
                  background: item.gradient,
                  pointerEvents: i === activeSlide ? "auto" : "none",
                }}
              >
                {/* Decorative visual element */}
                <ShowcaseVisual visual={item.visual} accent={item.accent} />

                {/* Top-right type tag */}
                <div className="absolute top-5 right-5">
                  <span
                    className="text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-pill"
                    style={{
                      background: `${item.accent}22`,
                      border: `1px solid ${item.accent}44`,
                      color: item.accent,
                    }}
                  >
                    {item.type}
                  </span>
                </div>

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 100%)" }}>
                  <p className="font-display font-bold text-white-hot text-xl">{item.title}</p>
                  <p className="text-sm mt-1" style={{ color: item.accent, opacity: 0.85 }}>{item.sub}</p>
                </div>

                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: `linear-gradient(90deg, transparent, ${item.accent}55, transparent)` }} />
              </div>
            ))}

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${((activeSlide + 1) / SHOWCASE_ITEMS.length) * 100}%`,
                  background: SHOWCASE_ITEMS[activeSlide].accent,
                }}
              />
            </div>
          </div>

          {/* Dot navigation */}
          <div className="flex justify-center gap-2 mt-5">
            {SHOWCASE_ITEMS.map((item, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className="rounded-pill transition-all duration-300"
                style={{
                  width: i === activeSlide ? 24 : 8,
                  height: 8,
                  background: i === activeSlide ? item.accent : "rgba(168,176,216,.25)",
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE TABS ───────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.18em] text-edge uppercase mb-3">What you can make</p>
            <h2 className="font-display font-bold text-white-hot tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              One platform for every format
            </h2>
          </div>

          {/* Tab row */}
          <div className="flex gap-1 p-1 rounded-xl mb-8 overflow-x-auto"
            style={{ background: "#0D0F20", border: "1px solid #1E2140" }}>
            {FEATURE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFeatureTab(tab.id)}
                className="flex-1 min-w-[72px] py-2 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={featureTab === tab.id ? {
                  background: tab.accentBg,
                  color: tab.accent,
                  border: `1px solid ${tab.accent}44`,
                } : {
                  color: "#4A5280",
                  border: "1px solid transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {FEATURE_TABS.map((tab) => (
            <div
              key={tab.id}
              style={{ display: featureTab === tab.id ? "block" : "none" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display font-bold text-white-hot text-xl mb-2">{tab.headline}</h3>
                  <p className="text-mist text-sm max-w-lg leading-relaxed">{tab.sub}</p>
                </div>
                <Link
                  href={tab.cta.href}
                  className="shrink-0 inline-block px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{
                    background: `linear-gradient(100deg, ${tab.accent}, ${tab.accent}cc)`,
                    color: "#F2F6FF",
                    textDecoration: "none",
                    boxShadow: `0 6px 24px ${tab.accent}33`,
                  }}
                >
                  {tab.cta.label}
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {tab.cards.map((card) => (
                  <Link
                    key={card.title}
                    href={tab.cta.href}
                    className="v-card flex flex-col gap-3 group"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: tab.accentBg, color: tab.accent, border: `1px solid ${tab.accent}33` }}>
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-semibold text-white-hot text-sm mb-1">{card.title}</p>
                      <p className="text-mist text-xs leading-relaxed">{card.desc}</p>
                    </div>
                    <span className="text-xs transition-colors mt-auto"
                      style={{ color: tab.accent, opacity: 0.7 }}>
                      Try it →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOOLS STRIP ────────────────────────────────────────────────── */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.18em] text-edge uppercase mb-4">
            Edit &amp; transform
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOOLS.map((tool) => (
              <Link key={tool.label} href={tool.href} className="v-card flex items-center gap-3 !p-3"
                style={{ textDecoration: "none" }}>
                <span className="text-base flex-shrink-0 font-bold"
                  style={{ color: "#6A4CFF", width: 20, textAlign: "center" }}>{tool.icon}</span>
                <span className="text-white-hot text-xs font-medium flex-1">{tool.label}</span>
                {tool.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-pill tracking-wider flex-shrink-0"
                    style={{ background: "rgba(106,76,255,.2)", color: "#A88FFF", border: "1px solid rgba(106,76,255,.3)" }}>
                    {tool.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ borderTop: "1px solid #1E2140", borderBottom: "1px solid #1E2140" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.18em] text-edge uppercase mb-3">How it works</p>
            <h2 className="font-display font-bold text-white-hot tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              Create in three steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { step: "01", title: "Describe your idea", desc: "Write a prompt — a scene, a story, a mood, a subject. As specific or as broad as you like." },
              { step: "02", title: "Pick your format",   desc: "Choose Film, Image, Video, or Audio. Pick from 10+ leading AI models all in one place." },
              { step: "03", title: "Download & share",   desc: "Your creation is ready in seconds. Download it, share the link, or keep refining." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="v-card p-7 space-y-3">
                <span className="font-display font-black text-5xl leading-none select-none block"
                  style={{ color: "rgba(106,76,255,.35)" }}>{step}</span>
                <h3 className="font-display font-semibold text-white-hot">{title}</h3>
                <p className="text-mist text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODELS ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.18em] text-edge uppercase mb-3">AI Models</p>
            <h2 className="font-display font-bold text-white-hot tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              The best models, one platform
            </h2>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-edge uppercase tracking-[0.15em]">Text to Video</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {VIDEO_MODELS.map((m) => (
                <div key={m.id} className="v-card flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white-hot text-sm">{m.name}</p>
                    <p className="text-mist text-xs mt-0.5">{m.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1.5">
                    <p className="font-bold text-white-hot text-sm">{m.credits} cr</p>
                    <p className="text-edge text-xs">{creditsToGBP(m.credits)}</p>
                    <Link href={`/studio?model=${m.id}`}
                      className="block text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                      style={{ background: "rgba(106,76,255,.15)", color: "#A88FFF", border: "1px solid rgba(106,76,255,.25)", textDecoration: "none" }}>
                      Create →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-edge uppercase tracking-[0.15em]">Image Generation</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {IMAGE_MODELS.map((m) => (
                <div key={m.id} className="v-card space-y-1 flex flex-col">
                  <p className="font-semibold text-white-hot text-sm">{m.name}</p>
                  <p className="text-mist text-xs flex-1">{m.description}</p>
                  <p className="font-bold text-white-hot text-xs pt-1">
                    {m.credits} cr{" "}
                    <span className="text-edge font-normal">{creditsToGBP(m.credits)}</span>
                  </p>
                  <Link href={`/create/image?model=${m.id}`}
                    className="block text-center text-xs font-semibold px-2 py-1.5 rounded-lg mt-2 transition-all"
                    style={{ background: "rgba(43,228,255,.08)", color: "#2BE4FF", border: "1px solid rgba(43,228,255,.2)", textDecoration: "none" }}>
                    Create →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ borderTop: "1px solid #1E2140" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.18em] text-edge uppercase mb-3">FAQ</p>
            <h2 className="font-display font-bold text-white-hot tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              Common questions
            </h2>
          </div>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="v-card overflow-hidden"
                style={{ padding: 0, border: openFaq === i ? "1px solid rgba(106,76,255,.4)" : undefined }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
                >
                  <span className="text-sm font-medium text-white-hot">{item.q}</span>
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: openFaq === i ? "rgba(106,76,255,.2)" : "rgba(255,255,255,.04)",
                      color: openFaq === i ? "#A88FFF" : "#4A5280",
                      transform: openFaq === i ? "rotate(45deg)" : "none",
                    }}>
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-mist leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4" id="pricing"
        style={{ borderTop: "1px solid #1E2140" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.18em] text-edge uppercase mb-3">Pricing</p>
            <h2 className="font-display font-bold text-white-hot tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>
              Buy credits once
            </h2>
            <p className="text-mist text-sm mt-2">They never expire. No monthly fees, no subscriptions.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {CREDIT_PACKS.map((pack, i) => {
              const isPopular = i === 1;
              return (
                <div key={pack.id} className="v-card p-7 relative"
                  style={isPopular ? {
                    border: "1px solid rgba(106,76,255,.5)",
                    boxShadow: "0 0 0 1px rgba(106,76,255,.12), 0 20px 60px rgba(106,76,255,.12)",
                  } : {}}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white-hot text-[10px] font-bold px-3 py-0.5 rounded-pill tracking-widest uppercase"
                      style={{ background: "linear-gradient(100deg, #6A4CFF, #2F6BFF)" }}>
                      Most popular
                    </div>
                  )}
                  <p className="text-mist text-xs mb-2">{pack.label}</p>
                  <p className="font-display font-bold text-white-hot tracking-tight text-3xl">
                    £{pack.priceGBP.toFixed(2)}
                  </p>
                  <ul className="mt-4 mb-5 space-y-2">
                    {[`${pack.credits} credits`, `~${Math.floor(pack.credits / 3)} quick images`, "Credits never expire"].map((item) => (
                      <li key={item} className="flex gap-2 items-center text-xs text-mist">
                        <span className="text-volt font-bold flex-shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/signin"
                    className={isPopular ? "v-btn v-btn-primary" : "v-btn v-btn-ghost"}
                    style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                    Get started
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-edge mt-6 tracking-widest uppercase">
            Secure payments via Stripe &amp; Paystack
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="pt-0 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="v-card relative overflow-hidden text-center py-20 px-8"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(106,76,255,.2) 0%, #121530 65%)" }}>
            {/* Top gradient rule */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(106,76,255,.55), transparent)" }} />

            {/* Background blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div style={{ position: "absolute", top: "30%", left: "15%", width: 200, height: 200, borderRadius: "50%", background: "rgba(106,76,255,.08)", filter: "blur(60px)", animation: "float-blob 10s ease-in-out infinite" }} />
              <div style={{ position: "absolute", top: "20%", right: "15%", width: 180, height: 180, borderRadius: "50%", background: "rgba(47,107,255,.07)", filter: "blur(55px)", animation: "float-blob 13s ease-in-out infinite reverse" }} />
            </div>

            <h2 className="relative font-display font-bold text-white-hot tracking-tight mb-4"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.2 }}>
              Ready to create<br />
              <span style={{
                background: "linear-gradient(100deg, #6A4CFF, #2F6BFF 55%, #A88FFF)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                something extraordinary?
              </span>
            </h2>

            <p className="relative text-mist text-sm max-w-sm mx-auto leading-relaxed mb-8">
              Sign in with your email — no password, no card required.
              Get 50 free credits instantly.
            </p>

            <Link href="/auth/signin" className="v-btn v-btn-primary relative"
              style={{ textDecoration: "none", fontSize: 15, padding: "14px 40px" }}>
              Start creating free →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

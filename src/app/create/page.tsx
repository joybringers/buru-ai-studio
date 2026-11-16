import Link from "next/link";
import { TEMPLATES } from "@/data/create-templates";
import { MODELS, creditsToGBP } from "@/config";

export const metadata = { title: "Quick Starts — BuruStudio" };

export default function QuickStartsPage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-14 space-y-12">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full tracking-[0.15em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Quick Starts
          </span>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-xs font-bold px-3 py-1 rounded-full tracking-[0.15em] uppercase transition-all"
          >
            Try Chat Mode →
          </Link>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-tight">
          What do you want to create?
        </h1>
        <p className="text-zinc-500 text-base max-w-xl">
          Pick a template, answer a few questions, and generate in seconds.
        </p>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => {
          const model = MODELS.find((m) => m.id === tpl.defaultModel);
          const isVideo = model?.type === "video";
          const isAudio = model?.type === "audio";

          return (
            <Link
              key={tpl.type}
              href={`/create/${tpl.type}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800 hover:border-zinc-600 transition-all duration-300 tile-scan"
            >
              {/* Gradient background */}
              <div
                className="absolute inset-0"
                style={{ background: tpl.tileGradient }}
              />
              {/* Scan sweep */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.065) 50%, transparent 100%)",
                  animation: "scan-sweep 7s linear infinite",
                }}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/55 group-hover:bg-black/45 transition-colors duration-300" />

              {/* Content */}
              <div className="relative z-10 p-6 flex flex-col min-h-[180px]">
                {/* Top: type badge */}
                <div className="flex items-center gap-2 mb-auto">
                  <span className={`w-2 h-2 rounded-full ${
                    isVideo ? "bg-violet-400" : isAudio ? "bg-rose-400" : "bg-indigo-400"
                  }`} />
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
                    {isVideo ? "Video" : isAudio ? "Audio" : "Image"}
                  </span>
                </div>

                {/* Title */}
                <div className="mt-6">
                  <h2 className="text-xl font-black tracking-tight text-white leading-tight">
                    {tpl.noun}
                  </h2>
                  <p className="text-sm text-white/45 mt-1 leading-snug">{tpl.subtitle}</p>
                </div>

                {/* Bottom: model + cost */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/8">
                  <span className="text-xs text-white/35 font-medium">{model?.name ?? tpl.defaultModel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white/70">{model?.credits ?? 0} cr</span>
                    <span className="text-xs text-white/25">{model ? creditsToGBP(model.credits) : ""}</span>
                  </div>
                </div>
              </div>

              {/* Hover arrow */}
              <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/60">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Chat mode CTA */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500 mb-1">Not sure where to start?</p>
          <h3 className="text-xl font-black text-white tracking-tight">Talk to the AI director</h3>
          <p className="text-zinc-500 text-sm mt-1">Describe your idea and I&apos;ll handle the rest.</p>
        </div>
        <Link
          href="/chat"
          className="shrink-0 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-wider uppercase transition-colors"
        >
          Open Chat Mode →
        </Link>
      </div>

    </div>
  );
}

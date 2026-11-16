"use client";
import { useState } from "react";
import Link from "next/link";
import { TEMPLATES, TemplateCategory } from "@/data/create-templates";
import { MODELS, creditsToGBP } from "@/config";

const TABS: { id: TemplateCategory; label: string }[] = [
  { id: "all",       label: "All" },
  { id: "marketing", label: "Marketing" },
  { id: "video",     label: "Video" },
  { id: "social",    label: "Social" },
  { id: "image",     label: "Image" },
];

export default function QuickStartsPage() {
  const [activeTab, setActiveTab] = useState<TemplateCategory>("all");

  const visible = activeTab === "all"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.categories.includes(activeTab));

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">Templates</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Pick a template, answer a few questions, and generate in seconds.
          </p>
        </div>
        <Link
          href="/chat"
          className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5c0 2.9-2.24 5.25-5 5.25a4.97 4.97 0 0 1-2.92-.95L1 11.5l.95-3.08A4.97 4.97 0 0 1 2 6.5C2 3.6 4.24 1.25 7 1.25s5 2.35 5 5.25Z"/>
          </svg>
          Try Chat Mode
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-white text-black"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((tpl, i) => {
          const model = MODELS.find((m) => m.id === tpl.defaultModel);
          const isVideo = model?.type === "video";
          const isAudio = model?.type === "audio";
          const typeLabel = isVideo ? "Video" : isAudio ? "Audio" : "Image";
          const typeColor = isVideo ? "bg-violet-500" : isAudio ? "bg-rose-500" : "bg-indigo-500";

          return (
            <Link
              key={tpl.type}
              href={`/create/${tpl.type}`}
              className="group relative overflow-hidden rounded-2xl aspect-video border border-zinc-800 hover:border-zinc-600 transition-all duration-300"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Video preview or animated gradient */}
              {tpl.exampleVideo ? (
                <video
                  src={tpl.exampleVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <AnimatedPreview gradient={tpl.tileGradient} />
              )}

              {/* Persistent bottom caption */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-4 px-4">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">{tpl.noun}</p>
                    <p className="text-white/50 text-xs mt-0.5 leading-snug line-clamp-1">{tpl.subtitle}</p>
                  </div>
                  {model && (
                    <div className="shrink-0 text-right">
                      <p className="text-white font-black text-sm">{model.credits} cr</p>
                      <p className="text-white/40 text-[10px]">{creditsToGBP(model.credits)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${typeColor}`} />
                <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/50 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                  {typeLabel}
                </span>
              </div>

              {/* Hover overlay — "Create now" */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                <div className="bg-white text-black font-bold text-sm px-5 py-2.5 rounded-xl shadow-2xl translate-y-1 group-hover:translate-y-0 transition-transform duration-200">
                  Create now →
                </div>
              </div>

              {/* Hover border highlight */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-white/10 rounded-2xl transition-all duration-300 pointer-events-none" />
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="text-center py-16 text-zinc-600 text-sm">
          No templates in this category yet.
        </div>
      )}

      {/* Chat CTA */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-500">Not sure where to start?</p>
          <h3 className="text-lg font-black text-white tracking-tight">Talk to the AI director</h3>
          <p className="text-zinc-500 text-sm">Describe your idea in plain words — Buru handles the rest.</p>
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

// ── Animated gradient preview (shown when no exampleVideo is set) ─────────────

function AnimatedPreview({ gradient }: { gradient: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Drifting gradient layer */}
      <div
        className="absolute inset-[-8%] animate-camera-drift"
        style={{ background: gradient }}
      />

      {/* Light leak */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 25% 35%, rgba(255,255,255,0.18) 0%, transparent 55%)",
          animation: "light-leak 7s ease-in-out infinite",
        }}
      />

      {/* Scan sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.055) 50%, transparent 100%)",
          animation: "scan-sweep 8s linear infinite",
        }}
      />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Subtle dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}

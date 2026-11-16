"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MODELS } from "@/config";
import type { GalleryAsset } from "@/types/gallery";
import AssetDrawer from "@/components/AssetDrawer";

type Filter = "all" | "image" | "video" | "audio";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all",   label: "All" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "audio", label: "Audio" },
];

interface Props { assets: GalleryAsset[] }

export default function GalleryClient({ assets }: Props) {
  const [filter, setFilter]   = useState<Filter>("all");
  const [selected, setSelected] = useState<GalleryAsset | null>(null);

  const visible = assets.filter((a) => {
    if (filter === "all")   return true;
    if (filter === "image") return a.mimeType.startsWith("image/");
    if (filter === "video") return a.mimeType.startsWith("video/");
    if (filter === "audio") return a.mimeType.startsWith("audio/");
    return true;
  });

  return (
    <>
      <div className="max-w-6xl mx-auto px-5 py-10 space-y-7">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Your Gallery</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {assets.length} {assets.length === 1 ? "creation" : "creations"} saved
            </p>
          </div>
          <Link
            href="/studio"
            className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 1v12M1 7h12" />
            </svg>
            New creation
          </Link>
        </div>

        {/* Filter tabs */}
        {assets.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTERS.map((f) => {
              const count = f.id === "all" ? assets.length
                : assets.filter((a) => a.mimeType.startsWith(f.id + "/")).length;
              if (f.id !== "all" && count === 0) return null;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    filter === f.id
                      ? "bg-white text-black"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                  }`}
                >
                  {f.label}
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${filter === f.id ? "bg-black/15 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grid */}
        {visible.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visible.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onClick={() => setSelected(asset)} />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="text-center py-16 text-zinc-600 text-sm">
            No {filter}s yet.
          </div>
        )}
      </div>

      <AssetDrawer asset={selected} onClose={() => setSelected(null)} />
    </>
  );
}

// ── Asset card ──────────────────────────────────────────────────────────────

function AssetCard({ asset, onClick }: { asset: GalleryAsset; onClick: () => void }) {
  const model   = MODELS.find((m) => m.id === asset.job.modelId);
  const isVideo = asset.mimeType.startsWith("video/");
  const isAudio = asset.mimeType.startsWith("audio/");
  const typeColor = isVideo ? "bg-violet-500" : isAudio ? "bg-rose-500" : "bg-indigo-500";
  const typeLabel = isVideo ? "Video" : isAudio ? "Audio" : "Image";

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl aspect-square border border-zinc-800 hover:border-zinc-600 transition-all duration-300 bg-zinc-900 text-left"
    >
      {/* Thumbnail */}
      {isVideo ? (
        <video
          src={asset.url}
          muted
          loop
          playsInline
          onMouseEnter={(e) => e.currentTarget.play()}
          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : isAudio ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: "linear-gradient(145deg,#1e1b4b,#3730a3)" }}>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div className="flex items-end gap-0.5 h-6">
            {[3,5,7,5,3,6,4].map((h,i) => (
              <div key={i} className="w-1 rounded-full bg-white/40 group-hover:bg-indigo-400 transition-all"
                style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      ) : (
        <Image
          src={asset.url}
          alt={asset.job.prompt}
          fill
          className="object-cover"
          unoptimized
        />
      )}

      {/* Top badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
        <span className={`w-1.5 h-1.5 rounded-full ${typeColor}`} />
        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/60 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          {typeLabel}
        </span>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-end p-3 z-10">
        <p className="text-xs text-zinc-200 font-medium line-clamp-2 leading-snug">{asset.job.prompt}</p>
        <p className="text-[10px] text-zinc-500 mt-1">{model?.name ?? asset.job.modelId}</p>
      </div>

      {/* Hover border */}
      <div className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-white/10 rounded-2xl transition-all duration-300 pointer-events-none z-20" />
    </button>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 border-dashed p-16 text-center">
      {/* Subtle gradient bg */}
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, #4f46e520 0%, transparent 70%)" }} />
      <div className="relative space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-zinc-500">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 15-5-5L5 21" />
          </svg>
        </div>
        <div>
          <p className="text-zinc-200 font-bold">Nothing here yet</p>
          <p className="text-zinc-600 text-sm mt-1">Your generated images and videos will appear here.</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/studio"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors">
            Open Studio →
          </Link>
          <Link href="/create"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            Browse templates
          </Link>
        </div>
      </div>
    </div>
  );
}

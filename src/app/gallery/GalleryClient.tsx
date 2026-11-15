"use client";
import { useState } from "react";
import Image from "next/image";
import { MODELS } from "@/config";
import type { GalleryAsset } from "@/types/gallery";
import AssetDrawer from "@/components/AssetDrawer";

interface Props {
  assets: GalleryAsset[];
}

export default function GalleryClient({ assets }: Props) {
  const [selected, setSelected] = useState<GalleryAsset | null>(null);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Gallery</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {assets.length} {assets.length === 1 ? "asset" : "assets"}
          </p>
        </div>

        {assets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {assets.map((asset) => {
              const model = MODELS.find((m) => m.id === asset.job.modelId);
              const isVideo = asset.mimeType.startsWith("video/");
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelected(asset)}
                  className="group rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all text-left bg-zinc-900"
                >
                  <div className="aspect-video relative bg-zinc-800">
                    {isVideo ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white ml-0.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
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
                    <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      AI-generated
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-medium text-zinc-400">
                      {model?.name ?? asset.job.modelId}
                    </p>
                    <p className="text-xs text-zinc-600 line-clamp-2">
                      {asset.job.prompt}
                    </p>
                    <p className="text-xs text-zinc-700">
                      {new Date(asset.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <AssetDrawer asset={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-zinc-800 border-dashed p-16 text-center">
      <p className="text-zinc-500 text-sm">No assets yet.</p>
      <p className="text-zinc-600 text-xs mt-1">
        Generate your first image in the Studio.
      </p>
    </div>
  );
}

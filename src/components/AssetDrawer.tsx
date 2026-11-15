"use client";
import Image from "next/image";
import { MODELS } from "@/config";
import type { GalleryAsset } from "@/types/gallery";

interface Props {
  asset: GalleryAsset | null;
  onClose: () => void;
}

export default function AssetDrawer({ asset, onClose }: Props) {
  if (!asset) return null;

  const model = MODELS.find((m) => m.id === asset.job.modelId);
  const isVideo = asset.mimeType.startsWith("video/");
  const date = new Date(asset.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="fixed right-0 top-0 h-full w-96 bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Asset details</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 -mr-1 rounded"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="aspect-video rounded-xl overflow-hidden relative bg-zinc-800">
            {isVideo ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white ml-0.5"
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
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              AI-generated
            </div>
          </div>

          <dl className="space-y-4">
            <DrawerField label="Prompt" value={asset.job.prompt} />
            <DrawerField
              label="Model"
              value={`${model?.name ?? asset.job.modelId}${model ? ` · ${model.provider}` : ""}`}
            />
            <DrawerField
              label="Type"
              value={isVideo ? "Video · 5-second clip" : "Image"}
            />
            <DrawerField label="Date" value={date} />
            {model && (
              <DrawerField
                label="Credits charged"
                value={`${model.credits} cr`}
              />
            )}
          </dl>

          <a
            href={asset.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors text-center"
          >
            Download
          </a>
        </div>
      </aside>
    </>
  );
}

function DrawerField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-sm text-zinc-200">{value}</dd>
    </div>
  );
}

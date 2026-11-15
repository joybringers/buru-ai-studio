"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  MODELS,
  creditsToGBP,
  Model,
} from "@/config";
import { BLOCKED_TERMS } from "@/data/fake";
import { useUser } from "@/context/UserContext";

type Phase = "idle" | "generating" | "done" | "error";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 120_000; // 2 minutes

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export default function StudioPage() {
  const { balance, refreshBalance } = useUser();
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState("flux-schnell");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [topUpMsg, setTopUpMsg] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const topup = searchParams.get("topup");
    if (topup === "success") {
      refreshBalance();
      setTopUpMsg("Credits added to your account!");
      router.replace("/studio");
      setTimeout(() => setTopUpMsg(null), 4000);
    } else if (topup === "cancelled") {
      router.replace("/studio");
    }
  }, [searchParams, refreshBalance, router]);

  const selectedModel = MODELS.find((m) => m.id === modelId) ?? IMAGE_MODELS[0];
  const isVideoModel = selectedModel.type === "video";
  const blockedTerm = BLOCKED_TERMS.find((t) =>
    prompt.toLowerCase().includes(t.toLowerCase())
  );
  const insufficientBalance = balance < selectedModel.credits;
  const canGenerate =
    !blockedTerm &&
    !insufficientBalance &&
    prompt.trim().length > 0 &&
    phase === "idle";

  async function handleGenerate() {
    setPhase("generating");
    setErrorMsg(null);
    setResultUrl(null);

    // 1. Submit generation job.
    let jobId: string;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), modelId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorMsg(body.error ?? "Generation failed");
        setPhase("error");
        return;
      }
      jobId = body.jobId;
    } catch {
      setErrorMsg("Network error — please try again");
      setPhase("error");
      return;
    }

    // 2. Poll until done, failed, or timeout.
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const status = await res.json();
        if (status.status === "done") {
          setResultUrl(status.resultUrl);
          setPhase("done");
          await refreshBalance();
          return;
        }
        if (status.status === "failed") {
          setErrorMsg(status.errorMessage ?? "Generation failed");
          setPhase("error");
          await refreshBalance(); // credits may have been refunded
          return;
        }
      } catch {
        // transient fetch error — keep polling
      }
    }

    setErrorMsg("Timed out waiting for result. Check your gallery in a moment.");
    setPhase("error");
  }

  function handleStartOver() {
    setPhase("idle");
    setResultUrl(null);
    setErrorMsg(null);
  }

  return (
    <div className="max-w-2xl space-y-8">
      {topUpMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-xl">
          {topUpMsg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Studio</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Generate images and videos for your brand.
        </p>
      </div>

      {/* ── idle / error: input form ── */}
      {(phase === "idle" || phase === "error") && (
        <>
          <section className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your image — e.g. 'Bold typographic poster for a streetwear drop, neon pink on black'"
              rows={4}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 p-4 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {blockedTerm && (
              <div className="rounded-lg bg-red-950/60 border border-red-800 px-4 py-3 text-sm text-red-300">
                <span className="font-medium">Prompt blocked.</span> This tool
                cannot generate likenesses of{" "}
                <span className="font-medium capitalize">{blockedTerm}</span> —
                a known character or real person.
              </div>
            )}
            {errorMsg && (
              <div className="rounded-lg bg-red-950/60 border border-red-800 px-4 py-3 text-sm text-red-300">
                {errorMsg}
              </div>
            )}
          </section>

          {/* Model selector */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Image model
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {IMAGE_MODELS.map((m) => (
                <ModelCard
                  key={m.id}
                  model={m}
                  selected={modelId === m.id}
                  onSelect={() => setModelId(m.id)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Video model
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_MODELS.map((m) => (
                <ModelCard
                  key={m.id}
                  model={m}
                  selected={modelId === m.id}
                  onSelect={() => setModelId(m.id)}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-600">
              Generates a 5-second clip. Takes ~60 seconds.
            </p>
          </section>

          {/* Generate button */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-zinc-200 font-medium">
                {selectedModel.name}
              </p>
              <div className="text-right">
                <span className="text-xl font-semibold text-zinc-100">
                  {selectedModel.credits} cr
                </span>
                <span className="text-xs text-zinc-500 ml-1.5">
                  {creditsToGBP(selectedModel.credits)}
                </span>
              </div>
            </div>
            {insufficientBalance && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2">
                You need {selectedModel.credits} cr but only have {balance} cr.
                Top up to continue.
              </p>
            )}
            <button
              disabled={!canGenerate}
              onClick={handleGenerate}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                canGenerate
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              {isVideoModel ? "Generate video" : "Generate image"}
            </button>
          </section>

        </>
      )}

      {/* ── generating: spinner ── */}
      {phase === "generating" && (
        <section className="space-y-4">
          <p className="text-sm text-zinc-400 animate-pulse">
            Generating on {selectedModel.name}…
          </p>
          <div className="aspect-video rounded-xl bg-zinc-800 animate-pulse" />
          <p className="text-xs text-zinc-600">
            {isVideoModel ? "Video generation takes ~60 seconds." : "This usually takes 5–30 seconds."}
          </p>
        </section>
      )}

      {/* ── done: result ── */}
      {phase === "done" && resultUrl && (
        <section className="space-y-4">
          <div className="aspect-video rounded-xl overflow-hidden relative bg-zinc-800">
            {isVideoModel ? (
              <video
                src={resultUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-cover"
              />
            ) : (
              <Image
                src={resultUrl}
                alt={prompt}
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

          <div className="flex items-start justify-between gap-4">
            <dl className="text-xs text-zinc-500 space-y-1 min-w-0">
              <div>
                <dt className="inline text-zinc-400">Model: </dt>
                <dd className="inline">
                  {selectedModel.name} · {selectedModel.provider}
                </dd>
              </div>
              <div className="truncate">
                <dt className="inline text-zinc-400">Prompt: </dt>
                <dd className="inline">{prompt}</dd>
              </div>
            </dl>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleStartOver}
                className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-600 whitespace-nowrap"
              >
                Generate again
              </button>
              <a
                href="/gallery"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg border border-indigo-900 hover:border-indigo-700 whitespace-nowrap"
              >
                Gallery
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ModelCard({
  model,
  selected,
  onSelect,
  disabled,
}: {
  model: Model;
  selected: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`rounded-lg border p-3 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-zinc-800 bg-zinc-900"
          : selected
          ? "border-indigo-500 ring-1 ring-indigo-500/30 bg-zinc-900"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
      }`}
    >
      <p className="text-xs font-medium text-zinc-300 leading-tight">
        {model.name}
      </p>
      <p className="text-xs text-zinc-600 mt-1">{model.description}</p>
      <p className="text-sm font-semibold text-zinc-100 mt-2">
        {model.credits} cr
        <span className="text-xs font-normal text-zinc-500 ml-1">
          {creditsToGBP(model.credits)}
        </span>
      </p>
    </button>
  );
}

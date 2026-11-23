"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  AUDIO_MODELS,
  MODELS,
  creditsToGBP,
  Model,
} from "@/config";
import { BLOCKED_TERMS } from "@/data/fake";
import { PROMPT_SUGGESTIONS } from "@/data/prompt-suggestions";
import { useUser } from "@/context/UserContext";

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const ASPECT_RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: "1:1",  label: "1:1",  w: 1,  h: 1  },
  { id: "16:9", label: "16:9", w: 16, h: 9  },
  { id: "9:16", label: "9:16", w: 9,  h: 16 },
  { id: "4:3",  label: "4:3",  w: 4,  h: 3  },
  { id: "3:4",  label: "3:4",  w: 3,  h: 4  },
];

interface HistoryItem {
  id: string;
  url: string;
  mimeType: string;
  createdAt: string;
  job: { prompt: string; modelId: string };
}

// ── Suspense wrappers for useSearchParams ─────────────────────────────────────

function TopUpHandler({
  refreshBalance,
  onMessage,
}: {
  refreshBalance: () => Promise<void>;
  onMessage: (msg: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const topup = searchParams.get("topup");
    if (topup === "success") {
      refreshBalance();
      onMessage("Credits added to your account!");
      router.replace("/studio");
      setTimeout(() => onMessage(null), 4000);
    } else if (topup === "cancelled") {
      router.replace("/studio");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function DirectorParamHandler({
  setPrompt, setModelId, setAspectRatio,
}: {
  setPrompt: (p: string) => void;
  setModelId: (m: string) => void;
  setAspectRatio: (r: AspectRatio) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const p = searchParams.get("prompt");
    const m = searchParams.get("model");
    const r = searchParams.get("ratio");
    if (p) setPrompt(decodeURIComponent(p));
    if (m) setModelId(m);
    if (r && ASPECT_RATIOS.some((ar) => ar.id === r)) setAspectRatio(r as AspectRatio);
    if (p || m || r) router.replace("/studio");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ReferralHandler({ onMessage }: { onMessage: (msg: string | null) => void }) {
  useEffect(() => {
    const ref = localStorage.getItem("buru_ref");
    if (!ref) return;
    fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrerId: ref }),
    })
      .then((r) => r.json())
      .then((data) => {
        localStorage.removeItem("buru_ref");
        if (data.ok) {
          onMessage(`You earned ${data.credits} bonus credits from a referral!`);
          setTimeout(() => onMessage(null), 5000);
        }
      })
      .catch(() => localStorage.removeItem("buru_ref"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

const CAMERA_MOVES: { id: string; label: string; text: string }[] = [
  { id: "tracking",   label: "Tracking",   text: "smooth side tracking shot" },
  { id: "dolly-in",   label: "Dolly In",   text: "slow cinematic dolly push-in" },
  { id: "dolly-out",  label: "Dolly Out",  text: "slow cinematic dolly pull-back" },
  { id: "orbit",      label: "Orbit 360",  text: "smooth 360-degree orbit around the subject" },
  { id: "crane",      label: "Crane",      text: "sweeping crane shot ascending" },
  { id: "drone",      label: "Drone",      text: "aerial drone fly-through" },
  { id: "steadicam",  label: "Steadicam",  text: "floating Steadicam follow shot" },
  { id: "slow-zoom",  label: "Slow Zoom",  text: "slow gradual zoom in" },
  { id: "dutch-tilt", label: "Dutch Tilt", text: "dramatic Dutch tilt angle" },
  { id: "whip-pan",   label: "Whip Pan",   text: "fast cinematic whip pan" },
];

type Phase = "idle" | "uploading" | "generating" | "done" | "error";

const POLL_INTERVAL_MS = 2500;
const IMAGE_POLL_TIMEOUT_MS = 120_000;
const VIDEO_POLL_TIMEOUT_MS = 900_000; // 15 min — fal.ai webhook handles it if browser gives up

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://buruai.elmorilx.com";

export default function StudioPage() {
  const { balance, refreshBalance } = useUser();
  const { data: session } = useSession();

  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState("flux-schnell");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [topUpMsg, setTopUpMsg] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);
  const [suggestions, setSuggestions] = useState(() =>
    [...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4)
  );

  // Video duration + quality
  const [videoDuration, setVideoDuration] = useState<"5" | "10">("5");
  const [videoQuality, setVideoQuality] = useState<"standard" | "pro">("standard");
  // Image quality tier
  const [imageQuality, setImageQuality] = useState<"draft" | "standard" | "cinema">("standard");

  // Camera + enhance state
  const [selectedCameraMove, setSelectedCameraMove] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  // Reference image (character/style reference for T2V + image models)
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [localReferencePreview, setLocalReferencePreview] = useState<string | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // Image-to-video state
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve effective model ID: quality toggle switches between standard and pro Kling
  const effectiveModelId = (() => {
    if (modelId === "kling-t2v" && videoQuality === "pro") return "kling-t2v-pro";
    if (modelId === "kling-t2v-pro" && videoQuality === "standard") return "kling-t2v";
    if (modelId === "kling-i2v" && videoQuality === "pro") return "kling-i2v-pro";
    if (modelId === "kling-i2v-pro" && videoQuality === "standard") return "kling-i2v";
    return modelId;
  })();

  const selectedModel = MODELS.find((m) => m.id === effectiveModelId) ?? IMAGE_MODELS[0];
  const isVideoModel = selectedModel.type === "video";
  const isAudioModel = selectedModel.type === "audio";
  const isI2V = selectedModel.inputType === "image";
  const isT2V = isVideoModel && !isI2V;
  const isKling = effectiveModelId.startsWith("kling");
  const displayCredits = isKling ? (videoDuration === "10" ? selectedModel.credits * 2 : selectedModel.credits) : selectedModel.credits;

  const cameraText = selectedCameraMove ? CAMERA_MOVES.find((m) => m.id === selectedCameraMove)?.text ?? "" : "";
  const finalPrompt = prompt.trim() + (cameraText ? `, ${cameraText}` : "");

  // Clear uploaded image when switching away from I2V models
  useEffect(() => {
    if (!isI2V) {
      setUploadedImageUrl(null);
      setLocalImagePreview(null);
    }
  }, [isI2V]);

  // Clear camera move when switching to non-video model
  useEffect(() => {
    if (!isVideoModel) setSelectedCameraMove(null);
  }, [isVideoModel]);

  const referralLink = session?.user?.id ? `${APP_URL}/?ref=${session.user.id}` : null;

  const blockedTerm = BLOCKED_TERMS.find((t) => prompt.toLowerCase().includes(t.toLowerCase()));
  const insufficientBalance = balance < displayCredits;
  const canGenerate =
    !blockedTerm &&
    !insufficientBalance &&
    prompt.trim().length > 0 &&
    phase === "idle" &&
    (!isI2V || !!uploadedImageUrl);

  // Elapsed timer
  useEffect(() => {
    if (phase !== "generating") { setElapsed(0); return; }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // History
  useEffect(() => {
    fetch("/api/studio/history")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setHistory(data); })
      .catch(() => {});
  }, [phase]);

  // ── Image upload ────────────────────────────────────────────────────────────

  async function handleImageFile(file: File) {
    setPhase("uploading");
    setErrorMsg(null);

    // Local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setLocalImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Upload failed"); setPhase("error"); return; }
      setUploadedImageUrl(data.url);
      setPhase("idle");
    } catch {
      setErrorMsg("Upload failed — please try again");
      setPhase("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleImageFile(file);
  }

  async function handleReferenceFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => setLocalReferencePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) setReferenceImageUrl(data.url);
    } catch {}
  }

  async function handleEnhancePrompt() {
    if (!prompt.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          modelType: selectedModel.type,
          referenceImageUrl: referenceImageUrl ?? undefined,
        }),
      });
      const data = await res.json();
      if (data.enhanced) setPrompt(data.enhanced);
    } catch {}
    setEnhancing(false);
  }

  // ── Generation ──────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setPhase("generating");
    setErrorMsg(null);
    setResultUrl(null);
    setPreviewItem(null);

    let jobId: string;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt || "animate naturally",
          modelId: effectiveModelId,
          aspectRatio,
          ...(isI2V && uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
          ...(isKling ? { duration: videoDuration } : {}),
          ...(!isVideoModel && !isAudioModel ? { imageQuality } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) { setErrorMsg(body.error ?? "Generation failed"); setPhase("error"); return; }
      jobId = body.jobId;
    } catch {
      setErrorMsg("Network error — please try again");
      setPhase("error");
      return;
    }

    const timeout = isVideoModel ? VIDEO_POLL_TIMEOUT_MS : IMAGE_POLL_TIMEOUT_MS; // audio uses image timeout
    const deadline = Date.now() + timeout;
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
          await refreshBalance();
          return;
        }
      } catch { /* keep polling */ }
    }
    setErrorMsg("Timed out. Check your gallery in a moment.");
    setPhase("error");
  }

  function handleStartOver() {
    setPhase("idle");
    setResultUrl(null);
    setErrorMsg(null);
    if (isI2V) { setUploadedImageUrl(null); setLocalImagePreview(null); }
  }

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const T2V_MODELS = VIDEO_MODELS.filter((m) => !m.inputType);
  const I2V_MODELS = VIDEO_MODELS.filter((m) => m.inputType === "image");

  return (
    <div className="min-h-screen flex flex-col gap-6 px-6 md:px-8 py-6">
      <Suspense fallback={null}>
        <TopUpHandler refreshBalance={refreshBalance} onMessage={setTopUpMsg} />
      </Suspense>
      <Suspense fallback={null}>
        <DirectorParamHandler
          setPrompt={setPrompt}
          setModelId={setModelId}
          setAspectRatio={setAspectRatio}
        />
      </Suspense>
      <ReferralHandler onMessage={setTopUpMsg} />

      {topUpMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-2.5 rounded-xl">
          {topUpMsg}
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-6 flex-1 lg:flex-row flex-col">

        {/* ── LEFT: controls ─────────────────────────────────────────────── */}
        <div className="lg:w-[400px] shrink-0 space-y-5">

          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Studio</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Generate images, video &amp; audio</p>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isI2V
                  ? "Describe the motion — e.g. 'camera slowly zooms in, leaves blow in wind' (optional)"
                  : "Describe what you want to create…"}
                rows={isI2V ? 3 : 4}
                disabled={phase === "generating" || phase === "uploading"}
                className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 p-4 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 pb-11"
              />
              {/* Enhance Prompt button — inline in textarea bottom bar */}
              {prompt.trim() && phase === "idle" && (
                <button
                  onClick={handleEnhancePrompt}
                  disabled={enhancing}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 transition-all disabled:opacity-60"
                >
                  {enhancing ? (
                    <>
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Enhancing…
                    </>
                  ) : (
                    <>✦ Enhance</>
                  )}
                </button>
              )}
            </div>
            {/* Suggestions — only for image/T2V when empty */}
            {!prompt && !isI2V && phase === "idle" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">Try a prompt</span>
                  <button onClick={() => setSuggestions([...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4))}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">↻ More</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => setPrompt(s)}
                      className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors text-left">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {blockedTerm && (
              <div className="rounded-lg bg-red-950/60 border border-red-800 px-3 py-2.5 text-xs text-red-300">
                <span className="font-medium">Prompt blocked.</span> Cannot generate likenesses of{" "}
                <span className="font-medium capitalize">{blockedTerm}</span>.
              </div>
            )}
          </div>

          {/* Camera movement chips — video models only */}
          {isVideoModel && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Camera movement</p>
              <div className="flex flex-wrap gap-1.5">
                {CAMERA_MOVES.map((move) => (
                  <button key={move.id}
                    onClick={() => setSelectedCameraMove(selectedCameraMove === move.id ? null : move.id)}
                    disabled={phase === "generating"}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                      selectedCameraMove === move.id
                        ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                    }`}>
                    {move.label}
                  </button>
                ))}
              </div>
              {selectedCameraMove && (
                <p className="text-xs text-zinc-600 italic">{cameraText}</p>
              )}
            </div>
          )}

          {/* I2V upload zone */}
          {isI2V && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Source image</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />

              {localImagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localImagePreview} alt="Source" className="w-full h-40 object-cover" />
                  {phase === "uploading" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-xs text-zinc-300 animate-pulse">Uploading…</span>
                    </div>
                  )}
                  {phase !== "uploading" && (
                    <button onClick={() => { setUploadedImageUrl(null); setLocalImagePreview(null); }}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2 py-1 rounded-lg transition-colors">
                      Change
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 hover:border-indigo-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors space-y-2"
                >
                  <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-400">Drop image here or click to browse</p>
                  <p className="text-xs text-zinc-600">JPEG, PNG, WebP · max 10 MB</p>
                </div>
              )}

              {/* Use from gallery */}
              {history.filter((h) => !h.mimeType.startsWith("video")).length > 0 && !localImagePreview && (
                <div className="space-y-1.5">
                  <p className="text-xs text-zinc-600">Or pick from your gallery:</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {history.filter((h) => !h.mimeType.startsWith("video")).slice(0, 8).map((item) => (
                      <button key={item.id}
                        onClick={() => {
                          setUploadedImageUrl(item.url);
                          setLocalImagePreview(item.url);
                        }}
                        className="shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-zinc-800 hover:border-indigo-500/60 relative transition-all">
                        <Image src={item.url} alt={item.job.prompt} fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reference image — character/style reference for image + T2V */}
          {!isI2V && !isAudioModel && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Reference image <span className="normal-case font-normal text-zinc-700">(optional)</span></p>
                {localReferencePreview && (
                  <button onClick={() => { setReferenceImageUrl(null); setLocalReferencePreview(null); }}
                    className="text-xs text-zinc-600 hover:text-red-400 transition-colors">Remove</button>
                )}
              </div>
              <input ref={referenceInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReferenceFile(f); }} />
              {localReferencePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 h-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localReferencePreview} alt="Reference" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-end p-2">
                    <span className="text-xs text-zinc-300 bg-black/60 px-2 py-0.5 rounded">Claude will describe this character in your prompt</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => referenceInputRef.current?.click()}
                  className="w-full flex items-center gap-3 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                  Upload character or style reference
                </button>
              )}
            </div>
          )}

          {/* Aspect ratio (image + T2V Kling only, not audio) */}
          {!isI2V && !isAudioModel && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                {isT2V ? "Aspect ratio" : "Aspect ratio"}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {(isT2V ? ASPECT_RATIOS.filter((r) => ["16:9","9:16","1:1"].includes(r.id)) : ASPECT_RATIOS).map((ar) => (
                  <button key={ar.id} onClick={() => setAspectRatio(ar.id)}
                    disabled={phase === "generating"}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border text-xs transition-all disabled:opacity-50 ${
                      aspectRatio === ar.id
                        ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}>
                    <span className={`border rounded-sm ${aspectRatio === ar.id ? "border-indigo-400" : "border-zinc-600"}`}
                      style={{ width: `${Math.round(14 * ar.w / Math.max(ar.w, ar.h))}px`, height: `${Math.round(14 * ar.h / Math.max(ar.w, ar.h))}px`, display: "inline-block" }} />
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Model selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Image</p>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_MODELS.map((m) => (
                <ModelCard key={m.id} model={m} selected={modelId === m.id}
                  onSelect={() => setModelId(m.id)} disabled={phase === "generating"} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Text → Video</p>
            <div className="grid grid-cols-2 gap-2">
              {T2V_MODELS.filter((m) => !m.id.endsWith("-pro")).map((m) => (
                <ModelCard key={m.id} model={m} selected={["kling-t2v","kling-t2v-pro"].includes(modelId) ? m.id === "kling-t2v" : modelId === m.id}
                  onSelect={() => setModelId(m.id)} disabled={phase === "generating"} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Image → Video</p>
            <div className="grid grid-cols-2 gap-2">
              {I2V_MODELS.filter((m) => !m.id.endsWith("-pro")).map((m) => (
                <ModelCard key={m.id} model={m} selected={["kling-i2v","kling-i2v-pro"].includes(modelId) ? m.id === "kling-i2v" : modelId === m.id}
                  onSelect={() => setModelId(m.id)} disabled={phase === "generating"} />
              ))}
            </div>
            <p className="text-xs text-zinc-700">Upload any image · generates a 5-second animated clip · ~3–5 min</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Audio</p>
            <div className="grid grid-cols-2 gap-2">
              {AUDIO_MODELS.map((m) => (
                <ModelCard key={m.id} model={m} selected={modelId === m.id}
                  onSelect={() => setModelId(m.id)} disabled={phase === "generating"} />
              ))}
            </div>
            <p className="text-xs text-zinc-700">Describe music or a sound effect · generates 30-second audio</p>
          </div>

          {/* Quality selector — image models */}
          {!isVideoModel && !isAudioModel && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Quality</p>
              <div className="flex gap-2">
                {([
                  { id: "draft",    label: "Draft",    sub: "fast" },
                  { id: "standard", label: "Standard", sub: "default" },
                  { id: "cinema",   label: "Cinema",   sub: "best" },
                ] as const).map(({ id, label, sub }) => (
                  <button key={id}
                    onClick={() => setImageQuality(id)}
                    disabled={phase === "generating"}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 flex flex-col items-center gap-0.5 ${
                      imageQuality === id
                        ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                        : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}>
                    <span>{label}</span>
                    <span className="text-[10px] opacity-60">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration + Quality controls — Kling video models only */}
          {isKling && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Duration</p>
                <div className="flex gap-2">
                  {(["5", "10"] as const).map((d) => (
                    <button key={d}
                      onClick={() => setVideoDuration(d)}
                      disabled={phase === "generating"}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 ${
                        videoDuration === d
                          ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                          : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}>
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Quality</p>
                <div className="flex gap-2">
                  {([
                    { id: "standard", label: "720p Standard" },
                    { id: "pro",      label: "1080p Cinema"  },
                  ] as const).map(({ id, label }) => (
                    <button key={id}
                      onClick={() => setVideoQuality(id)}
                      disabled={phase === "generating"}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 ${
                        videoQuality === id
                          ? "border-indigo-500 bg-indigo-950/30 text-indigo-300"
                          : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-300">{selectedModel.name}</span>
              <span className="text-sm font-semibold text-zinc-100">
                {displayCredits} cr
                <span className="text-xs font-normal text-zinc-500 ml-1">{creditsToGBP(displayCredits)}</span>
              </span>
            </div>
            {isI2V && !uploadedImageUrl && phase === "idle" && (
              <p className="text-xs text-zinc-600">Upload a source image to enable generation</p>
            )}
            {insufficientBalance && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2">
                Need {displayCredits} cr · you have {balance} cr
              </p>
            )}
            <button disabled={!canGenerate} onClick={handleGenerate}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                canGenerate
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                  : phase === "generating"
                  ? "bg-indigo-900/60 text-indigo-300 cursor-not-allowed"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}>
              {phase === "generating" ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {isVideoModel ? `Generating video… ${elapsed}s` : isAudioModel ? `Composing… ${elapsed}s` : `Generating… ${elapsed}s`}
                </>
              ) : (
                <>{isI2V ? "Animate image" : isVideoModel ? "Generate video" : isAudioModel ? "Generate audio" : "Generate image"} · {displayCredits} cr</>
              )}
            </button>
            {phase === "generating" && (
              <div className="space-y-1.5">
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{
                      width: isVideoModel
                        ? `${Math.min(95, elapsed < 30 ? (elapsed / 30) * 15 : 15 + ((Math.min(elapsed, 480) - 30) / 450) * 80)}%`
                        : isAudioModel
                        ? `${Math.min(95, (elapsed / 60) * 95)}%`
                        : `${Math.min(95, (elapsed / 25) * 95)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-600 text-center">
                  {isVideoModel
                    ? elapsed < 60 ? "Submitting to fal.ai…" : elapsed < 180 ? "Processing… usually 3–5 min" : elapsed < 360 ? "Still generating — hang tight…" : "Almost there…"
                    : isAudioModel ? "Composing audio…" : "Generating image…"}
                </p>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-zinc-600">
              <span>Balance: {balance} cr</span>
              <a href="/billing" className="hover:text-indigo-400 transition-colors">Top up →</a>
            </div>
          </div>

          {/* Share & earn */}
          {referralLink && (
            <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-300">Share &amp; earn 20 cr</p>
                <span className="text-xs text-zinc-600">per referral</span>
              </div>
              <div className="flex gap-2">
                <input readOnly value={referralLink}
                  className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs px-3 py-2 truncate focus:outline-none" />
                <button onClick={copyReferral}
                  className="shrink-0 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors">
                  {copied ? "✓" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: canvas ───────────────────────────────────────────────── */}
        <div className="flex-1 min-h-[400px] lg:min-h-0">

          {/* History preview */}
          {phase === "idle" && previewItem && (
            <div className="h-full min-h-[400px] rounded-2xl overflow-hidden relative bg-zinc-900 border border-zinc-800 group">
              {previewItem.mimeType.startsWith("video") ? (
                <video src={previewItem.url} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <Image src={previewItem.url} alt={previewItem.job.prompt} fill className="object-contain" unoptimized />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400 truncate">{previewItem.job.prompt}</p>
                  <div className="flex gap-2 shrink-0">
                    <a href={previewItem.url} download target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg">Download</a>
                    <button onClick={() => setPreviewItem(null)}
                      className="text-xs bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg">✕</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* I2V canvas: uploaded image preview */}
          {phase === "idle" && !previewItem && isI2V && localImagePreview && (
            <div className="h-full min-h-[400px] rounded-2xl overflow-hidden relative bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={localImagePreview} alt="Source" className="max-w-full max-h-full object-contain" />
              <div className="absolute top-3 left-3 bg-indigo-600/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                Source image
              </div>
            </div>
          )}

          {/* Idle empty */}
          {phase === "idle" && !previewItem && (!isI2V || !localImagePreview) && !resultUrl && (
            <div className="h-full min-h-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center gap-4 p-8">
              {errorMsg ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-400">{errorMsg}</p>
                  <button onClick={handleStartOver} className="text-xs text-zinc-500 hover:text-zinc-300 underline">Try again</button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    {isI2V ? (
                      <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm text-zinc-400">
                      {isI2V ? "Upload an image to animate it" : "Your creation will appear here"}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {isI2V ? "Pick a model on the left, upload your image, then hit Animate" : "Write a prompt and hit generate"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Uploading */}
          {phase === "uploading" && (
            <div className="h-full min-h-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-zinc-400 animate-pulse">Uploading image…</p>
            </div>
          )}

          {/* Generating */}
          {phase === "generating" && (
            <div className="h-full min-h-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center gap-5">
              {/* Show source image faintly for I2V */}
              {isI2V && localImagePreview && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={localImagePreview} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90 text-indigo-500" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray="176" strokeDashoffset="44"
                      className="animate-spin origin-center" style={{ animationDuration: "1.4s" }} />
                  </svg>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-zinc-300">
                    {isI2V ? `Animating with ${selectedModel.name}` : isAudioModel ? `Composing with ${selectedModel.name}` : `Generating on ${selectedModel.name}`}
                  </p>
                  <p className="text-xs text-zinc-600">
                    {elapsed}s elapsed · {isVideoModel ? "~3–5 min for video" : isAudioModel ? "usually 30–60 s" : "usually 5–30 s"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Done — audio */}
          {phase === "done" && resultUrl && isAudioModel && (
            <div className="h-full min-h-[400px] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-6 p-8">
              <div className="w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-zinc-200">Your audio is ready</p>
                <p className="text-xs text-zinc-600 max-w-xs">{prompt}</p>
              </div>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls autoPlay className="w-full max-w-sm rounded-lg" src={resultUrl} />
              <div className="flex gap-3">
                <a href={resultUrl} download target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg transition-colors">Download</a>
                <button onClick={handleStartOver}
                  className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors">Generate another</button>
              </div>
            </div>
          )}

          {/* Done — image / video */}
          {phase === "done" && resultUrl && !isAudioModel && (
            <div className="h-full min-h-[400px] rounded-2xl overflow-hidden relative bg-zinc-900 border border-zinc-800 group">
              {selectedModel.type === "video" ? (
                <video src={resultUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <Image src={resultUrl} alt={prompt} fill className="object-contain" unoptimized />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400 truncate">{prompt}</p>
                  <div className="flex gap-2 shrink-0">
                    <a href={resultUrl} download target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg transition-colors">Download</a>
                    <button onClick={handleStartOver}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">New</button>
                  </div>
                </div>
              </div>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {selectedModel.name}
              </div>
              <a href="/gallery"
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-zinc-300 hover:text-white text-xs font-medium px-2.5 py-1 rounded-full transition-colors">
                Gallery →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── History strip ── */}
      {history.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest">Recent generations</p>
            <a href="/gallery" className="text-xs text-zinc-600 hover:text-indigo-400 transition-colors">View all →</a>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {history.map((item) => (
              <button key={item.id}
                onClick={() => { setPreviewItem(item); setPhase("idle"); setResultUrl(null); setErrorMsg(null); }}
                className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500/60 transition-all relative group"
                title={item.job.prompt}>
                {item.mimeType.startsWith("video") ? (
                  <video src={item.url} muted className="w-full h-full object-cover" />
                ) : item.mimeType.startsWith("audio") ? (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                    </svg>
                  </div>
                ) : (
                  <Image src={item.url} alt={item.job.prompt} fill className="object-cover" unoptimized />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs">View</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModelCard({
  model, selected, onSelect, disabled,
}: {
  model: Model; selected: boolean; onSelect?: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onSelect} disabled={disabled}
      className={`rounded-xl border p-3 text-left transition-all ${
        disabled ? "cursor-not-allowed border-zinc-800 bg-zinc-900 opacity-60"
        : selected ? "border-indigo-500 ring-1 ring-indigo-500/20 bg-indigo-950/30"
        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/60"
      }`}>
      <p className="text-xs font-semibold text-zinc-200 leading-tight">{model.name}</p>
      <p className="text-xs text-zinc-600 mt-0.5 leading-snug">{model.description}</p>
      <p className="text-xs font-semibold text-zinc-100 mt-1.5">
        {model.credits} cr
        <span className="text-xs font-normal text-zinc-600 ml-1">{creditsToGBP(model.credits)}</span>
      </p>
    </button>
  );
}

"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  MODELS,
  creditsToGBP,
  Model,
} from "@/config";
import { BLOCKED_TERMS } from "@/data/fake";
import { PROMPT_SUGGESTIONS } from "@/data/prompt-suggestions";
import { useUser } from "@/context/UserContext";

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

type Phase = "idle" | "generating" | "done" | "error";

const POLL_INTERVAL_MS = 2500;
const IMAGE_POLL_TIMEOUT_MS = 120_000;  // 2 min for images
const VIDEO_POLL_TIMEOUT_MS = 360_000;  // 6 min for video

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://buruai.elmorilx.com";

export default function StudioPage() {
  const { balance, refreshBalance } = useUser();
  const { data: session } = useSession();
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState("flux-schnell");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [topUpMsg, setTopUpMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [suggestions, setSuggestions] = useState(() =>
    [...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4)
  );

  const referralLink = session?.user?.id
    ? `${APP_URL}/?ref=${session.user.id}`
    : null;

  function copyReferral() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shuffleSuggestions() {
    setSuggestions([...PROMPT_SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 4));
  }

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

  // Elapsed timer while generating
  useEffect(() => {
    if (phase !== "generating") { setElapsed(0); return; }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  async function handleGenerate() {
    setPhase("generating");
    setErrorMsg(null);
    setResultUrl(null);

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

    const timeout = isVideoModel ? VIDEO_POLL_TIMEOUT_MS : IMAGE_POLL_TIMEOUT_MS;
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <Suspense fallback={null}>
        <TopUpHandler refreshBalance={refreshBalance} onMessage={setTopUpMsg} />
      </Suspense>
      <ReferralHandler onMessage={setTopUpMsg} />

      {topUpMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-2.5 rounded-xl mb-4">
          {topUpMsg}
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-6 flex-1 lg:flex-row flex-col">

        {/* ── LEFT: controls ── */}
        <div className="lg:w-[400px] shrink-0 space-y-5">

          <div>
            <h1 className="text-xl font-semibold text-zinc-100">Studio</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Generate images &amp; video</p>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create…"
              rows={4}
              disabled={phase === "generating"}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 p-4 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
            />

            {/* Suggestions */}
            {!prompt && phase === "idle" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">Try a prompt</span>
                  <button onClick={shuffleSuggestions} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                    ↻ More
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setPrompt(s)}
                      className="text-xs bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors text-left"
                    >
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

          {/* Model selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Image</p>
            <div className="grid grid-cols-2 gap-2">
              {IMAGE_MODELS.map((m) => (
                <ModelCard
                  key={m.id}
                  model={m}
                  selected={modelId === m.id}
                  onSelect={() => setModelId(m.id)}
                  disabled={phase === "generating"}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Video</p>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_MODELS.map((m) => (
                <ModelCard
                  key={m.id}
                  model={m}
                  selected={modelId === m.id}
                  onSelect={() => setModelId(m.id)}
                  disabled={phase === "generating"}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-700">Generates a 5-second clip · takes ~3 min</p>
          </div>

          {/* Generate */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-300">{selectedModel.name}</span>
              <span className="text-sm font-semibold text-zinc-100">
                {selectedModel.credits} cr
                <span className="text-xs font-normal text-zinc-500 ml-1">{creditsToGBP(selectedModel.credits)}</span>
              </span>
            </div>
            {insufficientBalance && (
              <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800 rounded-lg px-3 py-2">
                Need {selectedModel.credits} cr · you have {balance} cr
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
              {isVideoModel ? "Generate video" : "Generate image"} · {selectedModel.credits} cr
            </button>
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
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 text-xs px-3 py-2 truncate focus:outline-none"
                />
                <button
                  onClick={copyReferral}
                  className="shrink-0 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  {copied ? "✓" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: canvas ── */}
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          {/* Idle */}
          {phase === "idle" && !resultUrl && (
            <div className="h-full min-h-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center gap-4 p-8">
              {errorMsg ? (
                <div className="text-center space-y-2">
                  <p className="text-sm text-red-400">{errorMsg}</p>
                  <button onClick={handleStartOver} className="text-xs text-zinc-500 hover:text-zinc-300 underline">
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm text-zinc-400">Your creation will appear here</p>
                    <p className="text-xs text-zinc-600">Write a prompt and hit generate</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Generating */}
          {phase === "generating" && (
            <div className="h-full min-h-[400px] rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center justify-center gap-5">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90 text-indigo-500" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28"
                    stroke="currentColor" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="176"
                    strokeDashoffset="44"
                    className="animate-spin origin-center"
                    style={{ animationDuration: "1.4s" }}
                  />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-zinc-300">
                  Generating on {selectedModel.name}
                </p>
                <p className="text-xs text-zinc-600">
                  {elapsed}s elapsed · {isVideoModel ? "~3 min for video" : "usually 5–30 s"}
                </p>
              </div>
            </div>
          )}

          {/* Done */}
          {phase === "done" && resultUrl && (
            <div className="h-full min-h-[400px] rounded-2xl overflow-hidden relative bg-zinc-900 border border-zinc-800 group">
              {isVideoModel ? (
                <video
                  src={resultUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={resultUrl}
                  alt={prompt}
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}

              {/* Overlay toolbar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400 truncate">{prompt}</p>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={resultUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Download
                    </a>
                    <button
                      onClick={handleStartOver}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      New
                    </button>
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                {selectedModel.name}
              </div>

              <a
                href="/gallery"
                className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-zinc-300 hover:text-white text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
              >
                Gallery →
              </a>
            </div>
          )}
        </div>
      </div>
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
      className={`rounded-xl border p-3 text-left transition-all ${
        disabled
          ? "cursor-not-allowed border-zinc-800 bg-zinc-900 opacity-60"
          : selected
          ? "border-indigo-500 ring-1 ring-indigo-500/20 bg-indigo-950/30"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-800/60"
      }`}
    >
      <p className="text-xs font-semibold text-zinc-200 leading-tight">{model.name}</p>
      <p className="text-xs text-zinc-600 mt-0.5 leading-snug">{model.description}</p>
      <p className="text-xs font-semibold text-zinc-100 mt-1.5">
        {model.credits} cr
        <span className="text-xs font-normal text-zinc-600 ml-1">{creditsToGBP(model.credits)}</span>
      </p>
    </button>
  );
}

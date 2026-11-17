"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { TOOL_CREDITS } from "@/config";

const POLL_INTERVAL_MS = 2500;
const TIMEOUT_MS = 180_000;
function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

export interface ToolPageConfig {
  modelId: string;
  title: string;
  description: string;
  apiRoute: string;
  inputLabel?: string;
  secondInputLabel?: string;
  promptLabel?: string;
  promptPlaceholder?: string;
  hasPrompt?: boolean;
  hasSecondImage?: boolean;
  hasAudio?: boolean;
  strengthControl?: boolean;
  outputIsVideo?: boolean;
  outputIsAudio?: boolean;
  /** No image input — prompt/text is the only input */
  textOnlyInput?: boolean;
  /** Extra dropdown below prompt */
  selectField?: { label: string; name: string; options: { value: string; label: string }[] };
  badge?: string;
}

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}

function UploadZone({
  label,
  preview,
  onFile,
  disabled,
  accept = "image/*",
}: {
  label: string;
  preview: string | null;
  onFile: (f: File) => void;
  disabled?: boolean;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</p>
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 h-44 group">
          {accept.includes("audio") ? (
            <div className="w-full h-full flex items-center justify-center gap-3 text-indigo-400">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
              </svg>
              <span className="text-sm text-zinc-300">Audio ready</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          )}
          {!disabled && (
            <button onClick={() => ref.current?.click()}
              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
              Change
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && ref.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors space-y-2 ${disabled ? "border-zinc-800 cursor-not-allowed opacity-50" : "border-zinc-800 hover:border-indigo-500/60 cursor-pointer"}`}
        >
          <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
            {accept.includes("audio") ? (
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            )}
          </div>
          <p className="text-sm text-zinc-400">Drop or click to upload</p>
          <p className="text-xs text-zinc-600">{accept.includes("audio") ? "MP3, WAV, M4A" : "JPEG, PNG, WebP · max 10 MB"}</p>
        </div>
      )}
    </div>
  );
}

export default function ToolPage({ config }: { config: ToolPageConfig }) {
  const credits = TOOL_CREDITS[config.modelId] ?? 0;

  const [phase, setPhase] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [prompt, setPrompt] = useState("");
  const [strength, setStrength] = useState(0.75);
  const [selectValue, setSelectValue] = useState(config.selectField?.options[0]?.value ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [image2Preview, setImage2Preview] = useState<string | null>(null);
  const [image2Url, setImage2Url] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  async function handleFile(file: File, slot: "image" | "image2" | "audio") {
    const setPreview = slot === "image" ? setImagePreview : slot === "image2" ? setImage2Preview : setAudioPreview;
    const setUrl    = slot === "image" ? setImageUrl    : slot === "image2" ? setImage2Url    : setAudioUrl;

    // Local preview
    if (!file.type.startsWith("audio")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview("audio");
    }

    setPhase("uploading");
    setErrorMsg(null);
    try {
      const url = await uploadFile(file);
      setUrl(url);
      setPhase("idle");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Upload failed");
      setPhase("error");
    }
  }

  const canProcess = phase === "idle" &&
    (config.textOnlyInput ? !!prompt.trim() : !!imageUrl) &&
    (!config.hasSecondImage || !!image2Url) &&
    (!config.hasAudio || !!audioUrl) &&
    (!config.hasPrompt || !!prompt.trim());

  async function handleProcess() {
    if (!canProcess) return;
    setPhase("processing");
    setErrorMsg(null);
    setResultUrl(null);

    const body: Record<string, unknown> = config.textOnlyInput ? {} : { imageUrl };
    if (config.textOnlyInput)   body.text = prompt.trim();
    else if (config.hasPrompt)  body.prompt = prompt.trim();
    if (config.hasSecondImage)  body.swapImageUrl = image2Url;
    if (config.hasAudio)        body.audioUrl = audioUrl;
    if (config.strengthControl) body.strength = strength;
    if (config.selectField)     body[config.selectField.name] = selectValue || undefined;
    // For relight, the prompt goes as lightingPrompt
    if (config.modelId === "tool-relight" && config.hasPrompt) {
      body.lightingPrompt = prompt.trim();
      delete body.prompt;
    }

    let jobId: string;
    try {
      const res = await fetch(config.apiRoute, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Failed"); setPhase("error"); return; }
      jobId = data.jobId;
    } catch {
      setErrorMsg("Network error — please try again");
      setPhase("error");
      return;
    }

    const deadline = Date.now() + TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const status = await res.json();
        if (status.status === "done") { setResultUrl(status.resultUrl); setPhase("done"); return; }
        if (status.status === "failed") { setErrorMsg(status.errorMessage ?? "Processing failed"); setPhase("error"); return; }
      } catch { /* keep polling */ }
    }
    setErrorMsg("Timed out — please try again");
    setPhase("error");
  }

  const isProcessing = phase === "processing" || phase === "uploading";

  return (
    <div className="min-h-screen flex flex-col gap-6 px-6 md:px-8 py-6">
      <div className="max-w-5xl mx-auto w-full">

        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <h1 className="text-xl font-semibold text-zinc-100">{config.title}</h1>
            {config.badge && (
              <span className="text-[9px] font-bold tracking-widest bg-indigo-600 text-white px-2 py-0.5 rounded-full">{config.badge}</span>
            )}
          </div>
          <p className="text-sm text-zinc-500">{config.description}</p>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">

          {/* Controls */}
          <div className="lg:w-[380px] shrink-0 space-y-5">

            {!config.textOnlyInput && (
              <UploadZone
                label={config.inputLabel ?? "Input image"}
                preview={imagePreview}
                onFile={(f) => handleFile(f, "image")}
                disabled={isProcessing}
              />
            )}

            {config.hasSecondImage && (
              <UploadZone
                label={config.secondInputLabel ?? "Second image"}
                preview={image2Preview}
                onFile={(f) => handleFile(f, "image2")}
                disabled={isProcessing}
              />
            )}

            {config.hasAudio && (
              <UploadZone
                label="Audio file"
                preview={audioPreview}
                onFile={(f) => handleFile(f, "audio")}
                disabled={isProcessing}
                accept="audio/*"
              />
            )}

            {(config.hasPrompt || config.textOnlyInput) && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  {config.promptLabel ?? (config.textOnlyInput ? "Your text" : "Edit instruction")}
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={config.promptPlaceholder ?? (config.textOnlyInput ? "Type what you want to say…" : "Describe the edit…")}
                  rows={config.textOnlyInput ? 5 : 3}
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 p-4 text-sm resize-none focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                />
              </div>
            )}

            {config.selectField && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  {config.selectField.label}
                </p>
                <select
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 p-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                >
                  {config.selectField.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {config.strengthControl && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Strength</p>
                  <span className="text-xs text-zinc-400">{Math.round(strength * 100)}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={strength}
                  onChange={(e) => setStrength(parseFloat(e.target.value))}
                  disabled={isProcessing}
                  className="w-full accent-indigo-500" />
                <p className="text-xs text-zinc-700">Higher = more creative; lower = closer to original</p>
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg bg-red-950/60 border border-red-800 px-3 py-2.5 text-xs text-red-300">{errorMsg}</div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-zinc-300">{config.title}</span>
                <span className="text-sm font-semibold text-zinc-100">{credits} cr</span>
              </div>
              <button
                disabled={!canProcess}
                onClick={handleProcess}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                  canProcess
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    {phase === "uploading" ? "Uploading…" : "Processing…"}
                  </span>
                ) : `Process · ${credits} cr`}
              </button>
            </div>

            {phase === "done" && (
              <button
                onClick={() => { setPhase("idle"); setResultUrl(null); setImageUrl(null); setImagePreview(null); setImage2Url(null); setImage2Preview(null); setAudioUrl(null); setAudioPreview(null); setPrompt(""); }}
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ← Start over
              </button>
            )}
          </div>

          {/* Result canvas */}
          <div className="flex-1 min-h-[400px]">
            {resultUrl ? (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 relative group h-full min-h-[400px] flex flex-col items-center justify-center">
                {config.outputIsAudio ? (
                  <div className="w-full p-8 space-y-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-400">Your voiceover is ready</p>
                    <audio src={resultUrl} controls className="w-full max-w-md mx-auto" />
                    <a href={resultUrl} download target="_blank" rel="noopener noreferrer"
                      className="inline-block text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg transition-colors">
                      Download audio
                    </a>
                  </div>
                ) : config.outputIsVideo ? (
                  <>
                    <video src={resultUrl} controls autoPlay loop className="w-full h-full object-contain" />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-transform">
                      <a href={resultUrl} download target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg">
                        Download
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <Image src={resultUrl} alt="Result" fill className="object-contain" unoptimized />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-transform">
                      <a href={resultUrl} download target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg">
                        Download
                      </a>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[400px] rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center">
                    {isProcessing ? (
                      <svg className="animate-spin w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75 7.5 10.5l3 3L15 8.25l6.75 6.75" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-zinc-600">
                    {isProcessing
                      ? (config.textOnlyInput ? "Generating audio…" : "Processing…")
                      : "Result will appear here"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

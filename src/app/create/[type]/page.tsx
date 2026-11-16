"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TEMPLATES, FormField } from "@/data/create-templates";
import { MODELS, creditsToGBP } from "@/config";

export default function CreatePage() {
  const { type } = useParams<{ type: string }>();
  const router = useRouter();
  const template = TEMPLATES.find((t) => t.type === type);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!template) {
    // Unknown type — fall back to studio
    if (typeof window !== "undefined") router.replace("/studio");
    return null;
  }

  const model = MODELS.find((m) => m.id === template.defaultModel);

  function set(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function togglePill(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: prev[id] === value ? "" : value }));
  }

  const isComplete = template.fields
    .filter((f) => f.required)
    .every((f) => answers[f.id]?.trim());

  function handleSubmit() {
    if (!template) return;
    const prompt = template.buildPrompt(answers);
    const params = new URLSearchParams({
      prompt,
      model: template.defaultModel,
      ratio: template.defaultRatio,
    });
    router.push(`/studio?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT: animated preview panel ──────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col lg:w-[42%] xl:w-[38%] relative overflow-hidden tile-scan"
        style={{ background: template.tileGradient }}
      >
        {/* Scan sweep layer */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.065) 50%, transparent 100%)",
            animation: "scan-sweep 7s linear infinite",
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/58" />

        {/* Back link */}
        <div className="relative z-10 p-7">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors tracking-wider"
          >
            ← Back
          </Link>
        </div>

        {/* Content type badge */}
        <div className="relative z-10 px-7">
          <span className="inline-flex items-center gap-2 bg-white/8 border border-white/12 backdrop-blur-sm text-white/50 text-xs font-semibold px-4 py-2 rounded-full tracking-[0.15em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            Example
          </span>
        </div>

        {/* Center: type name */}
        <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-7 py-8">
          <p className="text-xs font-bold tracking-[0.25em] text-white/35 uppercase mb-4">
            AI Generated
          </p>
          <h2
            className="font-black tracking-tighter uppercase text-white leading-[0.88]"
            style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)" }}
          >
            {template.noun}
          </h2>
          <p className="text-sm text-white/45 mt-4 max-w-xs leading-relaxed">
            {template.subtitle}
          </p>

          {/* Decorative tiles */}
          <div className="mt-8 grid grid-cols-3 gap-2 w-full max-w-xs opacity-30">
            {[0.9, 0.7, 0.5, 0.6, 0.8, 0.4].map((o, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg"
                style={{
                  background: template.tileGradient,
                  opacity: o,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom: model info */}
        {model && (
          <div className="relative z-10 p-7">
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] font-bold">Default model</p>
                <p className="text-sm font-bold text-white/80 mt-1">{model.name}</p>
                <p className="text-xs text-white/35 mt-0.5">{model.description}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/35 uppercase tracking-[0.2em] font-bold">Cost</p>
                <p className="text-xl font-black text-white mt-1">{model.credits} cr</p>
                <p className="text-xs text-white/35">{creditsToGBP(model.credits)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: form ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 py-10 lg:py-14 space-y-8">

          {/* Mobile back */}
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors tracking-wider"
          >
            ← Back
          </Link>

          {/* Title */}
          <div className="space-y-1.5">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight text-white">
              {template.verb}{" "}
              <span
                className="animate-gradient-text text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg,#818cf8,#a78bfa,#c084fc,#818cf8)",
                  backgroundSize: "200% 200%",
                }}
              >
                {template.noun}
              </span>
            </h1>
            <p className="text-zinc-500 text-sm">{template.subtitle}</p>
          </div>

          {/* Form fields */}
          <div className="space-y-7">
            {template.fields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={answers[field.id] ?? ""}
                onChange={(v) => set(field.id, v)}
                onTogglePill={(v) => togglePill(field.id, v)}
              />
            ))}
          </div>

          {/* Model & cost summary */}
          {model && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Using</p>
                <p className="text-sm font-bold text-zinc-100 mt-0.5">{model.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Cost</p>
                <p className="text-sm font-black text-zinc-100 mt-0.5">
                  {model.credits} cr{" "}
                  <span className="text-zinc-500 font-normal text-xs">{creditsToGBP(model.credits)}</span>
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`w-full py-4 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all ${
              isComplete
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {template.ctaLabel} →
          </button>

          <p className="text-xs text-zinc-700 text-center tracking-widest uppercase">
            You&apos;ll review in the studio before credits are charged
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Field renderer ────────────────────────────────────────────────────────────

function FieldRenderer({
  field,
  value,
  onChange,
  onTogglePill,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  onTogglePill: (v: string) => void;
}) {
  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-bold text-zinc-200 tracking-tight">
          {field.label}
          {field.required && <span className="text-indigo-400 ml-1">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          rows={3}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 p-4 text-sm resize-none focus:outline-none transition-colors"
        />
        <div className="flex justify-end">
          <span className="text-xs text-zinc-700">{value.length}/{field.maxLength}</span>
        </div>
      </div>
    );
  }

  if (field.type === "text") {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-bold text-zinc-200 tracking-tight">
          {field.label}
          {field.required && <span className="text-indigo-400 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 px-4 py-3 text-sm focus:outline-none transition-colors"
        />
      </div>
    );
  }

  if (field.type === "pills") {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-bold text-zinc-200 tracking-tight">
          {field.label}
          {!field.required && (
            <span className="text-zinc-600 font-normal ml-2 text-xs">optional</span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTogglePill(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

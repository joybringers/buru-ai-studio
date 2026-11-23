"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSignInModal } from "@/context/SignInModalContext";

const QUICK_STARTS = [
  { label: "Short horror film", icon: "👁", concept: "A psychological horror short film about a woman who discovers her reflection has started moving on its own" },
  { label: "Music video", icon: "🎵", concept: "A neon-lit music video following a dancer performing through the streets of a futuristic city at night" },
  { label: "Product ad", icon: "✨", concept: "A luxury product advertisement for a premium perfume bottle, shot with cinematic lighting and slow motion" },
  { label: "Sci-fi trailer", icon: "🚀", concept: "An epic sci-fi film trailer about humanity's first contact with an alien civilisation on a distant moon" },
  { label: "Wedding film", icon: "💍", concept: "A romantic wedding short film capturing intimate moments, golden hour portraits and emotional first looks" },
  { label: "Brand story", icon: "🎬", concept: "A cinematic brand story about a startup founder who turned a simple idea into a global movement" },
];

export default function DirectorPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { open: openSignIn } = useSignInModal();
  const [concept, setConcept] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDirect(text: string) {
    if (!session?.user?.id) { openSignIn(); return; }
    const c = text.trim();
    if (!c) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: c }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok || !data.id) { setError(data.error ?? "Failed to create project"); setLoading(false); return; }
      router.push(`/director/${data.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF] flex flex-col">

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16"
        style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(106,76,255,0.15) 0%, transparent 70%)" }}>

        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#6A4CFF]/10 border border-[#6A4CFF]/20 text-[#A88FFF] text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 2 9.5 6h4.5l-3.5 2.5 1.5 4.5L8 10.5 4.5 13 6 8.5 2.5 6H7L8 2Z"/>
            </svg>
            Director Mode
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#F2F6FF] mb-3">
            Vibe Direct Your
            <span className="block" style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", background: "linear-gradient(100deg, #A88FFF, #2BE4FF)" }}>
              Next Video
            </span>
          </h1>
          <p className="text-[#A8B0D8] text-base">Describe your concept — AI breaks it into scenes and generates each one.</p>
        </div>

        {/* Input */}
        <div className="w-full max-w-2xl">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0E1128", border: "1px solid rgba(106,76,255,0.3)" }}>
            <textarea
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleDirect(concept); } }}
              placeholder="Describe your video concept... e.g. A cinematic short film about a lighthouse keeper who discovers a mysterious signal from the deep sea"
              rows={3}
              disabled={loading}
              className="w-full bg-transparent text-[#F2F6FF] placeholder-[#4A5280] px-5 pt-4 pb-3 text-sm resize-none focus:outline-none disabled:opacity-60"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs text-[#4A5280]">{concept.length}/500</span>
              <button
                onClick={() => void handleDirect(concept)}
                disabled={loading || !concept.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: loading || !concept.trim() ? "#1E2140" : "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Directing…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h12M9 3l5 5-5 5"/>
                    </svg>
                    Direct
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-400 mt-2 text-center">{error}</p>}
        </div>

        {/* Quick starts */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-2xl">
          {QUICK_STARTS.map((qs) => (
            <button
              key={qs.label}
              onClick={() => { setConcept(qs.concept); void handleDirect(qs.concept); }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#A8B0D8] hover:text-[#F2F6FF] transition-all disabled:opacity-50"
              style={{ background: "#0E1128", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span>{qs.icon}</span>
              <span>{qs.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto w-full px-6 pb-16">
        <p className="text-[9px] font-bold text-[#4A5280] uppercase tracking-[0.25em] text-center mb-6">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: "01", title: "Describe your vision", body: "Type any video concept — a film idea, an ad, a music video. Be as brief or as detailed as you like." },
            { n: "02", title: "AI writes the scenes", body: "Claude breaks your concept into 4–6 cinematic scenes, each with a tailored video prompt and mood." },
            { n: "03", title: "Generate & review", body: "Generate each scene as a video clip with one click, then review your storyboard all in one place." },
          ].map((step) => (
            <div key={step.n} className="bg-[#0E1128] border border-[#1E2140] rounded-2xl p-5">
              <div className="text-[#6A4CFF] font-mono text-xs mb-3">{step.n}</div>
              <div className="font-semibold text-[#F2F6FF] mb-1.5">{step.title}</div>
              <p className="text-xs text-[#A8B0D8] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

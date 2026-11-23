"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FILM_TEMPLATES } from "@/lib/templates";
import { useSignInModal } from "@/context/SignInModalContext";

export default function TemplatesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { open: openSignIn } = useSignInModal();
  const [creating, setCreating] = useState<string | null>(null);

  const startFromTemplate = async (templateId: string) => {
    if (!session?.user?.id) { openSignIn(); return; }
    const tpl = FILM_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setCreating(templateId);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: tpl.title, targetLength: tpl.targetLength }),
      });
      const project = await res.json() as { id?: string };
      if (!res.ok || !project.id) { setCreating(null); return; }

      // Fire-and-forget seed — don't block navigation on the AI call
      fetch(`/api/projects/${project.id}/script/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: tpl.starterPrompt }),
      }).catch(() => {});

      router.push(`/projects/${project.id}/script`);
    } catch {
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F2F6FF] mb-2">Film Templates</h1>
          <p className="text-[#A8B0D8] text-sm">
            Start your project from a template — the AI will seed your script with a genre-appropriate opening.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FILM_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => startFromTemplate(tpl.id)}
              disabled={!!creating}
              className="text-left bg-[#121530] border border-[#1E2140] hover:border-[#6A4CFF]/60 rounded-2xl p-5 transition-all group disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold mb-3"
              style={{ background: "rgba(106,76,255,.15)", color: "#A88FFF", border: "1px solid rgba(106,76,255,.2)" }}>
              {tpl.icon}
            </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-[#F2F6FF] group-hover:text-white">{tpl.title}</span>
                <span className="text-xs bg-[#1E2140] text-[#A8B0D8] px-1.5 py-0.5 rounded-full">{tpl.genre}</span>
              </div>
              <p className="text-xs text-[#A8B0D8] mb-3 leading-relaxed">{tpl.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#4A5280] font-mono">{tpl.targetLength}s</span>
                <span className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                  creating === tpl.id
                    ? "bg-[#6A4CFF] text-white"
                    : "bg-[#1E2140] text-[#A8B0D8] group-hover:bg-[#6A4CFF]/20 group-hover:text-[#A88FFF]"
                }`}>
                  {creating === tpl.id ? "Creating…" : "Use template →"}
                </span>
              </div>
            </button>
          ))}

          {/* Blank project */}
          <button
            onClick={() => router.push("/projects")}
            className="text-left bg-[#121530] border border-dashed border-[#1E2140] hover:border-[#6A4CFF]/40 rounded-2xl p-5 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold mb-3"
              style={{ background: "rgba(106,76,255,.08)", color: "#7B84B5", border: "1px dashed rgba(106,76,255,.2)" }}>
              +
            </div>
            <div className="font-semibold text-[#F2F6FF] mb-1">Blank Project</div>
            <p className="text-xs text-[#A8B0D8] mb-3">Start from scratch with your own idea.</p>
            <span className="text-xs text-[#A8B0D8] group-hover:text-[#F2F6FF]">Go to My Films →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

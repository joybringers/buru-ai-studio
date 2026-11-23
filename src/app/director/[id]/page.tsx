"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Scene {
  id: string;
  order: number;
  title: string;
  description: string;
  videoPrompt: string;
  duration: string;
  mood: string;
  status: "idle" | "generating" | "done" | "failed";
  videoUrl: string | null;
  jobId: string | null;
}

interface Project {
  id: string;
  title: string;
  concept: string;
  status: string;
  scenes: Scene[];
}

export default function DirectorProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [elapsed, setElapsed] = useState<Record<string, number>>({});
  const [error, setError] = useState<Record<string, string>>({});

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/director/${params.id}`);
    if (res.status === 404) { router.push("/director"); return; }
    const data = await res.json() as Project;
    setProject(data);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { void fetchProject(); }, [fetchProject]);

  // Poll generating scenes
  useEffect(() => {
    if (!project) return;
    const generatingScenes = project.scenes.filter((s) => s.status === "generating");
    if (generatingScenes.length === 0) return;

    const timer = setInterval(async () => {
      setElapsed((prev) => {
        const next = { ...prev };
        generatingScenes.forEach((s) => { next[s.id] = (next[s.id] ?? 0) + 3; });
        return next;
      });

      for (const scene of generatingScenes) {
        const res = await fetch(`/api/director/${params.id}/scenes/${scene.id}/status`);
        const data = await res.json() as { status: string; videoUrl?: string };
        if (data.status === "done" || data.status === "failed") {
          setProject((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              scenes: prev.scenes.map((s) =>
                s.id === scene.id
                  ? { ...s, status: data.status as Scene["status"], videoUrl: data.videoUrl ?? null }
                  : s
              ),
            };
          });
          setGenerating((prev) => ({ ...prev, [scene.id]: false }));
          setElapsed((prev) => { const n = { ...prev }; delete n[scene.id]; return n; });
        }
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [project, params.id]);

  async function generateScene(scene: Scene) {
    setGenerating((prev) => ({ ...prev, [scene.id]: true }));
    setError((prev) => ({ ...prev, [scene.id]: "" }));
    setElapsed((prev) => ({ ...prev, [scene.id]: 0 }));

    const res = await fetch(`/api/director/${params.id}/scenes/${scene.id}/generate`, { method: "POST" });
    const data = await res.json() as { error?: string };

    if (!res.ok) {
      setError((prev) => ({ ...prev, [scene.id]: data.error ?? "Failed to start" }));
      setGenerating((prev) => ({ ...prev, [scene.id]: false }));
      return;
    }

    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenes: prev.scenes.map((s) => s.id === scene.id ? { ...s, status: "generating" } : s),
      };
    });
  }

  async function generateAll() {
    if (!project) return;
    for (const scene of project.scenes) {
      if (scene.status === "idle" || scene.status === "failed") {
        await generateScene(scene);
        await new Promise((r) => setTimeout(r, 500));
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B1A] flex items-center justify-center">
        <div className="text-center space-y-3">
          <svg className="animate-spin w-8 h-8 text-[#6A4CFF] mx-auto" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p className="text-[#4A5280] text-sm">Loading project…</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const doneCount = project.scenes.filter((s) => s.status === "done").length;
  const generatingCount = project.scenes.filter((s) => s.status === "generating").length;
  const hasIdle = project.scenes.some((s) => s.status === "idle" || s.status === "failed");

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF] p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/director" className="inline-flex items-center gap-1.5 text-xs text-[#4A5280] hover:text-[#A8B0D8] mb-4 transition-colors">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 8H2M7 3L2 8l5 5"/>
            </svg>
            Director Mode
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#F2F6FF] mb-1 capitalize">{project.title}</h1>
              <p className="text-sm text-[#A8B0D8] max-w-xl">{project.concept}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#4A5280]">{doneCount}/{project.scenes.length} generated</span>
              {hasIdle && (
                <button
                  onClick={() => void generateAll()}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}
                >
                  Generate all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Scene grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {project.scenes.map((scene, i) => {
            const isGenerating = scene.status === "generating" || generating[scene.id];
            const sceneElapsed = elapsed[scene.id] ?? 0;
            const sceneError = error[scene.id];

            return (
              <div
                key={scene.id}
                className="rounded-2xl overflow-hidden border transition-all"
                style={{
                  background: "#0E1128",
                  borderColor: scene.status === "done" ? "rgba(43,228,255,0.2)" : scene.status === "generating" ? "rgba(106,76,255,0.3)" : "rgba(30,33,64,0.8)",
                }}
              >
                {/* Video / placeholder */}
                <div className="relative aspect-video bg-[#090B1A] flex items-center justify-center overflow-hidden">
                  {scene.status === "done" && scene.videoUrl ? (
                    <video
                      src={scene.videoUrl}
                      controls
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : isGenerating ? (
                    <div className="text-center space-y-3 p-6">
                      <svg className="animate-spin w-7 h-7 text-[#6A4CFF] mx-auto" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      <p className="text-xs text-[#A8B0D8]">
                        {sceneElapsed < 60 ? "Submitting to fal.ai…" : sceneElapsed < 180 ? "Processing… usually 3–5 min" : "Still generating…"}
                      </p>
                      {sceneElapsed > 0 && <p className="text-xs text-[#4A5280] font-mono">{sceneElapsed}s</p>}
                    </div>
                  ) : scene.status === "failed" ? (
                    <div className="text-center p-6">
                      <p className="text-xs text-red-400 mb-2">Generation failed</p>
                      {sceneError && <p className="text-xs text-[#4A5280]">{sceneError}</p>}
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3"
                        style={{ background: "rgba(106,76,255,0.1)", border: "1px solid rgba(106,76,255,0.2)" }}>
                        <span className="text-lg font-bold text-[#6A4CFF]">{String(i + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="text-xs text-[#4A5280]">Ready to generate</p>
                    </div>
                  )}

                  {/* Duration badge */}
                  <div className="absolute top-2 left-2 text-[9px] font-bold bg-black/60 text-[#A8B0D8] px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                    {scene.duration}s
                  </div>

                  {/* Status badge */}
                  {scene.status === "done" && (
                    <div className="absolute top-2 right-2 text-[9px] font-bold bg-[#2BE4FF]/20 text-[#2BE4FF] px-1.5 py-0.5 rounded-full border border-[#2BE4FF]/30">
                      Done
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-bold text-[#4A5280] font-mono">SCENE {i + 1}</span>
                        {scene.mood && (
                          <span className="text-[9px] font-semibold text-[#A8B0D8] bg-[#1E2140] px-1.5 py-0.5 rounded-full capitalize">{scene.mood}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[#F2F6FF] text-sm">{scene.title}</h3>
                      <p className="text-xs text-[#A8B0D8] mt-0.5 leading-relaxed">{scene.description}</p>
                    </div>
                  </div>

                  <div className="rounded-xl p-3 text-xs text-[#7B84B5] leading-relaxed italic"
                    style={{ background: "#090B1A", border: "1px solid rgba(30,33,64,0.8)" }}>
                    "{scene.videoPrompt}"
                  </div>

                  {(scene.status === "idle" || scene.status === "failed") && !generating[scene.id] && (
                    <button
                      onClick={() => void generateScene(scene)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: "linear-gradient(100deg, #6A4CFF 0%, #2F6BFF 100%)" }}
                    >
                      {scene.status === "failed" ? "Retry generation" : "Generate scene"} · {scene.duration === "10" ? "40" : "20"} cr
                    </button>
                  )}

                  {isGenerating && (
                    <div className="w-full h-1.5 bg-[#1E2140] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{
                          width: sceneElapsed < 30 ? `${(sceneElapsed / 30) * 15}%` : `${Math.min(93, 15 + ((Math.min(sceneElapsed, 480) - 30) / 450) * 78)}%`,
                        }}
                      />
                    </div>
                  )}

                  {scene.status === "done" && scene.videoUrl && (
                    <a
                      href={scene.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs text-[#A8B0D8] hover:text-[#F2F6FF] transition-colors"
                      style={{ background: "#121530", border: "1px solid rgba(30,33,64,0.8)" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v9M4 8l4 4 4-4M2 14h12"/>
                      </svg>
                      Download clip
                    </a>
                  )}

                  {sceneError && !generating[scene.id] && (
                    <p className="text-xs text-red-400 text-center">{sceneError}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer summary */}
        {doneCount > 0 && (
          <div className="mt-8 rounded-2xl p-5 text-center"
            style={{ background: "linear-gradient(100deg, rgba(106,76,255,0.08) 0%, rgba(43,228,255,0.05) 100%)", border: "1px solid rgba(106,76,255,0.15)" }}>
            <p className="text-sm text-[#A8B0D8]">
              {generatingCount > 0
                ? `${generatingCount} scene${generatingCount > 1 ? "s" : ""} still generating…`
                : doneCount === project.scenes.length
                ? "All scenes generated! Download your clips above."
                : `${doneCount} of ${project.scenes.length} scenes ready.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

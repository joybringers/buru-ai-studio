"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";

type Shot = {
  id: string;
  sceneId: string;
  sceneTitle: string;
  shotNumber: number;
  shotType: string;
  cameraAngle: string;
  cameraMove: string;
  description: string;
  dialogue: string;
  estimatedDuration: number;
  imageUrl?: string;
  status: "draft" | "approved";
};

const TYPE_ABBR: Record<string, string> = {
  "wide": "WS", "medium": "MS", "close-up": "CU", "extreme-close": "ECU",
  "over-shoulder": "OTS", "aerial": "AERIAL", "insert": "INS",
};
const MOVE_ICON: Record<string, string> = {
  static: "●", pan: "↔", tilt: "↕", dolly: "→", handheld: "〰", crane: "↗",
};

function cuid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function StoryboardGrid({
  projectId, projectTitle, hasScript, initialShots,
}: {
  projectId: string;
  projectTitle: string;
  hasScript: boolean;
  initialShots: Shot[];
}) {
  const [shots, setShots] = useState<Shot[]>(initialShots);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState("");
  const [selected, setSelected] = useState<Shot | null>(null);
  const [animatic, setAnimatic] = useState(false);
  const [animIdx, setAnimIdx] = useState(0);
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group shots by scene
  const scenes = shots.reduce<Record<string, Shot[]>>((acc, s) => {
    const key = s.sceneId ?? "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const totalDuration = shots.reduce((s, sh) => s + (sh.estimatedDuration ?? 0), 0);
  const approvedCount = shots.filter((s) => s.status === "approved").length;

  const save = useCallback(async (updated: Shot[]) => {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/storyboard`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shots: updated }),
    });
    setSaving(false);
  }, [projectId]);

  const generate = async () => {
    setGenerating(true);
    setGenError("");
    const res = await fetch(`/api/projects/${projectId}/storyboard/generate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setGenError(data.error ?? "Generation failed"); setGenerating(false); return; }
    setShots(data.shots ?? []);
    setGenerating(false);
  };

  const updateShot = (shot: Shot) => {
    const updated = shots.map((s) => (s.id === shot.id ? shot : s));
    setShots(updated);
    setSelected(shot);
    save(updated);
  };

  const deleteShot = (id: string) => {
    const updated = shots.filter((s) => s.id !== id);
    setShots(updated);
    setSelected(null);
    save(updated);
  };

  const addShot = (sceneId: string, sceneTitle: string) => {
    const sceneShots = shots.filter((s) => s.sceneId === sceneId);
    const shot: Shot = {
      id: cuid(), sceneId, sceneTitle,
      shotNumber: sceneShots.length + 1,
      shotType: "medium", cameraAngle: "eye-level", cameraMove: "static",
      description: "", dialogue: "", estimatedDuration: 5, status: "draft",
    };
    const updated = [...shots, shot];
    setShots(updated);
    setSelected(shot);
    save(updated);
  };

  const toggleApprove = (shot: Shot) => {
    updateShot({ ...shot, status: shot.status === "approved" ? "draft" : "approved" });
  };

  // Animatic playback
  useEffect(() => {
    if (!animatic || shots.length === 0) return;
    const shot = shots[animIdx];
    animTimer.current = setTimeout(() => {
      setAnimIdx((i) => (i + 1) % shots.length);
    }, (shot.estimatedDuration ?? 3) * 1000);
    return () => { if (animTimer.current) clearTimeout(animTimer.current); };
  }, [animatic, animIdx, shots]);

  const startAnimatic = () => { setAnimIdx(0); setAnimatic(true); setSelected(null); };
  const stopAnimatic = () => { setAnimatic(false); if (animTimer.current) clearTimeout(animTimer.current); };

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF]">
      {/* Header */}
      <div className="border-b border-[#1E2140] bg-[#121530] px-6 py-4 flex items-center gap-4 flex-wrap">
        <Link href={`/projects/${projectId}/bible`} className="text-[#A8B0D8] hover:text-[#F2F6FF] text-sm">← Bible</Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#A8B0D8] truncate">{projectTitle}</div>
          <div className="text-sm font-semibold text-[#2F6BFF]">Storyboard</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saving && <span className="text-xs text-[#A8B0D8]">Saving…</span>}
          {shots.length > 0 && (
            <span className="text-xs text-[#A8B0D8] bg-[#1E2140] px-2 py-1 rounded-lg">
              {approvedCount}/{shots.length} approved · {totalDuration}s
            </span>
          )}
          {shots.length > 1 && (
            <button onClick={animatic ? stopAnimatic : startAnimatic}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${animatic ? "bg-red-900/60 text-red-300 hover:bg-red-900" : "bg-[#1E2140] text-[#A8B0D8] hover:text-[#F2F6FF]"}`}>
              {animatic ? "⏹ Stop" : "▶ Animatic"}
            </button>
          )}
          {shots.length > 0 && approvedCount === shots.length && (
            <Link href={`/projects/${projectId}/timeline`}
              className="text-xs bg-[#6A4CFF] hover:bg-[#5636F0] text-white px-4 py-1.5 rounded-lg transition-colors">
              Timeline →
            </Link>
          )}
          <button onClick={generate} disabled={generating || !hasScript}
            title={!hasScript ? "Write your script first" : ""}
            className="text-xs bg-[#2F6BFF] hover:bg-[#2459E0] disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition-colors">
            {generating ? "Generating…" : "✨ Generate shots"}
          </button>
        </div>
      </div>

      {genError && (
        <div className="mx-6 mt-4 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{genError}</div>
      )}

      {/* Animatic overlay */}
      {animatic && shots[animIdx] && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center" onClick={stopAnimatic}>
          <div className="text-xs text-[#A8B0D8] mb-4">Shot {animIdx + 1} / {shots.length} — click to stop</div>
          <div className="w-full max-w-2xl aspect-video bg-[#121530] rounded-2xl border border-[#1E2140] flex flex-col items-center justify-center p-8">
            {shots[animIdx].imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shots[animIdx].imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <ShotPlaceholder shot={shots[animIdx]} large />
            )}
          </div>
          <div className="mt-4 text-sm text-[#A8B0D8] max-w-xl text-center">{shots[animIdx].description}</div>
          {shots[animIdx].dialogue && (
            <div className="mt-2 text-xs text-[#2BE4FF] italic">&ldquo;{shots[animIdx].dialogue}&rdquo;</div>
          )}
        </div>
      )}

      <div className="flex h-[calc(100vh-65px)]">
        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {shots.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center text-[#A8B0D8]">
              <div>
                <div className="text-5xl mb-4 font-black text-volt opacity-20">SB</div>
                <div className="font-medium mb-2">No shots yet</div>
                <div className="text-xs opacity-70 mb-6">Generate shots from your script, or add them manually per scene.</div>
                <button onClick={generate} disabled={generating || !hasScript}
                  className="text-sm bg-[#2F6BFF] hover:bg-[#2459E0] disabled:opacity-40 text-white px-6 py-3 rounded-xl transition-colors">
                  {generating ? "Generating…" : "Generate shots from script"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(scenes).map(([sceneId, sceneShots]) => (
                <div key={sceneId}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-semibold text-[#6A4CFF] uppercase tracking-wide">
                      {sceneShots[0]?.sceneTitle ?? sceneId}
                    </span>
                    <div className="flex-1 h-px bg-[#1E2140]" />
                    <button onClick={() => addShot(sceneId, sceneShots[0]?.sceneTitle ?? sceneId)}
                      className="text-xs text-[#A8B0D8] hover:text-[#F2F6FF] transition-colors">+ shot</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {sceneShots.map((shot) => (
                      <ShotCard key={shot.id} shot={shot}
                        selected={selected?.id === shot.id}
                        onClick={() => setSelected(selected?.id === shot.id ? null : shot)}
                        onApprove={() => toggleApprove(shot)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 border-l border-[#1E2140] overflow-y-auto flex-shrink-0">
            <ShotEditor shot={selected} onSave={updateShot} onDelete={() => deleteShot(selected.id)} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shot card ────────────────────────────────────────────────────────────────

function ShotCard({ shot, selected, onClick, onApprove }: {
  shot: Shot; selected: boolean;
  onClick: () => void; onApprove: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${
        selected ? "border-[#6A4CFF] ring-1 ring-[#6A4CFF]" : "border-[#1E2140] hover:border-[#6A4CFF]/50"
      } ${shot.status === "approved" ? "ring-1 ring-emerald-700/50" : ""}`}
    >
      {/* Frame */}
      <div className="aspect-video bg-[#0D0F1E] relative">
        {shot.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <ShotPlaceholder shot={shot} />
        )}
        {shot.status === "approved" && (
          <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px]">✓</div>
        )}
      </div>
      {/* Meta */}
      <div className="bg-[#121530] px-2 py-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-mono font-bold text-[#6A4CFF]">
            {TYPE_ABBR[shot.shotType] ?? shot.shotType.toUpperCase()}
          </span>
          <span className="text-[10px] text-[#A8B0D8]">{MOVE_ICON[shot.cameraMove] ?? ""} {shot.estimatedDuration}s</span>
        </div>
        <p className="text-[10px] text-[#A8B0D8] leading-tight mt-0.5 line-clamp-2">{shot.description || "No description"}</p>
        {shot.dialogue && (
          <p className="text-[9px] text-[#2BE4FF] italic mt-0.5 line-clamp-1">&ldquo;{shot.dialogue}&rdquo;</p>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(); }}
          className={`mt-1.5 w-full text-[9px] py-0.5 rounded transition-colors ${
            shot.status === "approved"
              ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
              : "bg-[#1E2140] text-[#A8B0D8] hover:text-[#F2F6FF]"
          }`}
        >
          {shot.status === "approved" ? "✓ Approved" : "Approve"}
        </button>
      </div>
    </div>
  );
}

function ShotPlaceholder({ shot, large }: { shot: Shot; large?: boolean }) {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${large ? "gap-3" : ""}`}>
      <span className={`font-mono font-bold text-[#6A4CFF] ${large ? "text-4xl" : "text-xs"}`}>
        {TYPE_ABBR[shot.shotType] ?? shot.shotType.toUpperCase()}
      </span>
      <span className={`text-[#A8B0D8] ${large ? "text-sm" : "text-[9px]"}`}>
        {shot.cameraAngle} · {MOVE_ICON[shot.cameraMove] ?? shot.cameraMove}
      </span>
    </div>
  );
}

// ── Shot editor (detail panel) ───────────────────────────────────────────────

function ShotEditor({ shot, onSave, onDelete }: { shot: Shot; onSave: (s: Shot) => void; onDelete: () => void }) {
  const [local, setLocal] = useState<Shot>(shot);
  useEffect(() => setLocal(shot), [shot]);
  const u = (patch: Partial<Shot>) => { const next = { ...local, ...patch }; setLocal(next); onSave(next); };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide">
          {local.sceneTitle} · Shot {local.shotNumber}
        </span>
        <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-400">Delete</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "shotType" as const, label: "Shot type", opts: ["wide","medium","close-up","extreme-close","over-shoulder","aerial","insert"] },
          { key: "cameraAngle" as const, label: "Angle", opts: ["eye-level","low-angle","high-angle","dutch"] },
          { key: "cameraMove" as const, label: "Movement", opts: ["static","pan","tilt","dolly","handheld","crane"] },
        ].map(({ key, label, opts }) => (
          <div key={key} className={key === "shotType" ? "col-span-2" : ""}>
            <label className="text-[10px] text-[#A8B0D8] block mb-1 uppercase tracking-wide">{label}</label>
            <select className="w-full bg-[#1E2140] text-[#F2F6FF] text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
              value={local[key]} onChange={(e) => u({ [key]: e.target.value })}>
              {opts.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="text-[10px] text-[#A8B0D8] block mb-1 uppercase tracking-wide">Duration (s)</label>
          <input type="number" min={1} max={30}
            className="w-full bg-[#1E2140] text-[#F2F6FF] text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
            value={local.estimatedDuration} onChange={(e) => u({ estimatedDuration: Number(e.target.value) })} />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-[#A8B0D8] block mb-1 uppercase tracking-wide">Description</label>
        <textarea rows={3} className="w-full bg-[#1E2140] text-[#F2F6FF] text-xs rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-[#6A4CFF]"
          value={local.description} onChange={(e) => u({ description: e.target.value })} />
      </div>

      <div>
        <label className="text-[10px] text-[#A8B0D8] block mb-1 uppercase tracking-wide">Dialogue</label>
        <textarea rows={2} className="w-full bg-[#1E2140] text-[#F2F6FF] text-xs rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-[#6A4CFF]"
          value={local.dialogue} onChange={(e) => u({ dialogue: e.target.value })} placeholder="Spoken lines in this shot…" />
      </div>

      <button onClick={() => u({ status: local.status === "approved" ? "draft" : "approved" })}
        className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
          local.status === "approved"
            ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
            : "bg-[#6A4CFF] hover:bg-[#5636F0] text-white"
        }`}>
        {local.status === "approved" ? "✓ Approved — click to revert" : "Approve shot"}
      </button>
    </div>
  );
}

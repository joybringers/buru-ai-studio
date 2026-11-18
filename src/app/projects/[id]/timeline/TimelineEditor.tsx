"use client";
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import BuruLogo from "@/components/BuruLogo";

type Shot = {
  id: string; sceneId: string; sceneTitle: string; shotNumber: number;
  shotType: string; cameraAngle: string; cameraMove: string;
  description: string; dialogue: string; estimatedDuration: number;
  imageUrl?: string; status: string;
};
type VoiceClip = { id: string; label: string; startSec: number; durationSec: number; character: string };
type MusicClip = { id: string; label: string; startSec: number; durationSec: number };

const TYPE_ABBR: Record<string, string> = {
  "wide": "WS", "medium": "MS", "close-up": "CU", "extreme-close": "ECU",
  "over-shoulder": "OTS", "aerial": "AIR", "insert": "INS",
};

const SCENE_COLORS = [
  "bg-[#6A4CFF]", "bg-[#2F6BFF]", "bg-[#2BE4FF]/70", "bg-purple-600",
  "bg-indigo-500", "bg-sky-500", "bg-teal-500", "bg-violet-600",
];

function cuid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function TimelineEditor({
  projectId, projectTitle, allShots, initialOrder,
  initialVoiceTrack, initialMusicTrack, lockedAt: initialLockedAt,
}: {
  projectId: string;
  projectTitle: string;
  allShots: Shot[];
  initialOrder: string[];
  initialVoiceTrack: VoiceClip[];
  initialMusicTrack: MusicClip[];
  lockedAt: string | null;
}) {
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [voiceTrack, setVoiceTrack] = useState<VoiceClip[]>(initialVoiceTrack);
  const [musicTrack, setMusicTrack] = useState<MusicClip[]>(initialMusicTrack);
  const [lockedAt, setLockedAt] = useState<string | null>(initialLockedAt);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);

  const shotMap = useMemo(() => Object.fromEntries(allShots.map((s) => [s.id, s])), [allShots]);
  const orderedShots = order.map((id) => shotMap[id]).filter(Boolean);

  // Assign consistent color per scene
  const sceneIds = useMemo(() => {
    const seen: string[] = [];
    orderedShots.forEach((s) => { if (!seen.includes(s.sceneId)) seen.push(s.sceneId); });
    return seen;
  }, [orderedShots]);
  const sceneColor = (sceneId: string) => SCENE_COLORS[sceneIds.indexOf(sceneId) % SCENE_COLORS.length];

  const totalDuration = orderedShots.reduce((s, sh) => s + sh.estimatedDuration, 0);

  // Cumulative offsets for the timeline ruler
  const offsets = useMemo(() => {
    const out: number[] = [];
    let cur = 0;
    orderedShots.forEach((s) => { out.push(cur); cur += s.estimatedDuration; });
    return out;
  }, [orderedShots]);

  const save = useCallback(async (newOrder: string[], newVoice?: VoiceClip[], newMusic?: MusicClip[]) => {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/timeline`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shotOrder: newOrder,
        voiceTrack: newVoice ?? voiceTrack,
        musicTrack: newMusic ?? musicTrack,
      }),
    });
    setSaving(false);
  }, [projectId, voiceTrack, musicTrack]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrder(next);
    save(next);
  };

  const removeShot = (idx: number) => {
    const next = order.filter((_, i) => i !== idx);
    setOrder(next);
    save(next);
  };

  const lock = async () => {
    setLocking(true);
    const res = await fetch(`/api/projects/${projectId}/timeline`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock: true }),
    });
    const data = await res.json();
    setLockedAt(data.lockedAt ?? new Date().toISOString());
    setLocking(false);
  };

  const unlock = async () => {
    await fetch(`/api/projects/${projectId}/timeline`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lock: false }),
    });
    setLockedAt(null);
  };

  const addVoiceClip = () => {
    const clip: VoiceClip = { id: cuid(), label: "Voice clip", character: "", startSec: 0, durationSec: 10 };
    const next = [...voiceTrack, clip];
    setVoiceTrack(next);
    save(order, next, musicTrack);
  };

  const addMusicClip = () => {
    const clip: MusicClip = { id: cuid(), label: "Music clip", startSec: 0, durationSec: totalDuration };
    const next = [...musicTrack, clip];
    setMusicTrack(next);
    save(order, voiceTrack, next);
  };

  const isLocked = !!lockedAt;

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF] flex flex-col">
      {/* Header */}
      <div className="border-b border-[#1E2140] bg-[#121530] px-6 py-4 flex items-center gap-4 flex-wrap flex-shrink-0">
        <Link href="/" style={{ textDecoration: "none" }} className="shrink-0"><BuruLogo /></Link>
        <Link href={`/projects/${projectId}/storyboard`} className="text-[#A8B0D8] hover:text-[#F2F6FF] text-sm">← Storyboard</Link>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#A8B0D8] truncate">{projectTitle}</div>
          <div className="text-sm font-semibold text-[#2BE4FF]">Timeline</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saving && <span className="text-xs text-[#A8B0D8]">Saving…</span>}
          <span className="text-xs bg-[#1E2140] text-[#A8B0D8] px-2 py-1 rounded-lg font-mono">
            {orderedShots.length} shots · {totalDuration}s total
          </span>
          {isLocked ? (
            <>
              <span className="text-xs bg-emerald-900/40 text-emerald-400 px-3 py-1 rounded-lg">Locked</span>
              <button onClick={unlock} className="text-xs text-[#A8B0D8] hover:text-[#F2F6FF] transition-colors">Unlock</button>
              <Link href={`/projects/${projectId}/export`}
                className="text-xs bg-[#6A4CFF] hover:bg-[#5636F0] text-white px-4 py-1.5 rounded-lg transition-colors">
                Export →
              </Link>
            </>
          ) : (
            <button onClick={lock} disabled={locking || orderedShots.length === 0}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition-colors">
              {locking ? "Locking…" : "Lock Timeline"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Visual timeline strip */}
        {orderedShots.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide mb-3">Video track</h2>
            <div className="relative">
              {/* Time ruler */}
              <div className="flex mb-1 text-[9px] text-[#4A5280] font-mono">
                {orderedShots.map((s, i) => (
                  <div key={s.id} style={{ flex: s.estimatedDuration }} className="border-l border-[#1E2140] pl-1 truncate">
                    {offsets[i]}s
                  </div>
                ))}
                <div className="border-l border-[#1E2140] pl-1 text-[9px]">{totalDuration}s</div>
              </div>
              {/* Shot strip */}
              <div className="flex h-20 rounded-xl overflow-hidden border border-[#1E2140]">
                {orderedShots.map((s) => (
                  <div
                    key={s.id}
                    style={{ flex: s.estimatedDuration }}
                    className={`relative flex flex-col justify-end p-1 border-r border-black/30 ${sceneColor(s.sceneId)} bg-opacity-30`}
                    title={`${s.sceneTitle} – Shot ${s.shotNumber}: ${s.description}`}
                  >
                    <span className="text-[8px] font-mono font-bold text-white/90 leading-none">
                      {TYPE_ABBR[s.shotType] ?? s.shotType.slice(0, 3).toUpperCase()}
                    </span>
                    <span className="text-[8px] text-white/60">{s.estimatedDuration}s</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voice track */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide">Voice track</h2>
            {!isLocked && (
              <button onClick={addVoiceClip}
                className="text-xs text-[#6A4CFF] hover:text-[#A88FFF] transition-colors">+ Add clip</button>
            )}
          </div>
          {voiceTrack.length === 0 ? (
            <div className="border border-dashed border-[#1E2140] rounded-xl px-4 py-5 text-center text-xs text-[#4A5280]">
              Voice recording will be added in the render step — add a placeholder here to map timing.
            </div>
          ) : (
            <div className="space-y-2">
              {voiceTrack.map((clip, i) => (
                <VoiceClipRow key={clip.id} clip={clip}
                  disabled={isLocked}
                  onChange={(c) => { const next = voiceTrack.map((x, j) => j === i ? c : x); setVoiceTrack(next); save(order, next, musicTrack); }}
                  onDelete={() => { const next = voiceTrack.filter((_, j) => j !== i); setVoiceTrack(next); save(order, next, musicTrack); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Music track */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide">Music track</h2>
            {!isLocked && (
              <button onClick={addMusicClip}
                className="text-xs text-[#6A4CFF] hover:text-[#A88FFF] transition-colors">+ Add clip</button>
            )}
          </div>
          {musicTrack.length === 0 ? (
            <div className="border border-dashed border-[#1E2140] rounded-xl px-4 py-5 text-center text-xs text-[#4A5280]">
              AI music generation will be added in the render step — add a placeholder here to map timing.
            </div>
          ) : (
            <div className="space-y-2">
              {musicTrack.map((clip, i) => (
                <MusicClipRow key={clip.id} clip={clip}
                  disabled={isLocked}
                  onChange={(c) => { const next = musicTrack.map((x, j) => j === i ? c : x); setMusicTrack(next); save(order, voiceTrack, next); }}
                  onDelete={() => { const next = musicTrack.filter((_, j) => j !== i); setMusicTrack(next); save(order, voiceTrack, next); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Shot sequence list */}
        <div>
          <h2 className="text-xs font-semibold text-[#A8B0D8] uppercase tracking-wide mb-3">Shot sequence</h2>
          {orderedShots.length === 0 ? (
            <div className="border border-dashed border-[#1E2140] rounded-xl px-4 py-10 text-center text-xs text-[#4A5280]">
              No approved shots yet — go back to the storyboard and approve your shots.
            </div>
          ) : (
            <div className="space-y-2">
              {orderedShots.map((shot, idx) => {
                const cumStart = offsets[idx];
                return (
                  <div key={shot.id}
                    className={`flex items-center gap-3 bg-[#121530] border rounded-xl px-4 py-3 ${
                      isLocked ? "border-[#1E2140]" : "border-[#1E2140] hover:border-[#6A4CFF]/40 transition-colors"
                    }`}
                  >
                    {/* Color swatch */}
                    <div className={`w-2 h-10 rounded-full flex-shrink-0 ${sceneColor(shot.sceneId)}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono font-bold text-[#6A4CFF]">
                          {String(idx + 1).padStart(2, "0")} · {TYPE_ABBR[shot.shotType] ?? shot.shotType.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#A8B0D8]">{shot.sceneTitle}</span>
                        <span className="text-xs text-[#4A5280] font-mono ml-auto">{cumStart}s → {cumStart + shot.estimatedDuration}s</span>
                      </div>
                      <p className="text-xs text-[#F2F6FF] truncate">{shot.description || "No description"}</p>
                      {shot.dialogue && (
                        <p className="text-[10px] text-[#2BE4FF] italic truncate">&ldquo;{shot.dialogue}&rdquo;</p>
                      )}
                    </div>

                    {/* Duration edit */}
                    {!isLocked && (
                      <input type="number" min={1} max={30}
                        className="w-14 bg-[#1E2140] text-[#F2F6FF] text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#6A4CFF] text-center"
                        value={shot.estimatedDuration}
                        onChange={(e) => {
                          // Update the shot duration in storyboard via inline patch
                          // We update our local display but the storyboard owns this data
                          const updated = orderedShots.map((s, j) =>
                            j === idx ? { ...s, estimatedDuration: Number(e.target.value) } : s
                          );
                          // Persist shot duration changes to storyboard
                          fetch(`/api/projects/${projectId}/storyboard`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ shots: allShots.map((s) => {
                              const up = updated.find((u) => u.id === s.id);
                              return up ? { ...s, estimatedDuration: up.estimatedDuration } : s;
                            })}),
                          });
                        }}
                      />
                    )}
                    <span className="text-[10px] text-[#4A5280]">s</span>

                    {/* Reorder + remove */}
                    {!isLocked && (
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => move(idx, -1)} disabled={idx === 0}
                          className="text-[#A8B0D8] hover:text-[#F2F6FF] disabled:opacity-20 text-xs leading-none px-1">▲</button>
                        <button onClick={() => move(idx, 1)} disabled={idx === orderedShots.length - 1}
                          className="text-[#A8B0D8] hover:text-[#F2F6FF] disabled:opacity-20 text-xs leading-none px-1">▼</button>
                      </div>
                    )}
                    {!isLocked && (
                      <button onClick={() => removeShot(idx)}
                        className="text-[#4A5280] hover:text-red-400 text-xs px-1 transition-colors">✕</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Track row helpers ────────────────────────────────────────────────────────

function VoiceClipRow({ clip, disabled, onChange, onDelete }: {
  clip: VoiceClip; disabled: boolean;
  onChange: (c: VoiceClip) => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#121530] border border-[#1E2140] rounded-xl px-4 py-2">
      <span className="text-sm font-bold text-volt opacity-60">VO</span>
      <input className="flex-1 bg-transparent text-sm text-[#F2F6FF] outline-none" disabled={disabled}
        value={clip.label} onChange={(e) => onChange({ ...clip, label: e.target.value })} placeholder="Clip label" />
      <input className="w-24 bg-[#1E2140] text-xs text-[#F2F6FF] rounded-lg px-2 py-1 outline-none" disabled={disabled}
        value={clip.character} onChange={(e) => onChange({ ...clip, character: e.target.value })} placeholder="Character" />
      <span className="text-xs text-[#A8B0D8]">@</span>
      <input type="number" min={0} className="w-14 bg-[#1E2140] text-xs text-[#F2F6FF] rounded-lg px-2 py-1 text-center outline-none" disabled={disabled}
        value={clip.startSec} onChange={(e) => onChange({ ...clip, startSec: Number(e.target.value) })} />
      <span className="text-xs text-[#A8B0D8]">s</span>
      <input type="number" min={1} className="w-14 bg-[#1E2140] text-xs text-[#F2F6FF] rounded-lg px-2 py-1 text-center outline-none" disabled={disabled}
        value={clip.durationSec} onChange={(e) => onChange({ ...clip, durationSec: Number(e.target.value) })} />
      <span className="text-xs text-[#A8B0D8]">s</span>
      {!disabled && <button onClick={onDelete} className="text-[#4A5280] hover:text-red-400 text-xs">✕</button>}
    </div>
  );
}

function MusicClipRow({ clip, disabled, onChange, onDelete }: {
  clip: MusicClip; disabled: boolean;
  onChange: (c: MusicClip) => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#121530] border border-[#1E2140] rounded-xl px-4 py-2">
      <span className="text-sm font-bold text-arc opacity-60">MU</span>
      <input className="flex-1 bg-transparent text-sm text-[#F2F6FF] outline-none" disabled={disabled}
        value={clip.label} onChange={(e) => onChange({ ...clip, label: e.target.value })} placeholder="Music description / mood" />
      <span className="text-xs text-[#A8B0D8]">@</span>
      <input type="number" min={0} className="w-14 bg-[#1E2140] text-xs text-[#F2F6FF] rounded-lg px-2 py-1 text-center outline-none" disabled={disabled}
        value={clip.startSec} onChange={(e) => onChange({ ...clip, startSec: Number(e.target.value) })} />
      <span className="text-xs text-[#A8B0D8]">s</span>
      <input type="number" min={1} className="w-14 bg-[#1E2140] text-xs text-[#F2F6FF] rounded-lg px-2 py-1 text-center outline-none" disabled={disabled}
        value={clip.durationSec} onChange={(e) => onChange({ ...clip, durationSec: Number(e.target.value) })} />
      <span className="text-xs text-[#A8B0D8]">s</span>
      {!disabled && <button onClick={onDelete} className="text-[#4A5280] hover:text-red-400 text-xs">✕</button>}
    </div>
  );
}

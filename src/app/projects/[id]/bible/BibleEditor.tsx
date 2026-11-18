"use client";
import { useState, useCallback } from "react";
import Link from "next/link";

type Character = {
  id: string; name: string; role: string; age: string;
  description: string; personality: string; motivation: string;
};
type Location = {
  id: string; name: string; type: string; description: string;
  mood: string; timeOfDay: string;
};
type Prop = {
  id: string; name: string; description: string; usedBy: string; scenes: string[];
};
type Bible = {
  characters: Character[];
  locations: Location[];
  props: Prop[];
  styleNotes: string;
};

type Tab = "characters" | "locations" | "props" | "style";

const ROLE_COLORS: Record<string, string> = {
  protagonist: "bg-[#6A4CFF]/20 text-[#A88FFF]",
  antagonist: "bg-red-900/30 text-red-400",
  supporting: "bg-[#2F6BFF]/20 text-[#7BA5FF]",
  minor: "bg-[#1E2140] text-[#A8B0D8]",
};

function cuid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function BibleEditor({
  projectId, projectTitle, hasScript, initialBible,
}: {
  projectId: string;
  projectTitle: string;
  hasScript: boolean;
  initialBible: Bible | null;
}) {
  const [bible, setBible] = useState<Bible>(
    initialBible ?? { characters: [], locations: [], props: [], styleNotes: "" }
  );
  const [tab, setTab] = useState<Tab>("characters");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState("");

  const save = useCallback(async (patch: Partial<Bible>) => {
    setSaving(true);
    const next = { ...bible, ...patch };
    setBible(next);
    await fetch(`/api/projects/${projectId}/bible`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
  }, [bible, projectId]);

  const generate = async () => {
    setGenerating(true);
    setGenError("");
    const res = await fetch(`/api/projects/${projectId}/bible/generate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setGenError(data.error ?? "Generation failed"); setGenerating(false); return; }
    setBible({
      characters: data.characters ?? [],
      locations: data.locations ?? [],
      props: data.props ?? [],
      styleNotes: data.styleNotes ?? "",
    });
    setGenerating(false);
  };

  const totalEntries = bible.characters.length + bible.locations.length + bible.props.length;

  return (
    <div className="min-h-screen bg-[#090B1A] text-[#F2F6FF]">
      {/* Header */}
      <div className="border-b border-[#1E2140] bg-[#121530] px-6 py-4 flex items-center gap-4">
        <Link href={`/projects/${projectId}/script`} className="text-[#A8B0D8] hover:text-[#F2F6FF] text-sm">← Script</Link>
        <div className="flex-1">
          <div className="text-xs text-[#A8B0D8]">{projectTitle}</div>
          <div className="text-sm font-semibold text-[#2BE4FF]">Story Bible</div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-[#A8B0D8]">Saving…</span>}
          {totalEntries > 0 && (
            <Link
              href={`/projects/${projectId}/storyboard`}
              className="text-xs bg-[#6A4CFF] hover:bg-[#5636F0] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Next: Storyboard →
            </Link>
          )}
          <button
            onClick={generate}
            disabled={generating || !hasScript}
            title={!hasScript ? "Write your script first" : ""}
            className="text-xs bg-[#2F6BFF] hover:bg-[#2459E0] disabled:opacity-40 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {generating ? "Generating…" : "Generate from Script"}
          </button>
        </div>
      </div>

      {genError && (
        <div className="mx-6 mt-4 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
          {genError}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#1E2140] bg-[#121530] px-6 flex gap-1">
        {(["characters", "locations", "props", "style"] as Tab[]).map((t) => {
          const counts: Record<Tab, number | null> = {
            characters: bible.characters.length,
            locations: bible.locations.length,
            props: bible.props.length,
            style: null,
          };
          const labels: Record<Tab, string> = {
            characters: "Characters",
            locations: "Locations",
            props: "Props",
            style: "Style",
          };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-[#6A4CFF] text-[#F2F6FF]"
                  : "border-transparent text-[#A8B0D8] hover:text-[#F2F6FF]"
              }`}
            >
              {labels[t]}{counts[t] !== null && counts[t]! > 0 && (
                <span className="ml-1.5 text-xs bg-[#1E2140] px-1.5 py-0.5 rounded-full">{counts[t]}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Characters */}
        {tab === "characters" && (
          <CharactersPanel
            characters={bible.characters}
            onChange={(chars) => save({ characters: chars })}
          />
        )}
        {/* Locations */}
        {tab === "locations" && (
          <LocationsPanel
            locations={bible.locations}
            onChange={(locs) => save({ locations: locs })}
          />
        )}
        {/* Props */}
        {tab === "props" && (
          <PropsPanel
            props={bible.props}
            onChange={(p) => save({ props: p })}
          />
        )}
        {/* Style */}
        {tab === "style" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[#A8B0D8]">Visual style & tone</h2>
            </div>
            <textarea
              rows={10}
              className="w-full bg-[#121530] border border-[#1E2140] text-[#F2F6FF] text-sm rounded-xl px-4 py-3 resize-none outline-none focus:border-[#6A4CFF] transition-colors"
              placeholder="Describe the visual style, colour palette, lighting mood, pacing, and overall tone of the film…"
              value={bible.styleNotes}
              onChange={(e) => setBible((b) => ({ ...b, styleNotes: e.target.value }))}
              onBlur={() => save({ styleNotes: bible.styleNotes })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Characters panel ─────────────────────────────────────────────────────────

function CharactersPanel({ characters, onChange }: { characters: Character[]; onChange: (c: Character[]) => void }) {
  const [editing, setEditing] = useState<Character | null>(null);

  const addNew = () => {
    const c: Character = { id: cuid(), name: "New Character", role: "supporting", age: "", description: "", personality: "", motivation: "" };
    onChange([...characters, c]);
    setEditing(c);
  };

  const saveEdit = (c: Character) => {
    onChange(characters.map((x) => (x.id === c.id ? c : x)));
    setEditing(c);
  };

  const remove = (id: string) => { onChange(characters.filter((c) => c.id !== id)); setEditing(null); };

  return (
    <div className="flex gap-6">
      <div className="w-56 flex-shrink-0 space-y-2">
        {characters.map((c) => (
          <button
            key={c.id}
            onClick={() => setEditing(c)}
            className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${editing?.id === c.id ? "border-[#6A4CFF] bg-[#1E2140]" : "border-[#1E2140] bg-[#121530] hover:border-[#6A4CFF]/50"}`}
          >
            <div className="text-sm font-medium text-[#F2F6FF] truncate">{c.name}</div>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${ROLE_COLORS[c.role] ?? ROLE_COLORS.minor}`}>{c.role}</span>
          </button>
        ))}
        <button onClick={addNew} className="w-full text-left rounded-xl px-4 py-3 border border-dashed border-[#1E2140] text-[#A8B0D8] hover:border-[#6A4CFF] hover:text-[#F2F6FF] text-sm transition-colors">
          + Add character
        </button>
      </div>
      <div className="flex-1">
        {editing ? (
          <CharacterForm char={editing} onSave={saveEdit} onDelete={() => remove(editing.id)} />
        ) : (
          <div className="text-center text-[#A8B0D8] text-sm py-20">Select a character to edit</div>
        )}
      </div>
    </div>
  );
}

function CharacterForm({ char, onSave, onDelete }: { char: Character; onSave: (c: Character) => void; onDelete: () => void }) {
  const [local, setLocal] = useState<Character>(char);
  const u = (patch: Partial<Character>) => { const next = { ...local, ...patch }; setLocal(next); onSave(next); };

  return (
    <div className="space-y-4 bg-[#121530] border border-[#1E2140] rounded-xl p-5">
      <div className="flex items-center gap-3">
        <input className="flex-1 bg-transparent text-lg font-semibold text-[#F2F6FF] border-b border-[#1E2140] focus:border-[#6A4CFF] outline-none pb-1"
          value={local.name} onChange={(e) => u({ name: e.target.value })} placeholder="Character name" />
        <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-400 px-2 py-1">Delete</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#A8B0D8] block mb-1">Role</label>
          <select className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
            value={local.role} onChange={(e) => u({ role: e.target.value })}>
            {["protagonist","antagonist","supporting","minor"].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#A8B0D8] block mb-1">Age</label>
          <input className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
            value={local.age} onChange={(e) => u({ age: e.target.value })} placeholder="e.g. late 20s" />
        </div>
      </div>
      {[
        { key: "description" as const, label: "Appearance" },
        { key: "personality" as const, label: "Personality" },
        { key: "motivation" as const, label: "Motivation" },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="text-xs text-[#A8B0D8] block mb-1">{label}</label>
          <textarea rows={2} className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-[#6A4CFF]"
            value={local[key]} onChange={(e) => u({ [key]: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

// ── Locations panel ──────────────────────────────────────────────────────────

function LocationsPanel({ locations, onChange }: { locations: Location[]; onChange: (l: Location[]) => void }) {
  const [editing, setEditing] = useState<Location | null>(null);

  const addNew = () => {
    const l: Location = { id: cuid(), name: "New Location", type: "exterior", description: "", mood: "", timeOfDay: "day" };
    onChange([...locations, l]);
    setEditing(l);
  };
  const saveEdit = (l: Location) => { onChange(locations.map((x) => (x.id === l.id ? l : x))); setEditing(l); };
  const remove = (id: string) => { onChange(locations.filter((l) => l.id !== id)); setEditing(null); };

  return (
    <div className="flex gap-6">
      <div className="w-56 flex-shrink-0 space-y-2">
        {locations.map((l) => (
          <button key={l.id} onClick={() => setEditing(l)}
            className={`w-full text-left rounded-xl px-4 py-3 border transition-colors ${editing?.id === l.id ? "border-[#2F6BFF] bg-[#1E2140]" : "border-[#1E2140] bg-[#121530] hover:border-[#2F6BFF]/50"}`}>
            <div className="text-sm font-medium text-[#F2F6FF] truncate">{l.name}</div>
            <div className="text-xs text-[#A8B0D8]">{l.type} · {l.timeOfDay}</div>
          </button>
        ))}
        <button onClick={addNew} className="w-full text-left rounded-xl px-4 py-3 border border-dashed border-[#1E2140] text-[#A8B0D8] hover:border-[#2F6BFF] hover:text-[#F2F6FF] text-sm transition-colors">
          + Add location
        </button>
      </div>
      <div className="flex-1">
        {editing ? (
          <LocationForm loc={editing} onSave={saveEdit} onDelete={() => remove(editing.id)} />
        ) : (
          <div className="text-center text-[#A8B0D8] text-sm py-20">Select a location to edit</div>
        )}
      </div>
    </div>
  );
}

function LocationForm({ loc, onSave, onDelete }: { loc: Location; onSave: (l: Location) => void; onDelete: () => void }) {
  const [local, setLocal] = useState<Location>(loc);
  const u = (patch: Partial<Location>) => { const next = { ...local, ...patch }; setLocal(next); onSave(next); };

  return (
    <div className="space-y-4 bg-[#121530] border border-[#1E2140] rounded-xl p-5">
      <div className="flex items-center gap-3">
        <input className="flex-1 bg-transparent text-lg font-semibold text-[#F2F6FF] border-b border-[#1E2140] focus:border-[#2F6BFF] outline-none pb-1"
          value={local.name} onChange={(e) => u({ name: e.target.value })} placeholder="Location name" />
        <button onClick={onDelete} className="text-xs text-red-500 hover:text-red-400 px-2 py-1">Delete</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#A8B0D8] block mb-1">Type</label>
          <select className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#2F6BFF]"
            value={local.type} onChange={(e) => u({ type: e.target.value })}>
            {["exterior","interior"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#A8B0D8] block mb-1">Time of day</label>
          <select className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#2F6BFF]"
            value={local.timeOfDay} onChange={(e) => u({ timeOfDay: e.target.value })}>
            {["day","night","dawn","dusk","varies"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
      {[
        { key: "description" as const, label: "Visual description" },
        { key: "mood" as const, label: "Mood / atmosphere" },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="text-xs text-[#A8B0D8] block mb-1">{label}</label>
          <textarea rows={2} className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-[#2F6BFF]"
            value={local[key]} onChange={(e) => u({ [key]: e.target.value })} />
        </div>
      ))}
    </div>
  );
}

// ── Props panel ──────────────────────────────────────────────────────────────

function PropsPanel({ props, onChange }: { props: Prop[]; onChange: (p: Prop[]) => void }) {
  const addNew = () => onChange([...props, { id: cuid(), name: "New Prop", description: "", usedBy: "", scenes: [] }]);
  const update = (id: string, patch: Partial<Prop>) => onChange(props.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => onChange(props.filter((p) => p.id !== id));

  return (
    <div className="space-y-3">
      {props.map((p) => (
        <div key={p.id} className="bg-[#121530] border border-[#1E2140] rounded-xl p-4 flex gap-4 items-start">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#A8B0D8] block mb-1">Prop name</label>
              <input className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
                value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-[#A8B0D8] block mb-1">Used by</label>
              <input className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
                value={p.usedBy} onChange={(e) => update(p.id, { usedBy: e.target.value })} placeholder="Character name" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[#A8B0D8] block mb-1">Description & significance</label>
              <textarea rows={2} className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-[#6A4CFF]"
                value={p.description} onChange={(e) => update(p.id, { description: e.target.value })} />
            </div>
          </div>
          <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:text-red-400 mt-1 px-2 py-1 flex-shrink-0">✕</button>
        </div>
      ))}
      <button onClick={addNew} className="w-full rounded-xl px-4 py-3 border border-dashed border-[#1E2140] text-[#A8B0D8] hover:border-[#6A4CFF] hover:text-[#F2F6FF] text-sm transition-colors">
        + Add prop
      </button>
    </div>
  );
}

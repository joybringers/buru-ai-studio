"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

type Scene = {
  id: string;
  title: string;
  location: string;
  timeOfDay: string;
  characters: string[];
  action: string;
  dialogue: { character: string; line: string }[];
  estimatedDuration: number;
};

type Message = { id?: string; role: "user" | "assistant"; content: string };

type Props = {
  initialData: {
    id: string;
    title: string;
    targetLength: number;
    scenes: Scene[];
    messages: Message[];
    spentCredits: number;
    hardCap: number | null;
  };
};

export default function ScriptEditor({ initialData }: Props) {
  const [scenes, setScenes] = useState<Scene[]>(initialData.scenes);
  const [messages, setMessages] = useState<Message[]>(initialData.messages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [saving, setSaving] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const totalDuration = scenes.reduce((s, sc) => s + (sc.estimatedDuration ?? 0), 0);
  const pct = Math.min(100, Math.round((totalDuration / initialData.targetLength) * 100));
  const over = totalDuration > initialData.targetLength;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch(`/api/projects/${initialData.id}/script/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = dec.decode(value).split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) { full += parsed.text; setStreamingText(full); }
            if (parsed.scenes) setScenes(parsed.scenes);
            if (parsed.error) throw new Error(parsed.error);
          } catch { /* skip bad lines */ }
        }
      }
      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${err instanceof Error ? err.message : "unknown error"}` },
      ]);
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  }, [input, streaming, initialData.id]);

  const saveScene = useCallback(async (scene: Scene) => {
    setSaving(true);
    const updated = scenes.map((s) => (s.id === scene.id ? scene : s));
    setScenes(updated);
    setSelectedScene(scene);
    await fetch(`/api/projects/${initialData.id}/script`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenes: updated }),
    });
    setSaving(false);
  }, [scenes, initialData.id]);

  return (
    <div className="flex h-screen bg-[#090B1A] text-[#F2F6FF] overflow-hidden">
      {/* Left: Chat */}
      <div className="flex flex-col w-full max-w-sm lg:max-w-md border-r border-[#1E2140] flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1E2140] bg-[#121530] flex items-center gap-3">
          <Link href={`/projects/${initialData.id}/quote`} className="text-[#A8B0D8] hover:text-[#F2F6FF] text-sm">←</Link>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#A8B0D8] truncate">{initialData.title}</div>
            <div className="text-xs font-semibold text-[#6A4CFF]">Script Assistant</div>
          </div>
          <div className={`text-xs font-mono px-2 py-0.5 rounded ${over ? "bg-red-900/60 text-red-300" : "bg-[#1E2140] text-[#A8B0D8]"}`}>
            {totalDuration}s / {initialData.targetLength}s
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-[#A8B0D8] text-sm py-12">
              <div className="text-3xl mb-3">✍️</div>
              <div className="font-medium mb-1">Start your script</div>
              <div className="text-xs opacity-70">Describe your film idea and I&apos;ll help you build it scene by scene.</div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#6A4CFF] text-white rounded-br-sm"
                  : "bg-[#1E2140] text-[#F2F6FF] rounded-bl-sm"
              }`}>
                {msg.content.replace(/```json[\s\S]*?```/g, "").trim()}
              </div>
            </div>
          ))}
          {streaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 text-sm bg-[#1E2140] text-[#F2F6FF] whitespace-pre-wrap">
                {streamingText.replace(/```json[\s\S]*?```/g, "").trim()}
                <span className="inline-block w-1.5 h-3.5 bg-[#6A4CFF] ml-0.5 animate-pulse" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#1E2140] bg-[#121530]">
          <div className="flex gap-2">
            <textarea
              className="flex-1 bg-[#1E2140] text-[#F2F6FF] placeholder-[#4A5280] text-sm rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#6A4CFF] min-h-[40px] max-h-32"
              placeholder="Describe your film or ask for changes…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              className="px-3 py-2 rounded-xl bg-[#6A4CFF] hover:bg-[#5636F0] disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              {streaming ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Right: Scene editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline bar */}
        <div className="px-6 py-3 border-b border-[#1E2140] bg-[#121530] flex items-center gap-4">
          <span className="text-xs text-[#A8B0D8] font-medium">{scenes.length} scene{scenes.length !== 1 ? "s" : ""}</span>
          <div className="flex-1 h-1.5 bg-[#1E2140] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-gradient-to-r from-[#6A4CFF] to-[#2BE4FF]"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-xs font-mono ${over ? "text-red-400" : "text-[#A8B0D8]"}`}>{pct}%</span>
          {saving && <span className="text-xs text-[#6A4CFF]">Saving…</span>}
          {scenes.length > 0 && (
            <a
              href={`/projects/${initialData.id}/bible`}
              className="text-xs bg-[#2BE4FF]/10 hover:bg-[#2BE4FF]/20 text-[#2BE4FF] px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
            >
              📖 Story Bible →
            </a>
          )}
        </div>

        {scenes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[#A8B0D8] text-sm text-center px-8">
            <div>
              <div className="text-4xl mb-4">🎬</div>
              <div className="font-medium mb-2">No scenes yet</div>
              <div className="text-xs opacity-70">Chat with the assistant to generate your first scene.</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Scene list */}
            <div className="w-56 border-r border-[#1E2140] overflow-y-auto py-2">
              {scenes.map((sc, i) => (
                <button
                  key={sc.id}
                  onClick={() => setSelectedScene(sc)}
                  className={`w-full text-left px-4 py-3 border-b border-[#1E2140]/50 hover:bg-[#1E2140]/60 transition-colors ${selectedScene?.id === sc.id ? "bg-[#1E2140]" : ""}`}
                >
                  <div className="text-xs font-semibold text-[#6A4CFF] mb-0.5">Scene {i + 1}</div>
                  <div className="text-xs text-[#F2F6FF] truncate">{sc.title || "Untitled"}</div>
                  <div className="text-xs text-[#A8B0D8]">{sc.estimatedDuration}s · {sc.location}</div>
                </button>
              ))}
            </div>

            {/* Scene detail / editor */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {selectedScene ? (
                <SceneDetailEditor scene={selectedScene} onSave={saveScene} />
              ) : (
                <div className="text-[#A8B0D8] text-sm text-center py-20">Select a scene to edit</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneDetailEditor({ scene, onSave }: { scene: Scene; onSave: (s: Scene) => void }) {
  const [local, setLocal] = useState<Scene>(scene);

  useEffect(() => setLocal(scene), [scene]);

  const update = (patch: Partial<Scene>) => setLocal((s) => ({ ...s, ...patch }));

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <input
          className="bg-transparent text-lg font-semibold text-[#F2F6FF] border-b border-[#1E2140] focus:border-[#6A4CFF] outline-none w-full pb-1"
          value={local.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Scene title"
        />
        <button
          onClick={() => onSave(local)}
          className="ml-4 px-3 py-1.5 bg-[#6A4CFF] hover:bg-[#5636F0] text-white text-xs rounded-lg transition-colors whitespace-nowrap"
        >
          Save
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-[#A8B0D8] block mb-1">Location</label>
          <input className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
            value={local.location} onChange={(e) => update({ location: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-[#A8B0D8] block mb-1">Time of day</label>
          <select className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
            value={local.timeOfDay} onChange={(e) => update({ timeOfDay: e.target.value })}>
            {["day","night","dawn","dusk","interior"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#A8B0D8] block mb-1">Duration (s)</label>
          <input type="number" min={15} max={90}
            className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
            value={local.estimatedDuration} onChange={(e) => update({ estimatedDuration: Number(e.target.value) })} />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#A8B0D8] block mb-1">Action</label>
        <textarea rows={3}
          className="w-full bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-[#6A4CFF]"
          value={local.action} onChange={(e) => update({ action: e.target.value })} />
      </div>

      <div>
        <label className="text-xs text-[#A8B0D8] block mb-2">Dialogue</label>
        <div className="space-y-2">
          {local.dialogue.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                className="w-28 bg-[#1E2140] text-[#6A4CFF] text-xs font-semibold rounded-lg px-2 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF] uppercase"
                value={line.character}
                onChange={(e) => {
                  const d = [...local.dialogue];
                  d[i] = { ...d[i], character: e.target.value };
                  update({ dialogue: d });
                }}
              />
              <input
                className="flex-1 bg-[#1E2140] text-[#F2F6FF] text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#6A4CFF]"
                value={line.line}
                onChange={(e) => {
                  const d = [...local.dialogue];
                  d[i] = { ...d[i], line: e.target.value };
                  update({ dialogue: d });
                }}
              />
              <button onClick={() => update({ dialogue: local.dialogue.filter((_, j) => j !== i) })}
                className="text-[#A8B0D8] hover:text-red-400 text-xs px-1 py-2">✕</button>
            </div>
          ))}
          <button
            onClick={() => update({ dialogue: [...local.dialogue, { character: "", line: "" }] })}
            className="text-xs text-[#6A4CFF] hover:text-[#2BE4FF] transition-colors"
          >
            + Add line
          </button>
        </div>
      </div>
    </div>
  );
}

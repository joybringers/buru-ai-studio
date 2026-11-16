"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

type Message = {
  role: "user" | "assistant";
  content: string;
  creation?: CreationCard;
};

type CreationCard = {
  title: string;
  prompt: string;
  model: string;
  ratio: string;
  credits: string;
};

const SUGGESTIONS = [
  "Create a cinematic product ad for a luxury watch",
  "Make a social reel for a coffee brand launch",
  "Design a bold concert poster for a jazz festival",
  "Generate a 30-second ambient track for a spa",
  "Create a sci-fi landscape at sunset",
  "Make a UGC-style ad for a skincare serum",
];

function parseCreation(text: string): { cleanText: string; creation: CreationCard | null } {
  const match = text.match(/\[CREATE\]([\s\S]*?)\[\/CREATE\]/);
  if (!match) return { cleanText: text, creation: null };

  const cleanText = text.replace(/\[CREATE\][\s\S]*?\[\/CREATE\]/, "").trim();
  const lines = match[1].trim().split("\n");
  const data: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx > -1) {
      data[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
  }

  if (!data.prompt || !data.model) return { cleanText: text, creation: null };

  return {
    cleanText,
    creation: {
      title: data.title ?? "Creation",
      prompt: data.prompt,
      model: data.model,
      ratio: data.ratio ?? "1:1",
      credits: data.credits ?? "0",
    },
  };
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;
      const userMsg: Message = { role: "user", content: text.trim() };
      const history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      setIsStreaming(true);

      const apiMessages: MessageParam[] = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      let accumulated = "";
      const assistantIdx = history.length;

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!res.ok || !res.body) throw new Error("Chat request failed");

        const reader = res.body.getReader();
        const dec = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += dec.decode(value, { stream: true });
          const { cleanText, creation } = parseCreation(accumulated);
          setMessages((prev) => {
            const next = [...prev];
            next[assistantIdx] = { role: "assistant", content: cleanText, creation: creation ?? undefined };
            return next;
          });
        }
      } catch {
        setMessages((prev) => {
          const next = [...prev];
          next[assistantIdx] = { role: "assistant", content: "Something went wrong. Please try again." };
          return next;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function goGenerate(card: CreationCard) {
    const params = new URLSearchParams({
      prompt: card.prompt,
      model: card.model,
      ratio: card.ratio,
    });
    router.push(`/studio?${params.toString()}`);
  }

  return (
    <div className="flex flex-col min-h-screen max-w-3xl mx-auto px-4">

      {/* Header */}
      <div className="pt-10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-white">Chat Mode</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Describe what you want. I&apos;ll make it real.</p>
        </div>
        <Link
          href="/create"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors tracking-widest uppercase"
        >
          Quick Starts →
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-6 pb-4">
        {messages.length === 0 && (
          <div className="pt-10 space-y-6">
            <p className="text-center text-zinc-600 text-sm tracking-wide">
              What do you want to create today?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-sm transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] space-y-3 ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm"
                }`}
              >
                {msg.content || (isStreaming && i === messages.length - 1 && (
                  <span className="inline-flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ))}
              </div>

              {msg.creation && (
                <div className="w-full bg-zinc-900 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-bold">Ready to Create</p>
                      <p className="text-sm font-bold text-white mt-1">{msg.creation.title}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Cost</p>
                      <p className="text-sm font-black text-white mt-1">{msg.creation.credits} cr</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{msg.creation.prompt}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-zinc-600 font-mono">{msg.creation.model} · {msg.creation.ratio}</span>
                    <button
                      onClick={() => goGenerate(msg.creation!)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-wider uppercase transition-colors"
                    >
                      Generate this →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 pb-6 pt-2 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="flex gap-3 items-end bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 rounded-2xl px-4 py-3 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to create..."
            rows={1}
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 text-sm resize-none focus:outline-none max-h-32 leading-relaxed"
            style={{ minHeight: "24px" }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isStreaming}
            className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !isStreaming
                ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 8L8 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-zinc-700 text-xs mt-2 tracking-wide">
          Enter to send · Shift+Enter for new line
        </p>
      </div>

    </div>
  );
}

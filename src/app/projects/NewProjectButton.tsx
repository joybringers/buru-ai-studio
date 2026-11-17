"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [length, setLength] = useState("180");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!title.trim()) return;
    setLoading(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), targetLength: Number(length) }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/projects/${data.id}/quote`);
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#6A4CFF] hover:bg-[#5636F0] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        + New Film
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#121530] border border-[#1E2244] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-5">New Film Project</h2>

            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Film title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && create()}
              placeholder="e.g. My Short Film"
              className="w-full bg-[#090B1A] border border-[#1E2244] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#6A4CFF] mb-4"
            />

            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Target length</label>
            <select
              value={length}
              onChange={e => setLength(e.target.value)}
              className="w-full bg-[#090B1A] border border-[#1E2244] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6A4CFF] mb-6"
            >
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="90">1.5 minutes</option>
              <option value="120">2 minutes</option>
              <option value="180">3 minutes</option>
              <option value="240">4 minutes</option>
              <option value="300">5 minutes</option>
            </select>

            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-[#1E2244] text-gray-400 text-sm font-semibold py-2.5 rounded-lg hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={!title.trim() || loading}
                className="flex-1 bg-[#6A4CFF] hover:bg-[#5636F0] disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Creating…" : "Get Quote →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

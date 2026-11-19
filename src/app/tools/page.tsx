import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tools — BuruStudio" };

const TOOLS = [
  {
    href: "/tools/upscale",
    label: "Upscale",
    description: "Sharpen any image to 4× its original resolution without losing detail.",
    credits: 10,
    badge: null,
    category: "Image",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21 10.5 13.5l4.5 4.5 6-7.5"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M21 3l-6 6"/>
      </svg>
    ),
  },
  {
    href: "/tools/background",
    label: "Remove Background",
    description: "Cleanly isolate the subject and strip the background in one click.",
    credits: 10,
    badge: null,
    category: "Image",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <circle cx="6" cy="7.5" r="3"/>
        <circle cx="6" cy="16.5" r="3"/>
        <path strokeLinecap="round" d="M9 7.5 21 3M9 10.5 15 12M9 16.5 21 21M9 13.5 13.5 12"/>
      </svg>
    ),
  },
  {
    href: "/tools/inpaint",
    label: "Edit Image",
    description: "Describe a change — AI repaints exactly the part you specify.",
    credits: 20,
    badge: null,
    category: "Image",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 3 21 7 7 21H3v-4L17 3Z"/>
      </svg>
    ),
  },
  {
    href: "/tools/expand",
    label: "Expand Scene",
    description: "Zoom out and extend your image. AI fills the surrounding area with matching style.",
    credits: 20,
    badge: "NEW",
    category: "Image",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="5" y="5" width="14" height="14" rx="1.5"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 8V2h6M2 16v6h6M16 2h6v6M22 16v6h-6"/>
      </svg>
    ),
  },
  {
    href: "/tools/relight",
    label: "Relight",
    description: "Change the lighting of any portrait or product photo. Describe the light you want.",
    credits: 25,
    badge: "NEW",
    category: "Image",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <circle cx="12" cy="12" r="4"/>
        <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2m16 0h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      </svg>
    ),
  },
  {
    href: "/tools/faceswap",
    label: "Face Swap",
    description: "Swap any face in a photo or video with a reference image. Seamless and realistic.",
    credits: 30,
    badge: "HOT",
    category: "Video",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="9" cy="10.5" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="10.5" r="1.5" fill="currentColor" stroke="none"/>
        <path strokeLinecap="round" d="M9 15.5a4.5 4.5 0 0 0 6 0"/>
      </svg>
    ),
  },
  {
    href: "/tools/lipsync",
    label: "Lip Sync",
    description: "Upload a talking-head video and an audio file — AI syncs the lips to the new audio.",
    credits: 80,
    badge: "NEW",
    category: "Video",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="8" y="2" width="8" height="12" rx="4"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11a8 8 0 0 0 16 0M12 19v3M9 22h6"/>
      </svg>
    ),
  },
  {
    href: "/tools/video-edit",
    label: "Edit Video",
    description: "Upload a clip and describe the changes — AI transforms it using Kling video-to-video.",
    credits: 60,
    badge: "NEW",
    category: "Video",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <rect x="2" y="6" width="14" height="12" rx="2"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 10 22 7v10l-6-3"/>
      </svg>
    ),
  },
  {
    href: "/tools/voiceover",
    label: "Voice Over",
    description: "Type any text and choose a voice — generate professional AI narration in seconds.",
    credits: 15,
    badge: "NEW",
    category: "Audio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h1.5m15 0H21M6.75 7.5h.75m9 0h.75M9 4.5h.75m4.5 0h.75M9 19.5h.75m4.5 0h.75M6.75 16.5h.75m9 0h.75"/>
        <path strokeLinecap="round" d="M12 3v18"/>
      </svg>
    ),
  },
  {
    href: "/tools/voice-clone",
    label: "Voice Clone",
    description: "Clone any voice from a 5–30 second sample and make it say anything.",
    credits: 25,
    badge: "NEW",
    category: "Audio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21c0-3.771 2.915-6 9-6s9 2.229 9 6"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 4l1.5 1.5-1.5 1.5M19.5 4l1.5 1.5-1.5 1.5" strokeOpacity="0.4"/>
      </svg>
    ),
  },
];

const CATEGORIES = ["Image", "Video", "Audio"] as const;
type Category = typeof CATEGORIES[number];

const CAT_COLOR: Record<Category, { dot: string; pill: string }> = {
  Image: { dot: "bg-[#6A4CFF]",  pill: "bg-[#6A4CFF]/15 text-[#A88FFF]" },
  Video: { dot: "bg-[#2F6BFF]",  pill: "bg-[#2F6BFF]/15 text-[#7BA8FF]" },
  Audio: { dot: "bg-[#2BE4FF]",  pill: "bg-[#2BE4FF]/15 text-[#2BE4FF]" },
};

export default function ToolsPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-10 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#F2F6FF]">Tools</h1>
        <p className="text-[#A8B0D8] text-sm mt-1">
          Post-production AI tools — enhance, transform, and polish your work.
        </p>
      </div>

      {/* Grid per category */}
      {CATEGORIES.map((cat) => {
        const tools = TOOLS.filter((t) => t.category === cat);
        const col = CAT_COLOR[cat];
        return (
          <section key={cat} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <h2 className="text-xs font-bold text-[#A8B0D8] uppercase tracking-[0.2em]">{cat}</h2>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${col.pill}`}>
                {tools.length} tools
              </span>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group bg-[#121530] border border-[#1E2140] hover:border-[#6A4CFF]/50 rounded-2xl p-5 transition-all hover:bg-[#161840] flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#A88FFF] ${col.pill}`}>
                      {tool.icon}
                    </div>
                    {tool.badge && (
                      <span className="text-[9px] font-bold tracking-widest bg-[#6A4CFF] text-white px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">
                        {tool.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-[#F2F6FF] group-hover:text-white text-sm">{tool.label}</p>
                    <p className="text-xs text-[#4A5280] mt-1 leading-relaxed">{tool.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1E2140]">
                    <span className="text-xs text-[#4A5280] font-mono">{tool.credits} cr</span>
                    <span className="text-xs font-semibold text-[#6A4CFF] group-hover:text-[#A88FFF] transition-colors">
                      Open →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

    </div>
  );
}

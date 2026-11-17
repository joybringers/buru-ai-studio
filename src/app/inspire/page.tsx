"use client";
import { useState } from "react";
import Link from "next/link";

export default function InspirePage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const prompts = ALL_PROMPTS.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );

  return (
    <div className="min-h-screen px-6 md:px-8 py-6 space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Inspirations</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Browse prompts by category — click any to open in Studio</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
              activeCategory === cat
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {prompts.map((item) => (
          <PromptCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function PromptCard({ item }: { item: PromptItem }) {
  const params = new URLSearchParams({ prompt: item.prompt, model: item.model });
  return (
    <Link
      href={`/studio?${params.toString()}`}
      className="block break-inside-avoid rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 hover:border-indigo-500/50 transition-all group"
    >
      {/* Gradient thumbnail */}
      <div
        className="w-full aspect-square relative flex items-end p-3"
        style={{ background: item.gradient }}
      >
        <span className="text-[9px] font-bold tracking-widest text-white/60 uppercase bg-black/30 px-2 py-0.5 rounded-full">
          {item.modelLabel}
        </span>
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 flex items-center justify-center">
          <span className="text-sm font-semibold text-white bg-indigo-600 px-4 py-2 rounded-xl shadow-xl">
            Use this prompt →
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{item.prompt}</p>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">{item.category}</span>
          <span className="text-[9px] text-zinc-700">{item.type}</span>
        </div>
      </div>
    </Link>
  );
}

interface PromptItem {
  id: string;
  prompt: string;
  category: string;
  model: string;
  modelLabel: string;
  type: string;
  gradient: string;
}

const CATEGORIES = [
  "All", "Marketing & Ads", "Film & Stories", "Music Video",
  "Animation", "UGC", "Micro Drama", "Anime", "Explainer",
];

const ALL_PROMPTS: PromptItem[] = [
  // Marketing & Ads
  { id: "1", category: "Marketing & Ads", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
    prompt: "Luxury perfume bottle on white marble surface, golden morning light, macro lens, editorial product photography, shallow depth of field, premium lifestyle brand aesthetic" },
  { id: "2", category: "Marketing & Ads", type: "video", model: "kling-t2v", modelLabel: "Kling",
    gradient: "linear-gradient(135deg,#2d1b69 0%,#11998e 100%)",
    prompt: "Cinematic product reveal — sleek smartphone rising from dark water, slow-motion droplets, dramatic backlight, 4K commercial quality, slow dolly push-in" },
  { id: "3", category: "Marketing & Ads", type: "image", model: "flux-pro", modelLabel: "FLUX Pro",
    gradient: "linear-gradient(135deg,#c94b4b 0%,#4b134f 100%)",
    prompt: "Bold fashion campaign, model in red couture gown against industrial backdrop, high-contrast street photography, editorial Vogue style, dramatic shadows" },
  { id: "4", category: "Marketing & Ads", type: "image", model: "nano-banana-pro", modelLabel: "Ideogram",
    gradient: "linear-gradient(135deg,#1f4037 0%,#99f2c8 100%)",
    prompt: "Organic skincare brand ad — green bottle surrounded by botanicals, fresh herbs, misty morning light, clean and minimal, text overlay: PURE" },

  // Film & Stories
  { id: "5", category: "Film & Stories", type: "video", model: "kling-t2v-pro", modelLabel: "Kling Pro",
    gradient: "linear-gradient(135deg,#141e30 0%,#243b55 100%)",
    prompt: "Opening scene of a noir thriller — a detective walks down a rain-soaked alley at night, neon signs reflect in puddles, slow tracking shot, 35mm film grain, moody" },
  { id: "6", category: "Film & Stories", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#2c3e50 0%,#fd746c 100%)",
    prompt: "Cinematic still — two strangers meeting at a candlelit café in Paris, warm bokeh lights, intimate framing, story-driven composition, golden hour streaming through windows" },
  { id: "7", category: "Film & Stories", type: "video", model: "minimax-video", modelLabel: "MiniMax",
    gradient: "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
    prompt: "Aerial drone shot over a medieval castle at dawn, fog drifting through the valley, epic fantasy establishing shot, 4K cinematic quality" },
  { id: "8", category: "Film & Stories", type: "image", model: "flux-pro", modelLabel: "FLUX Pro",
    gradient: "linear-gradient(135deg,#4a1942 0%,#c5478c 100%)",
    prompt: "Portrait of a time traveler — Victorian-era costume with futuristic glowing tech embedded, dramatic chiaroscuro lighting, hyper-detailed, story-rich" },

  // Music Video
  { id: "9", category: "Music Video", type: "video", model: "kling-t2v", modelLabel: "Kling",
    gradient: "linear-gradient(135deg,#8e0e00 0%,#1f1c18 100%)",
    prompt: "R&B music video — artist performs in a neon-lit warehouse, slow-motion confetti rain, vibrant colour grading, orbit camera movement" },
  { id: "10", category: "Music Video", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#654ea3 0%,#eaafc8 100%)",
    prompt: "Afrobeats music video concept — vibrant Lagos streetscape, colourful kente fabric costumes, dynamic crowd energy, golden hour, Steadicam follow shot" },
  { id: "11", category: "Music Video", type: "video", model: "kling-t2v-pro", modelLabel: "Kling Pro",
    gradient: "linear-gradient(135deg,#000000 0%,#434343 100%)",
    prompt: "Moody indie pop music video — singer in an empty neon-sign bar, rain on windows, slow crane shot ascending, 16mm film aesthetic, desaturated palette" },
  { id: "12", category: "Music Video", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#005c97 0%,#363795 100%)",
    prompt: "Electronic music visualiser concept — abstract neon geometric shapes pulsing in darkness, holographic waves, 3D render, immersive concert backdrop" },

  // Animation
  { id: "13", category: "Animation", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#56ab2f 0%,#a8e063 100%)",
    prompt: "3D Pixar-style animated character — a small fox wearing a tiny backpack, lush magical forest, warm dappled sunlight, hyper-detailed, subsurface scattering" },
  { id: "14", category: "Animation", type: "image", model: "nano-banana-pro", modelLabel: "Ideogram",
    gradient: "linear-gradient(135deg,#f7971e 0%,#ffd200 100%)",
    prompt: "Studio Ghibli inspired scene — a young girl in a yellow raincoat stands at a rain-swept bus stop beside a giant forest spirit, whimsical illustration" },
  { id: "15", category: "Animation", type: "video", model: "minimax-video", modelLabel: "MiniMax",
    gradient: "linear-gradient(135deg,#e96c50 0%,#f7c59f 100%)",
    prompt: "Looping 3D animation — a cartoon bear cub bouncing on a trampoline in a sunny meadow, bubbly motion, vibrant colours, children's show aesthetic" },
  { id: "16", category: "Animation", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#1a1a2e 0%,#e94560 100%)",
    prompt: "Dark anime key visual — armoured warrior stands on a ruined cityscape at sunset, god-rays piercing storm clouds, hyper-detailed, cinematic composition" },

  // UGC
  { id: "17", category: "UGC", type: "image", model: "flux-schnell", modelLabel: "FLUX Schnell",
    gradient: "linear-gradient(135deg,#348f50 0%,#56b4d3 100%)",
    prompt: "Authentic UGC-style photo — person using a water bottle outdoors, natural lighting, candid smartphone aesthetic, clean minimalist background, lifestyle brand" },
  { id: "18", category: "UGC", type: "image", model: "flux-schnell", modelLabel: "FLUX Schnell",
    gradient: "linear-gradient(135deg,#f7971e 0%,#c94b4b 100%)",
    prompt: "UGC product review — hand holding a supplement bottle, clean kitchen counter, natural window light, authentic testimonial look, real-person aesthetic" },
  { id: "19", category: "UGC", type: "video", model: "kling-t2v", modelLabel: "Kling",
    gradient: "linear-gradient(135deg,#4ca1af 0%,#2c3e50 100%)",
    prompt: "Vertical UGC-style video — influencer unboxes a beauty product at a bright vanity table, natural reaction, authentic close-up, TikTok aesthetic" },

  // Micro Drama
  { id: "20", category: "Micro Drama", type: "video", model: "kling-t2v-pro", modelLabel: "Kling Pro",
    gradient: "linear-gradient(135deg,#141e30 0%,#c94b4b 100%)",
    prompt: "Vertical drama short — business tycoon stares out a floor-to-ceiling window at a city skyline, thunderstorm approaching, Dutch tilt, tense atmosphere, whip pan" },
  { id: "21", category: "Micro Drama", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#232526 0%,#414345 100%)",
    prompt: "Melodrama key art — two rivals face each other in a marble boardroom, tension electric, dramatic window light, cinematic still, luxury corporate thriller" },
  { id: "22", category: "Micro Drama", type: "video", model: "kling-t2v", modelLabel: "Kling",
    gradient: "linear-gradient(135deg,#4a0000 0%,#200122 100%)",
    prompt: "Micro drama reveal — a woman opens an envelope, reads it, then smiles with tears in her eyes, golden hour apartment, handheld camera, intimate close-up" },

  // Anime
  { id: "23", category: "Anime", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#00b4db 0%,#0083b0 100%)",
    prompt: "Cinematic anime screenshot — magical girl transformed, glowing ice powers, sakura petals swirling, studio Ufotable lighting, ultra-detailed, Fate-style" },
  { id: "24", category: "Anime", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#f953c6 0%,#b91d73 100%)",
    prompt: "Shonen battle anime key frame — protagonist charges a devastating energy blast, destroyed cityscape background, intense speed lines, Demon Slayer art style" },
  { id: "25", category: "Anime", type: "video", model: "minimax-video", modelLabel: "MiniMax",
    gradient: "linear-gradient(135deg,#2980b9 0%,#6dd5fa 100%)",
    prompt: "Anime opening sequence — two rivals standing back-to-back on a rooftop at dusk, wind blowing hair, crane shot revealing city below, cinematic anime quality" },
  { id: "26", category: "Anime", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#1a1a2e 0%,#f5a623 100%)",
    prompt: "Fantasy isekai concept art — a salaryman stands bewildered in a medieval fantasy bazaar, adventurers everywhere, painterly anime illustration, warm lamplight" },

  // Explainer
  { id: "27", category: "Explainer", type: "image", model: "nano-banana-pro", modelLabel: "Ideogram",
    gradient: "linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)",
    prompt: "Clean explainer illustration — how blockchain works, minimalist flat design, blue and white palette, iconographic nodes and chains, tech-forward" },
  { id: "28", category: "Explainer", type: "image", model: "nano-banana-pro", modelLabel: "Ideogram",
    gradient: "linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)",
    prompt: "SaaS onboarding explainer visual — dashboard UI with annotation arrows, clean vector illustration, friendly character pointing at metrics, modern startup aesthetic" },
  { id: "29", category: "Explainer", type: "video", model: "kling-t2v", modelLabel: "Kling",
    gradient: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
    prompt: "Motion graphic explainer opener — abstract data points connecting into a globe, clean blue and white palette, corporate tech brand, smooth dolly pull-back" },
  { id: "30", category: "Explainer", type: "image", model: "flux-dev", modelLabel: "FLUX Dev",
    gradient: "linear-gradient(135deg,#f093fb 0%,#f5576c 100%)",
    prompt: "AI concept visual — human brain merging with circuit board, golden neurons, clean cinematic lighting, medical tech illustration, futuristic healthcare" },
];

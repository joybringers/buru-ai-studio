export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type TemplateCategory = "all" | "video" | "image" | "audio" | "marketing" | "social";

export interface FormTextField {
  id: string;
  type: "text" | "textarea";
  label: string;
  placeholder: string;
  maxLength: number;
  required: boolean;
}

export interface FormPillField {
  id: string;
  type: "pills";
  label: string;
  options: { value: string; label: string }[];
  required: boolean;
}

export type FormField = FormTextField | FormPillField;

export interface CreateTemplate {
  type: string;
  verb: string;
  noun: string;
  subtitle: string;
  ctaLabel: string;
  fields: FormField[];
  defaultModel: string;
  defaultRatio: AspectRatio;
  tileGradient: string;
  categories: TemplateCategory[];
  /** Optional CDN URL for a real preview video. Falls back to animated gradient. */
  exampleVideo?: string;
  buildPrompt: (answers: Record<string, string>) => string;
}

export const TEMPLATES: CreateTemplate[] = [
  {
    type: "brand-film",
    verb: "Make",
    noun: "Brand Film",
    subtitle: "Cinematic brand stories in seconds",
    ctaLabel: "Direct my brand film",
    tileGradient: "linear-gradient(145deg,#1e1b4b 0%,#3730a3 100%)",
    categories: ["video", "marketing"],
    defaultModel: "kling-t2v",
    defaultRatio: "16:9",
    fields: [
      {
        id: "story",
        type: "textarea",
        label: "What's your brand story?",
        placeholder: "e.g. A founder who started in a garage and now ships worldwide — driven by craftsmanship and community",
        maxLength: 300,
        required: true,
      },
      {
        id: "style",
        type: "pills",
        label: "Visual style",
        required: false,
        options: [
          { value: "cinematic", label: "Cinematic" },
          { value: "luxury editorial", label: "Luxury" },
          { value: "documentary", label: "Documentary" },
          { value: "bold high-contrast", label: "Bold" },
          { value: "minimal clean", label: "Minimal" },
        ],
      },
      {
        id: "mood",
        type: "pills",
        label: "Mood",
        required: false,
        options: [
          { value: "inspiring and uplifting", label: "Inspiring" },
          { value: "dramatic and intense", label: "Dramatic" },
          { value: "calm and serene", label: "Calm" },
          { value: "energetic and fast-paced", label: "Energetic" },
          { value: "nostalgic and warm", label: "Nostalgic" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const story = a.story?.trim() || "brand story";
      const style = a.style || "cinematic";
      const mood = a.mood || "inspiring";
      return `${style} brand film advertisement, ${story}. ${mood} tone, professional cinematography, smooth camera movement, commercial color grading, 4K quality`;
    },
  },

  {
    type: "product-ad",
    verb: "Create",
    noun: "Product Ad",
    subtitle: "AI-generated ads that drive sales",
    ctaLabel: "Generate my product ad",
    tileGradient: "linear-gradient(145deg,#450a0a 0%,#991b1b 100%)",
    categories: ["image", "marketing"],
    defaultModel: "flux-pro",
    defaultRatio: "1:1",
    fields: [
      {
        id: "product",
        type: "text",
        label: "What product are you showcasing?",
        placeholder: "e.g. Matte black travel flask, ceramic skincare serum",
        maxLength: 100,
        required: true,
      },
      {
        id: "description",
        type: "textarea",
        label: "What makes it special?",
        placeholder: "e.g. Double-walled insulation, keeps drinks cold for 24 hours, minimalist design",
        maxLength: 200,
        required: false,
      },
      {
        id: "style",
        type: "pills",
        label: "Visual style",
        required: false,
        options: [
          { value: "minimalist studio", label: "Studio" },
          { value: "lifestyle outdoor", label: "Lifestyle" },
          { value: "dramatic dark", label: "Dramatic" },
          { value: "luxury premium", label: "Luxury" },
          { value: "vibrant colourful", label: "Vibrant" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const product = a.product?.trim() || "product";
      const desc = a.description?.trim() ? `, ${a.description.trim()}` : "";
      const style = a.style || "minimalist studio";
      return `${style} product advertisement featuring ${product}${desc}. Professional studio lighting, sharp focus, premium commercial photography, marketing quality image`;
    },
  },

  {
    type: "social-reel",
    verb: "Create",
    noun: "Social Reel",
    subtitle: "Scroll-stopping content for every platform",
    ctaLabel: "Generate my reel",
    tileGradient: "linear-gradient(145deg,#082f49 0%,#0369a1 100%)",
    categories: ["video", "social"],
    defaultModel: "kling-t2v",
    defaultRatio: "9:16",
    fields: [
      {
        id: "message",
        type: "textarea",
        label: "What's your message?",
        placeholder: "e.g. Launching our new summer collection — confident, stylish people on a city rooftop at golden hour",
        maxLength: 250,
        required: true,
      },
      {
        id: "platform",
        type: "pills",
        label: "Platform",
        required: false,
        options: [
          { value: "Instagram Reels", label: "Instagram" },
          { value: "TikTok", label: "TikTok" },
          { value: "LinkedIn", label: "LinkedIn" },
          { value: "YouTube Shorts", label: "YouTube" },
        ],
      },
      {
        id: "vibe",
        type: "pills",
        label: "Vibe",
        required: false,
        options: [
          { value: "trendy and modern", label: "Trendy" },
          { value: "luxury and aspirational", label: "Luxury" },
          { value: "fun and playful", label: "Fun" },
          { value: "inspiring and motivational", label: "Inspiring" },
          { value: "chill and relaxed", label: "Chill" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const message = a.message?.trim() || "engaging social content";
      const platform = a.platform || "social media";
      const vibe = a.vibe || "trendy and modern";
      return `${platform} short vertical video, ${message}. ${vibe} energy, eye-catching visuals, modern aesthetic, optimized for social media engagement`;
    },
  },

  {
    type: "ugc-ad",
    verb: "Create",
    noun: "UGC Ad",
    subtitle: "Authentic creator-style ads that convert",
    ctaLabel: "Generate my UGC ad",
    tileGradient: "linear-gradient(145deg,#431407 0%,#c2410c 100%)",
    categories: ["video", "marketing", "social"],
    defaultModel: "kling-t2v",
    defaultRatio: "9:16",
    fields: [
      {
        id: "product",
        type: "text",
        label: "What product or service?",
        placeholder: "e.g. Protein powder, language learning app, skin serum",
        maxLength: 100,
        required: true,
      },
      {
        id: "benefit",
        type: "text",
        label: "Key benefit to highlight",
        placeholder: "e.g. Lost 5kg in 30 days, speaks Spanish in 3 months",
        maxLength: 150,
        required: false,
      },
      {
        id: "tone",
        type: "pills",
        label: "Creator tone",
        required: false,
        options: [
          { value: "authentic and genuine", label: "Authentic" },
          { value: "enthusiastic and excited", label: "Enthusiastic" },
          { value: "informative and clear", label: "Informative" },
          { value: "casual and relatable", label: "Casual" },
          { value: "luxury and aspirational", label: "Luxury" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const product = a.product?.trim() || "product";
      const benefit = a.benefit?.trim() ? `, ${a.benefit.trim()}` : "";
      const tone = a.tone || "authentic and genuine";
      return `user-generated content style advertisement for ${product}${benefit}. ${tone} delivery, natural casual lighting, real person speaking directly to camera, genuine and relatable, TikTok vertical format`;
    },
  },

  {
    type: "text-to-video",
    verb: "Make",
    noun: "AI Video",
    subtitle: "Turn words into cinematic AI clips",
    ctaLabel: "Generate my video",
    tileGradient: "linear-gradient(145deg,#2e1065 0%,#7c3aed 100%)",
    categories: ["video"],
    defaultModel: "minimax-video",
    defaultRatio: "16:9",
    fields: [
      {
        id: "scene",
        type: "textarea",
        label: "Describe your scene",
        placeholder: "e.g. A lone astronaut walks across a glowing red Mars surface at dawn, stars fading, dust swirling in the wind",
        maxLength: 400,
        required: true,
      },
      {
        id: "style",
        type: "pills",
        label: "Visual style",
        required: false,
        options: [
          { value: "cinematic film", label: "Cinematic" },
          { value: "animated", label: "Animated" },
          { value: "documentary", label: "Documentary" },
          { value: "artistic surreal", label: "Artistic" },
          { value: "dark dramatic", label: "Dramatic" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const scene = a.scene?.trim() || "cinematic scene";
      const style = a.style || "cinematic film";
      return `${style} video, ${scene}. Smooth motion, professional color grade, high production quality`;
    },
  },

  {
    type: "image",
    verb: "Generate",
    noun: "AI Image",
    subtitle: "Any image, from any idea",
    ctaLabel: "Generate my image",
    tileGradient: "linear-gradient(145deg,#042f2e 0%,#0d9488 100%)",
    categories: ["image"],
    defaultModel: "flux-dev",
    defaultRatio: "1:1",
    fields: [
      {
        id: "description",
        type: "textarea",
        label: "What do you want to create?",
        placeholder: "e.g. A neon-lit ramen bar in Tokyo at midnight, rain-slicked streets reflecting purple and teal lights, a lone customer inside",
        maxLength: 400,
        required: true,
      },
      {
        id: "style",
        type: "pills",
        label: "Style",
        required: false,
        options: [
          { value: "photorealistic", label: "Photorealistic" },
          { value: "cinematic film still", label: "Cinematic" },
          { value: "digital illustration", label: "Illustration" },
          { value: "minimal clean design", label: "Minimal" },
          { value: "dark moody editorial", label: "Editorial" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const desc = a.description?.trim() || "creative image";
      const style = a.style || "photorealistic";
      return `${style} style, ${desc}. Professional quality, high detail, sharp focus`;
    },
  },

  {
    type: "product-shot",
    verb: "Create",
    noun: "Product Shot",
    subtitle: "Studio-quality photography — no studio needed",
    ctaLabel: "Generate product shot",
    tileGradient: "linear-gradient(145deg,#0f172a 0%,#334155 100%)",
    categories: ["image", "marketing"],
    defaultModel: "flux-pro",
    defaultRatio: "1:1",
    fields: [
      {
        id: "product",
        type: "text",
        label: "What product?",
        placeholder: "e.g. Glass perfume bottle, leather wallet, protein shake",
        maxLength: 100,
        required: true,
      },
      {
        id: "setting",
        type: "pills",
        label: "Setting",
        required: false,
        options: [
          { value: "clean white studio background", label: "White Studio" },
          { value: "dark matte background", label: "Dark" },
          { value: "marble surface with soft natural light", label: "Marble" },
          { value: "outdoor lifestyle setting", label: "Lifestyle" },
          { value: "minimalist beige linen", label: "Linen" },
        ],
      },
      {
        id: "style",
        type: "pills",
        label: "Look",
        required: false,
        options: [
          { value: "luxury premium", label: "Luxury" },
          { value: "clean minimalist", label: "Minimal" },
          { value: "bold dramatic", label: "Bold" },
          { value: "soft natural", label: "Natural" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const product = a.product?.trim() || "product";
      const setting = a.setting || "clean white studio background";
      const style = a.style || "luxury premium";
      return `${style} professional product photography of ${product}, ${setting}. Studio lighting, sharp focus on product, commercial quality, marketing photography`;
    },
  },

  {
    type: "poster",
    verb: "Design",
    noun: "Poster",
    subtitle: "Bold typographic and graphic posters",
    ctaLabel: "Generate my poster",
    tileGradient: "linear-gradient(145deg,#1a0533 0%,#7e22ce 100%)",
    categories: ["image", "social"],
    defaultModel: "nano-banana-pro",
    defaultRatio: "9:16",
    fields: [
      {
        id: "title",
        type: "text",
        label: "Main text or headline",
        placeholder: 'e.g. "SUMMER SALE", "THE FUTURE IS NOW", artist/event name',
        maxLength: 80,
        required: true,
      },
      {
        id: "theme",
        type: "text",
        label: "What's it for? (optional)",
        placeholder: "e.g. Music festival, fashion drop, motivational print",
        maxLength: 100,
        required: false,
      },
      {
        id: "style",
        type: "pills",
        label: "Design style",
        required: false,
        options: [
          { value: "modern bold typographic", label: "Modern Bold" },
          { value: "retro vintage", label: "Retro" },
          { value: "minimal clean", label: "Minimal" },
          { value: "dark atmospheric", label: "Dark" },
          { value: "neon cyberpunk", label: "Neon" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const title = a.title?.trim() || "text";
      const theme = a.theme?.trim() ? ` for ${a.theme.trim()}` : "";
      const style = a.style || "modern bold typographic";
      return `${style} poster design${theme}, text reads "${title}". Strong visual hierarchy, professional graphic design, print quality, impactful layout`;
    },
  },

  {
    type: "brand-image",
    verb: "Create",
    noun: "Brand Image",
    subtitle: "Consistent visual identity at scale",
    ctaLabel: "Generate brand image",
    tileGradient: "linear-gradient(145deg,#172554 0%,#1d4ed8 100%)",
    categories: ["image", "marketing"],
    defaultModel: "flux-pro",
    defaultRatio: "16:9",
    fields: [
      {
        id: "brand",
        type: "text",
        label: "What's your brand or business?",
        placeholder: "e.g. Artisan coffee roastery, sustainable activewear brand",
        maxLength: 100,
        required: true,
      },
      {
        id: "concept",
        type: "textarea",
        label: "What should it show?",
        placeholder: "e.g. Early morning ritual — a barista pouring latte art, steam rising, golden morning light",
        maxLength: 250,
        required: false,
      },
      {
        id: "style",
        type: "pills",
        label: "Brand aesthetic",
        required: false,
        options: [
          { value: "minimal premium", label: "Minimal" },
          { value: "luxury editorial", label: "Luxury" },
          { value: "bold vibrant", label: "Bold" },
          { value: "warm natural organic", label: "Natural" },
          { value: "dark industrial", label: "Industrial" },
        ],
      },
    ],
    buildPrompt: (a) => {
      const brand = a.brand?.trim() || "brand";
      const concept = a.concept?.trim() ? `, ${a.concept.trim()}` : "";
      const style = a.style || "minimal premium";
      return `${style} brand visual for ${brand}${concept}. Professional editorial photography, consistent brand identity, marketing quality, high production value`;
    },
  },
];

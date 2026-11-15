export interface UserState {
  balance: number;
  monthlyCap: number;
  monthlySpent: number;
}

export interface GalleryItem {
  id: string;
  prompt: string;
  modelId: string;
  modelName: string;
  type: "image" | "video";
  date: string;
  gradient: string;
}

export const BLOCKED_TERMS = [
  "mickey mouse",
  "spongebob",
  "mario",
  "pikachu",
  "batman",
  "superman",
  "taylor swift",
  "elon musk",
  "keanu reeves",
  "spider-man",
  "spiderman",
];

export const FAKE_USER: UserState = {
  balance: 820,
  monthlyCap: 1000,
  monthlySpent: 310,
};

export const FAKE_GALLERY: GalleryItem[] = [
  {
    id: "g1",
    prompt: "A minimalist coffee brand logo on white, clean sans-serif typography",
    modelId: "flux-dev",
    modelName: "FLUX Dev",
    type: "image",
    date: "9 Nov 2026",
    gradient: "linear-gradient(135deg, #f5f0eb 0%, #c8b89a 100%)",
  },
  {
    id: "g2",
    prompt: "Bold typographic poster for a streetwear drop, neon pink on black",
    modelId: "nano-banana-pro",
    modelName: "Nano Banana Pro",
    type: "image",
    date: "8 Nov 2026",
    gradient: "linear-gradient(135deg, #0d0d0d 0%, #ff2d55 100%)",
  },
  {
    id: "g3",
    prompt: "5-second product reveal for a skincare serum, soft diffused light",
    modelId: "gen4-turbo",
    modelName: "Gen-4 Turbo",
    type: "video",
    date: "8 Nov 2026",
    gradient: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
  },
  {
    id: "g4",
    prompt: "Pastel social ad for a bakery, warm tones, overhead flat lay shot",
    modelId: "flux-schnell",
    modelName: "FLUX Schnell",
    type: "image",
    date: "7 Nov 2026",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  },
  {
    id: "g5",
    prompt: "Animated logo sting for a podcast, dark gradient background, 5 seconds",
    modelId: "veo-31-fast",
    modelName: "Veo 3.1 Fast",
    type: "video",
    date: "6 Nov 2026",
    gradient: "linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)",
  },
  {
    id: "g6",
    prompt: "Lifestyle photo of a fitness tracker on wrist, urban background",
    modelId: "flux-dev",
    modelName: "FLUX Dev",
    type: "image",
    date: "5 Nov 2026",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
];

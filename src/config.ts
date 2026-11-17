export const PRODUCT_NAME = "BuruStudio";
export const USD_TO_GBP = 0.80;
export const CREDIT_VALUE_USD = 0.02;
export const CREDIT_VALUE_GBP = CREDIT_VALUE_USD * USD_TO_GBP;

export interface Model {
  id: string;
  name: string;
  provider: string;
  type: "image" | "video" | "audio";
  /** Only set on image-to-video models — requires an uploaded image as input */
  inputType?: "image";
  credits: number;
  description: string;
}

export const MODELS: Model[] = [
  {
    id: "flux-schnell",
    name: "FLUX Schnell",
    provider: "fal.ai",
    type: "image",
    credits: 3,
    description: "Fast drafts",
  },
  {
    id: "flux-dev",
    name: "FLUX Dev",
    provider: "fal.ai",
    type: "image",
    credits: 15,
    description: "High quality",
  },
  {
    id: "flux-pro",
    name: "FLUX Pro",
    provider: "fal.ai",
    type: "image",
    credits: 25,
    description: "Best detail",
  },
  {
    id: "nano-banana-pro",
    name: "Ideogram v2",
    provider: "fal.ai",
    type: "image",
    credits: 20,
    description: "Strong at text",
  },
  {
    id: "minimax-video",
    name: "MiniMax T2V",
    provider: "fal.ai",
    type: "video",
    credits: 50,
    description: "5-sec text to video",
  },
  {
    id: "kling-t2v",
    name: "Kling v1.6",
    provider: "fal.ai",
    type: "video",
    credits: 60,
    description: "Cinematic quality T2V",
  },
  {
    id: "kling-t2v-pro",
    name: "Kling Pro",
    provider: "fal.ai",
    type: "video",
    credits: 150,
    description: "Pro quality T2V",
  },
  {
    id: "kling-i2v",
    name: "Kling Animate",
    provider: "fal.ai",
    type: "video",
    inputType: "image",
    credits: 60,
    description: "Animate your image",
  },
  {
    id: "kling-i2v-pro",
    name: "Kling Animate Pro",
    provider: "fal.ai",
    type: "video",
    inputType: "image",
    credits: 150,
    description: "Pro quality animation",
  },
  {
    id: "minimax-i2v",
    name: "MiniMax Animate",
    provider: "fal.ai",
    type: "video",
    inputType: "image",
    credits: 50,
    description: "Smooth image animation",
  },
  {
    id: "stable-audio",
    name: "Stable Audio",
    provider: "fal.ai",
    type: "audio",
    credits: 20,
    description: "30-sec AI music & sounds",
  },
];

export const IMAGE_MODELS = MODELS.filter((m) => m.type === "image");
export const VIDEO_MODELS = MODELS.filter((m) => m.type === "video");
export const AUDIO_MODELS = MODELS.filter((m) => m.type === "audio");

export const TOOL_CREDITS: Record<string, number> = {
  "tool-upscale":    10,
  "tool-bg-remove":  10,
  "tool-img-edit":   20,
  "tool-lipsync":    80,
  "tool-faceswap":   30,
  "tool-voiceover":  15,
  "tool-relight":    25,
};

/** Server-side credit cost — duration "10" doubles Kling cost */
export function computeJobCredits(modelId: string, duration?: string): number {
  const model = MODELS.find((m) => m.id === modelId);
  const base = model?.credits ?? 0;
  if (duration === "10" && modelId.startsWith("kling")) return base * 2;
  return base;
}

export const DRAFT_MODEL_ID = "flux-schnell";
export const DRAFT_COUNT = 4;
export const DRAFT_TOTAL_CREDITS = 3 * 4; // 12

export function creditsToGBP(credits: number): string {
  return `£${(credits * CREDIT_VALUE_GBP).toFixed(2)}`;
}

export interface CreditPack {
  id: string;
  label: string;
  credits: number;
  priceGBP: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack-50",  label: "Starter", credits: 50,  priceGBP: 1.50 },
  { id: "pack-200", label: "Creator", credits: 200, priceGBP: 5.00 },
  { id: "pack-500", label: "Studio",  credits: 500, priceGBP: 11.00 },
];

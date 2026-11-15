export const PRODUCT_NAME = "BuruStudio";
export const USD_TO_GBP = 0.80;
export const CREDIT_VALUE_USD = 0.02;
export const CREDIT_VALUE_GBP = CREDIT_VALUE_USD * USD_TO_GBP;

export interface Model {
  id: string;
  name: string;
  provider: string;
  type: "image" | "video";
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
    name: "MiniMax Video",
    provider: "fal.ai",
    type: "video",
    credits: 50,
    description: "5-sec clip",
  },
];

export const IMAGE_MODELS = MODELS.filter((m) => m.type === "image");
export const VIDEO_MODELS = MODELS.filter((m) => m.type === "video");

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

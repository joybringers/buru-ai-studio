import { fal } from "@fal-ai/client";
import type { GenerateStatus } from "./types";

fal.config({ credentials: process.env.FAL_KEY ?? "" });

const FAL_IMAGE_MAP: Record<string, string> = {
  "flux-schnell":    "fal-ai/flux/schnell",
  "flux-dev":        "fal-ai/flux/dev",
  "flux-pro":        "fal-ai/flux-pro/v1.1",
  "nano-banana-pro": "fal-ai/ideogram/v2",
};

// text-to-video endpoints
const FAL_T2V_MAP: Record<string, string> = {
  "minimax-video":  "fal-ai/minimax/video-01",
  "kling-t2v":      "fal-ai/kling-video/v1.6/standard/text-to-video",
  "kling-t2v-pro":  "fal-ai/kling-video/v1.6/pro/text-to-video",
};

// image-to-video endpoints
const FAL_I2V_MAP: Record<string, string> = {
  "kling-i2v":      "fal-ai/kling-video/v1.6/standard/image-to-video",
  "kling-i2v-pro":  "fal-ai/kling-video/v1.6/pro/image-to-video",
  "minimax-i2v":    "fal-ai/minimax/video-01-live",
};

const FAL_AUDIO_MAP: Record<string, string> = {
  "stable-audio": "fal-ai/stable-audio",
};

// Tool endpoints (image editing, upscale, etc.)
const FAL_TOOL_MAP: Record<string, string> = {
  "tool-upscale":    "fal-ai/aura-sr",
  "tool-bg-remove":  "fal-ai/birefnet",
  "tool-img-edit":   "fal-ai/flux/dev/image-to-image",
  "tool-lipsync":    "fal-ai/sadtalker",
  "tool-faceswap":   "fal-ai/faceswap",
  "tool-voiceover":   "fal-ai/kokoro",
  "tool-expand":       "fal-ai/flux/dev/image-to-image",
  "tool-relight":     "fal-ai/ic-light",
  "tool-video-edit":   "fal-ai/kling-video/v1.6/standard/video-to-video",
  "tool-voice-clone":  "fal-ai/f5-tts",
};

const FAL_VIDEO_MAP: Record<string, string> = { ...FAL_T2V_MAP, ...FAL_I2V_MAP };
const FAL_MODEL_MAP: Record<string, string> = {
  ...FAL_IMAGE_MAP,
  ...FAL_VIDEO_MAP,
  ...FAL_AUDIO_MAP,
  ...FAL_TOOL_MAP,
};

function falEndpoint(modelId: string): string {
  const endpoint = FAL_MODEL_MAP[modelId];
  if (!endpoint) throw new Error(`No fal.ai endpoint for model: ${modelId}`);
  return endpoint;
}

function pickResult(modelId: string, data: Record<string, unknown>): { url: string; mimeType: string } {
  // Video models
  if (FAL_VIDEO_MAP[modelId]) {
    const video = data.video as { url?: string } | undefined;
    if (!video?.url) throw new Error("fal.ai response contained no video URL");
    return { url: video.url, mimeType: "video/mp4" };
  }

  // Audio
  if (FAL_AUDIO_MAP[modelId]) {
    const audio = data.audio_file as { url?: string } | undefined;
    if (!audio?.url) throw new Error("fal.ai response contained no audio URL");
    return { url: audio.url, mimeType: "audio/wav" };
  }

  // Tool: lipsync → video
  if (modelId === "tool-lipsync") {
    const video = (data.video ?? data.output_video) as { url?: string } | undefined;
    if (video?.url) return { url: video.url, mimeType: "video/mp4" };
    // Some sadtalker versions return a direct URL string
    if (typeof data.video_path === "string") return { url: data.video_path, mimeType: "video/mp4" };
  }

  // Tool: video edit → video
  if (modelId === "tool-video-edit") {
    const video = data.video as { url?: string } | undefined;
    if (video?.url) return { url: video.url, mimeType: "video/mp4" };
    throw new Error("fal.ai response contained no video URL");
  }

  // Tool: voice clone → audio
  if (modelId === "tool-voice-clone") {
    const audio = (data.audio ?? data.audio_file) as { url?: string } | undefined;
    if (audio?.url) return { url: audio.url, mimeType: "audio/mp3" };
    if (typeof data.url === "string") return { url: data.url, mimeType: "audio/mp3" };
    throw new Error("fal.ai response contained no audio URL");
  }

  // Tool: voiceover → audio
  if (modelId === "tool-voiceover") {
    const audio = (data.audio ?? data.audio_file) as { url?: string } | undefined;
    if (audio?.url) return { url: audio.url, mimeType: "audio/mp3" };
    if (typeof data.url === "string") return { url: data.url, mimeType: "audio/mp3" };
    throw new Error("fal.ai response contained no audio URL");
  }

  // Tool: relight → image
  if (modelId === "tool-relight") {
    const imgs = data.images as Array<{ url: string }> | undefined;
    if (imgs?.[0]?.url) return { url: imgs[0].url, mimeType: "image/jpeg" };
    const img = data.image as { url?: string } | undefined;
    if (img?.url) return { url: img.url, mimeType: "image/jpeg" };
    throw new Error("fal.ai response contained no image URL");
  }

  // Tool: single image response (upscale, bg-remove, faceswap)
  if (modelId === "tool-upscale" || modelId === "tool-bg-remove" || modelId === "tool-faceswap") {
    const img = (data.image ?? data.output) as { url?: string } | undefined;
    if (img?.url) return { url: img.url, mimeType: "image/png" };
  }

  // Standard images array (flux, ideogram, img-edit)
  const images = data.images as Array<{ url: string; content_type?: string }> | undefined;
  const img = images?.[0];
  if (!img?.url) throw new Error("fal.ai response contained no image URL");
  return { url: img.url, mimeType: img.content_type ?? "image/jpeg" };
}

type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

const FLUX_SIZE_MAP: Record<AspectRatio, string> = {
  "1:1":  "square_hd",
  "16:9": "landscape_16_9",
  "9:16": "portrait_16_9",
  "4:3":  "landscape_4_3",
  "3:4":  "portrait_4_3",
};

const IDEOGRAM_RATIO_MAP: Record<AspectRatio, string> = {
  "1:1":  "ASPECT_1_1",
  "16:9": "ASPECT_16_9",
  "9:16": "ASPECT_9_16",
  "4:3":  "ASPECT_4_3",
  "3:4":  "ASPECT_3_4",
};

export type ImageQuality = "draft" | "standard" | "cinema";

export interface ToolOptions {
  duration?: "5" | "10";
  audioUrl?: string;
  swapImageUrl?: string;
  strength?: number;
  voice?: string;
  lightingPrompt?: string;
  videoUrl?: string;
  refAudioUrl?: string;
  refText?: string;
  imageQuality?: ImageQuality;
  expandDirection?: string;
}

function buildInput(
  prompt: string,
  modelId: string,
  aspectRatio: AspectRatio,
  imageUrl?: string,
  opts?: ToolOptions
): Record<string, unknown> {
  const duration = opts?.duration ?? "5";

  // Image-to-video
  if (FAL_I2V_MAP[modelId]) {
    if (!imageUrl) throw new Error("Image URL required for image-to-video models");
    if (modelId === "minimax-i2v") {
      return { prompt, first_frame_image: imageUrl, prompt_optimizer: true };
    }
    // kling-i2v / kling-i2v-pro
    return { prompt, image_url: imageUrl, duration };
  }

  // Audio generation
  if (FAL_AUDIO_MAP[modelId]) {
    return { prompt, seconds_total: 30 };
  }

  // Text-to-video
  if (FAL_T2V_MAP[modelId]) {
    if (modelId === "kling-t2v" || modelId === "kling-t2v-pro") {
      const ar = ["16:9","9:16","1:1"].includes(aspectRatio) ? aspectRatio : "16:9";
      return { prompt, duration, aspect_ratio: ar };
    }
    return { prompt }; // minimax-video
  }

  // Tool: upscale
  if (modelId === "tool-upscale") {
    return { image_url: imageUrl };
  }

  // Tool: background removal
  if (modelId === "tool-bg-remove") {
    return { image_url: imageUrl };
  }

  // Tool: image edit (img2img with prompt)
  if (modelId === "tool-img-edit") {
    return {
      prompt,
      image_url: imageUrl,
      strength: opts?.strength ?? 0.75,
      num_images: 1,
    };
  }

  // Tool: scene expand (img2img zoom-out / outpaint via FLUX)
  if (modelId === "tool-expand") {
    const dir = opts?.expandDirection ?? "on all sides";
    const userHint = prompt?.trim() ? ` ${prompt.trim()}.` : "";
    const expandPrompt =
      `Zoom out to show more of the scene ${dir}.${userHint} ` +
      `Seamlessly continue the existing environment, maintaining the same artistic style, ` +
      `color palette, lighting, and atmosphere. High quality, photorealistic continuation.`;
    return {
      prompt: expandPrompt,
      image_url: imageUrl,
      strength: opts?.strength ?? 0.4,
      num_images: 1,
    };
  }

  // Tool: lip-sync (sadtalker: face image + audio)
  if (modelId === "tool-lipsync") {
    return {
      source_image_url: imageUrl,
      driven_audio_url: opts?.audioUrl,
    };
  }

  // Tool: face swap
  if (modelId === "tool-faceswap") {
    return {
      base_image_url: imageUrl,
      swap_image_url: opts?.swapImageUrl,
    };
  }

  // Tool: video edit (Kling v2v)
  if (modelId === "tool-video-edit") {
    return {
      video_url: opts?.videoUrl,
      prompt,
      duration: opts?.duration ?? "5",
    };
  }

  // Tool: voice clone (F5-TTS zero-shot)
  if (modelId === "tool-voice-clone") {
    return {
      ref_audio_url: opts?.refAudioUrl,
      gen_text:      prompt,
      ref_text:      opts?.refText ?? "",
    };
  }

  // Tool: voiceover (Kokoro TTS)
  if (modelId === "tool-voiceover") {
    const input: Record<string, unknown> = { text: prompt };
    if (opts?.voice) input.voice = opts.voice;
    return input;
  }

  // Tool: relight (IC-Light)
  if (modelId === "tool-relight") {
    return {
      image_url: imageUrl,
      prompt: opts?.lightingPrompt ?? prompt,
    };
  }

  // Standard image generation
  const quality = opts?.imageQuality ?? "standard";
  if (modelId === "nano-banana-pro") {
    const renderingSpeed = quality === "cinema" ? "QUALITY" : quality === "draft" ? "TURBO" : "BALANCED";
    return { prompt, aspect_ratio: IDEOGRAM_RATIO_MAP[aspectRatio] ?? "ASPECT_1_1", rendering_speed: renderingSpeed };
  }
  // FLUX models
  const imageSize = quality === "draft" ? "square" : (FLUX_SIZE_MAP[aspectRatio] ?? "square_hd");
  const extra: Record<string, unknown> = {};
  if (quality === "draft") extra.num_inference_steps = 4;
  else if (quality === "cinema") extra.num_inference_steps = 50;
  return { prompt, num_images: 1, image_size: imageSize, ...extra };
}

/** Upload a file to fal.ai storage. Returns a CDN URL the generation endpoints can reference. */
export async function uploadToStorage(file: File): Promise<string> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY env var is not set");
  const url = await fal.storage.upload(file);
  return url;
}

/** Submit a generation job to fal.ai queue. Returns the provider request ID. */
export async function submit(
  prompt: string,
  modelId: string,
  aspectRatio: AspectRatio = "1:1",
  imageUrl?: string,
  opts?: ToolOptions
): Promise<string> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY env var is not set");

  const endpoint = falEndpoint(modelId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const isPublicUrl = appUrl.startsWith("https://");
  const webhookUrl = isPublicUrl ? `${appUrl}/api/webhooks/fal` : undefined;

  const { request_id } = await fal.queue.submit(endpoint, {
    input: buildInput(prompt, modelId, aspectRatio, imageUrl, opts),
    ...(webhookUrl ? { webhookUrl } : {}),
  });
  return request_id;
}

/** Poll fal.ai for the status of a queued job. */
export async function poll(
  providerJobId: string,
  modelId: string
): Promise<GenerateStatus> {
  const endpoint = falEndpoint(modelId);

  const status = await fal.queue.status(endpoint, {
    requestId: providerJobId,
    logs: false,
  });

  if (status.status === "COMPLETED") {
    const res = await fal.queue.result(endpoint, { requestId: providerJobId });
    const data = res.data as Record<string, unknown>;
    return { status: "done", result: pickResult(modelId, data) };
  }

  if ((status.status as string) === "FAILED") {
    return { status: "failed", error: "fal.ai job failed" };
  }

  return { status: "pending" };
}

export const supportedModelIds = Object.keys(FAL_MODEL_MAP);

import { fal } from "@fal-ai/client";
import type { GenerateStatus } from "./types";

fal.config({ credentials: process.env.FAL_KEY ?? "" });

const FAL_IMAGE_MAP: Record<string, string> = {
  "flux-schnell": "fal-ai/flux/schnell",
  "flux-dev": "fal-ai/flux/dev",
  "flux-pro": "fal-ai/flux-pro/v1.1",
  "nano-banana-pro": "fal-ai/ideogram/v2",
};

const FAL_VIDEO_MAP: Record<string, string> = {
  "minimax-video": "fal-ai/minimax/video-01",
};

const FAL_MODEL_MAP: Record<string, string> = { ...FAL_IMAGE_MAP, ...FAL_VIDEO_MAP };

function falEndpoint(modelId: string): string {
  const endpoint = FAL_MODEL_MAP[modelId];
  if (!endpoint) throw new Error(`No fal.ai endpoint for model: ${modelId}`);
  return endpoint;
}

function pickResult(modelId: string, data: Record<string, unknown>): { url: string; mimeType: string } {
  if (FAL_VIDEO_MAP[modelId]) {
    const video = data.video as { url?: string } | undefined;
    if (!video?.url) throw new Error("fal.ai response contained no video URL");
    return { url: video.url, mimeType: "video/mp4" };
  }
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

function buildInput(prompt: string, modelId: string, aspectRatio: AspectRatio) {
  if (FAL_VIDEO_MAP[modelId]) return { prompt };
  if (modelId === "nano-banana-pro") {
    return { prompt, aspect_ratio: IDEOGRAM_RATIO_MAP[aspectRatio] ?? "ASPECT_1_1" };
  }
  return { prompt, num_images: 1, image_size: FLUX_SIZE_MAP[aspectRatio] ?? "square_hd" };
}

/** Submit a generation job to fal.ai queue. Returns the provider request ID. */
export async function submit(
  prompt: string,
  modelId: string,
  aspectRatio: AspectRatio = "1:1"
): Promise<string> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY env var is not set");

  const endpoint = falEndpoint(modelId);
  const { request_id } = await fal.queue.submit(endpoint, {
    input: buildInput(prompt, modelId, aspectRatio),
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

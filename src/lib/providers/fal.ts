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

/** Submit a generation job to fal.ai queue. Returns the provider request ID. */
export async function submit(prompt: string, modelId: string): Promise<string> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY env var is not set");

  const endpoint = falEndpoint(modelId);
  const isVideo = !!FAL_VIDEO_MAP[modelId];
  const input = isVideo ? { prompt } : { prompt, num_images: 1 };
  const { request_id } = await fal.queue.submit(endpoint, { input });
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

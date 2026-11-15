import { fal } from "@fal-ai/client";
import type { GenerateStatus } from "./types";

fal.config({ credentials: process.env.FAL_KEY ?? "" });

// Map our internal model IDs to fal.ai endpoint IDs.
// Keep model IDs in sync with src/config.ts IMAGE_MODELS.
const FAL_MODEL_MAP: Record<string, string> = {
  "flux-schnell": "fal-ai/flux/schnell",
  "flux-dev": "fal-ai/flux/dev",
  "nano-banana-pro": "fal-ai/ideogram/v2",
};

function falEndpoint(modelId: string): string {
  const endpoint = FAL_MODEL_MAP[modelId];
  if (!endpoint) throw new Error(`No fal.ai endpoint for model: ${modelId}`);
  return endpoint;
}

function pickUrl(data: Record<string, unknown>): string {
  // Both FLUX and Ideogram return images[].url
  const images = data.images as Array<{ url: string }> | undefined;
  const url = images?.[0]?.url;
  if (!url) throw new Error("fal.ai response contained no image URL");
  return url;
}

function pickMime(data: Record<string, unknown>): string {
  const images = data.images as Array<{ content_type?: string }> | undefined;
  return images?.[0]?.content_type ?? "image/jpeg";
}

/** Submit a generation job to fal.ai queue. Returns the provider request ID. */
export async function submit(prompt: string, modelId: string): Promise<string> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY env var is not set");

  const endpoint = falEndpoint(modelId);
  const { request_id } = await fal.queue.submit(endpoint, {
    input: { prompt, num_images: 1 },
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
    return {
      status: "done",
      result: { url: pickUrl(data), mimeType: pickMime(data) },
    };
  }

  if ((status.status as string) === "FAILED") {
    return { status: "failed", error: "fal.ai job failed" };
  }

  return { status: "pending" };
}

export const supportedModelIds = Object.keys(FAL_MODEL_MAP);

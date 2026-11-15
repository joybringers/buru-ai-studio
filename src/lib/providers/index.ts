import * as falProvider from "./fal";
import type { GenerateStatus } from "./types";

export type { GenerateResult, GenerateStatus } from "./types";

const VIDEO_MODEL_IDS = new Set(["gen4-turbo", "veo-31-fast"]);

/** Submit a generation job. Returns the provider job ID. */
export async function submitJob(
  prompt: string,
  modelId: string
): Promise<string> {
  if (VIDEO_MODEL_IDS.has(modelId)) {
    throw new Error("Video generation is not yet available");
  }
  if (falProvider.supportedModelIds.includes(modelId)) {
    return falProvider.submit(prompt, modelId);
  }
  throw new Error(`Unknown model: ${modelId}`);
}

/** Poll a submitted job for its current status. */
export async function pollJob(
  providerJobId: string,
  modelId: string
): Promise<GenerateStatus> {
  if (VIDEO_MODEL_IDS.has(modelId)) {
    throw new Error("Video generation is not yet available");
  }
  if (falProvider.supportedModelIds.includes(modelId)) {
    return falProvider.poll(providerJobId, modelId);
  }
  throw new Error(`Unknown model: ${modelId}`);
}

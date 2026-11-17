import * as falProvider from "./fal";
import type { GenerateStatus } from "./types";

export type { GenerateResult, GenerateStatus } from "./types";
export { uploadToStorage } from "./fal";
export type { ToolOptions } from "./fal";

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

/** Submit a generation job. Returns the provider job ID. */
export async function submitJob(
  prompt: string,
  modelId: string,
  aspectRatio: AspectRatio = "1:1",
  imageUrl?: string,
  opts?: import("./fal").ToolOptions
): Promise<string> {
  if (falProvider.supportedModelIds.includes(modelId)) {
    return falProvider.submit(prompt, modelId, aspectRatio, imageUrl, opts);
  }
  throw new Error(`Unknown model: ${modelId}`);
}

/** Poll a submitted job for its current status. */
export async function pollJob(
  providerJobId: string,
  modelId: string
): Promise<GenerateStatus> {
  if (falProvider.supportedModelIds.includes(modelId)) {
    return falProvider.poll(providerJobId, modelId);
  }
  throw new Error(`Unknown model: ${modelId}`);
}

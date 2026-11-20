import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MODELS } from "@/config";
import { sendGenerationComplete } from "@/lib/email";

export const dynamic = "force-dynamic";

// fal.ai webhook payload shape
interface FalWebhookPayload {
  request_id: string;
  status: "OK" | "ERROR";
  payload?: Record<string, unknown>;
  error?: string;
}

function pickResultUrl(modelId: string, data: Record<string, unknown>): { url: string; mimeType: string } | null {
  const model = MODELS.find((m) => m.id === modelId);
  const isVideo = model?.type === "video";
  const isAudio = model?.type === "audio";

  if (isVideo) {
    const video = data.video as { url?: string } | undefined;
    if (video?.url) return { url: video.url, mimeType: "video/mp4" };
    return null;
  }

  if (isAudio) {
    const audio = data.audio_file as { url?: string } | undefined;
    if (audio?.url) return { url: audio.url, mimeType: "audio/wav" };
    return null;
  }

  // Tools that return video
  if (modelId === "tool-lipsync" || modelId === "tool-video-edit") {
    const video = data.video as { url?: string } | undefined;
    if (video?.url) return { url: video.url, mimeType: "video/mp4" };
    return null;
  }

  // Tools that return audio
  if (modelId === "tool-voice-clone" || modelId === "tool-voiceover") {
    const audio = (data.audio ?? data.audio_file) as { url?: string } | undefined;
    if (audio?.url) return { url: audio.url, mimeType: "audio/mp3" };
    return null;
  }

  // Single image tools
  if (["tool-upscale", "tool-bg-remove", "tool-faceswap", "tool-relight", "tool-expand"].includes(modelId)) {
    const img = (data.image ?? data.output) as { url?: string } | undefined;
    if (img?.url) return { url: img.url, mimeType: "image/png" };
    const imgs = data.images as Array<{ url: string }> | undefined;
    if (imgs?.[0]?.url) return { url: imgs[0].url, mimeType: "image/jpeg" };
    return null;
  }

  // Standard image (FLUX, Ideogram)
  const images = data.images as Array<{ url: string; content_type?: string }> | undefined;
  const img = images?.[0];
  if (!img?.url) return null;
  return { url: img.url, mimeType: img.content_type ?? "image/jpeg" };
}

export async function POST(req: NextRequest) {
  let body: FalWebhookPayload;
  try {
    body = await req.json() as FalWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { request_id, status, payload, error } = body;
  if (!request_id) {
    return NextResponse.json({ error: "Missing request_id" }, { status: 400 });
  }

  // Find the job by providerJobId
  const job = await prisma.job.findFirst({
    where: { providerJobId: request_id, status: "running" },
  });

  if (!job) {
    // Already settled or unknown — ack anyway
    return NextResponse.json({ ok: true });
  }

  if (status === "ERROR" || error) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: error ?? "fal.ai job failed" },
    });
    return NextResponse.json({ ok: true });
  }

  if (!payload) {
    return NextResponse.json({ ok: true });
  }

  const result = pickResultUrl(job.modelId, payload);
  if (!result) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: "No result URL in webhook payload" },
    });
    return NextResponse.json({ ok: true });
  }

  const { url, mimeType } = result;

  await prisma.$transaction([
    prisma.job.update({
      where: { id: job.id },
      data: { status: "done", resultUrl: url },
    }),
    prisma.asset.upsert({
      where: { jobId: job.id },
      create: { userId: job.userId, jobId: job.id, url, mimeType },
      update: { url, mimeType },
    }),
  ]);

  // Fire-and-forget completion email
  const user = await prisma.user.findUnique({
    where: { id: job.userId },
    select: { email: true },
  });
  if (user?.email) {
    const model = MODELS.find((m) => m.id === job.modelId);
    sendGenerationComplete({
      to: user.email,
      resultUrl: url,
      prompt: job.prompt,
      modelName: model?.name ?? job.modelId,
      isVideo: model?.type === "video",
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { debitUser, creditUser, InsufficientBalanceError } from "@/lib/ledger";
import { submitJob } from "@/lib/providers/index";
import { computeJobCredits } from "@/config";

export const dynamic = "force-dynamic";

const DEFAULT_VIDEO_MODEL = "kling-t2v";

export async function POST(
  _req: Request,
  { params }: { params: { id: string; sceneId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const scene = await prisma.directorScene.findFirst({
    where: { id: params.sceneId, projectId: params.id, project: { userId } },
  });
  if (!scene) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (scene.status === "generating") return NextResponse.json({ error: "Already generating" }, { status: 409 });

  const duration = scene.duration as "5" | "10";
  const creditsCharged = computeJobCredits(DEFAULT_VIDEO_MODEL, duration);

  const job = await prisma.job.create({
    data: { userId, prompt: scene.videoPrompt, modelId: DEFAULT_VIDEO_MODEL, creditsCharged, status: "pending" },
  });

  try {
    await debitUser(userId, creditsCharged, "video_gen", job.id);
  } catch (err) {
    await prisma.job.update({ where: { id: job.id }, data: { status: "failed" } });
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to charge credits" }, { status: 500 });
  }

  try {
    const providerJobId = await submitJob(scene.videoPrompt, DEFAULT_VIDEO_MODEL, "16:9", undefined, { duration });
    await prisma.job.update({ where: { id: job.id }, data: { providerJobId, status: "running" } });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await creditUser(userId, creditsCharged, "admin", job.id);
    await prisma.job.update({ where: { id: job.id }, data: { status: "failed", errorMessage: errMsg } });
    return NextResponse.json({ error: "Failed to submit job" }, { status: 500 });
  }

  await prisma.directorScene.update({
    where: { id: params.sceneId },
    data: { status: "generating", jobId: job.id },
  });

  return NextResponse.json({ jobId: job.id });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { poll } from "@/lib/providers/fal";
import { creditUser } from "@/lib/ledger";

export const dynamic = "force-dynamic";

const DEFAULT_VIDEO_MODEL = "kling-t2v";

export async function GET(
  _req: Request,
  { params }: { params: { id: string; sceneId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const scene = await prisma.directorScene.findFirst({
    where: { id: params.sceneId, projectId: params.id, project: { userId: session.user.id } },
    include: { project: true },
  });
  if (!scene) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Already done/failed — return current state
  if (scene.status === "done" || scene.status === "failed") {
    return NextResponse.json({ status: scene.status, videoUrl: scene.videoUrl });
  }

  if (!scene.jobId) return NextResponse.json({ status: scene.status });

  const job = await prisma.job.findUnique({ where: { id: scene.jobId } });
  if (!job?.providerJobId) return NextResponse.json({ status: "generating" });

  try {
    const result = await poll(job.providerJobId, DEFAULT_VIDEO_MODEL);

    if (result.status === "done" && result.result) {
      await prisma.$transaction([
        prisma.job.update({ where: { id: job.id }, data: { status: "done", resultUrl: result.result.url } }),
        prisma.directorScene.update({
          where: { id: params.sceneId },
          data: { status: "done", videoUrl: result.result.url },
        }),
        prisma.asset.create({
          data: { userId: session.user.id, jobId: job.id, url: result.result.url, mimeType: result.result.mimeType },
        }),
      ]);
      return NextResponse.json({ status: "done", videoUrl: result.result.url });
    }

    if (result.status === "failed") {
      await prisma.job.update({ where: { id: job.id }, data: { status: "failed" } });
      await prisma.directorScene.update({ where: { id: params.sceneId }, data: { status: "failed" } });
      await creditUser(session.user.id, job.creditsCharged, "admin", job.id);
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "generating" });
  } catch {
    return NextResponse.json({ status: "generating" });
  }
}

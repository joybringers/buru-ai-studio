import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { pollJob } from "@/lib/providers/index";
import { MODELS } from "@/config";
import { sendGenerationComplete } from "@/lib/email";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Ownership enforced by including userId in the query.
  const job = await prisma.job.findFirst({
    where: { id: params.id, userId },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Job already settled — return cached result without hitting the provider.
  if (job.status === "done") {
    return NextResponse.json({ status: "done", resultUrl: job.resultUrl });
  }
  if (job.status === "failed") {
    return NextResponse.json({ status: "failed", errorMessage: job.errorMessage });
  }

  // Job not yet forwarded to the provider.
  if (!job.providerJobId) {
    return NextResponse.json({ status: job.status });
  }

  const result = await pollJob(job.providerJobId, job.modelId);

  if (result.status === "done") {
    const { url, mimeType } = result.result;
    await prisma.$transaction([
      prisma.job.update({
        where: { id: job.id },
        data: { status: "done", resultUrl: url },
      }),
      prisma.asset.create({
        data: { userId, jobId: job.id, url, mimeType },
      }),
    ]);

    // Fire-and-forget email — don't block the response.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email) {
      const model = MODELS.find((m) => m.id === job.modelId);
      sendGenerationComplete({
        to: user.email,
        resultUrl: url,
        prompt: job.prompt,
        modelName: model?.name ?? job.modelId,
        isVideo: model?.type === "video",
      }).catch(() => {}); // swallow email errors
    }

    return NextResponse.json({ status: "done", resultUrl: url });
  }

  if (result.status === "failed") {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: result.error },
    });
    return NextResponse.json({ status: "failed", errorMessage: result.error });
  }

  // Still running.
  return NextResponse.json({ status: "running" });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { debitUser, creditUser, InsufficientBalanceError } from "@/lib/ledger";
import { submitJob } from "@/lib/providers/index";
import type { ToolOptions } from "@/lib/providers/fal";
import { TOOL_CREDITS } from "@/config";

interface SubmitToolOptions {
  modelId: string;
  prompt?: string;
  imageUrl?: string;
  opts?: ToolOptions;
}

export async function submitTool(input: SubmitToolOptions): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { modelId, prompt = "", imageUrl, opts } = input;
  const credits = TOOL_CREDITS[modelId];
  if (!credits) return NextResponse.json({ error: "Unknown tool" }, { status: 400 });

  if (imageUrl && !imageUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid imageUrl" }, { status: 400 });
  }

  const job = await prisma.job.create({
    data: { userId, prompt: prompt.slice(0, 1000), modelId, creditsCharged: credits, status: "pending" },
  });

  try {
    await debitUser(userId, credits, "image_gen", job.id);
  } catch (err) {
    await prisma.job.update({ where: { id: job.id }, data: { status: "failed", errorMessage: "Insufficient balance" } });
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    return NextResponse.json({ error: "Failed to charge credits" }, { status: 500 });
  }

  try {
    const providerJobId = await submitJob(prompt, modelId, "1:1", imageUrl, opts);
    await prisma.job.update({ where: { id: job.id }, data: { providerJobId, status: "running" } });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await creditUser(userId, credits, "admin", job.id);
    await prisma.job.update({ where: { id: job.id }, data: { status: "failed", errorMessage: errMsg } });
    return NextResponse.json({ error: "Failed to submit tool job" }, { status: 500 });
  }

  return NextResponse.json({ jobId: job.id });
}

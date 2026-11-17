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
  projectId?: string; // when set, checks the project's film quote hard cap
}

export async function submitTool(input: SubmitToolOptions): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { modelId, prompt = "", imageUrl, opts, projectId } = input;
  const credits = TOOL_CREDITS[modelId];
  if (!credits) return NextResponse.json({ error: "Unknown tool" }, { status: 400 });

  if (imageUrl && !imageUrl.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid imageUrl" }, { status: 400 });
  }

  // Hard cap check: if this job belongs to a project, enforce the film quote cap
  if (projectId) {
    const quote = await prisma.filmQuote.findUnique({ where: { projectId } });
    if (!quote) {
      return NextResponse.json({ error: "No accepted film quote for this project" }, { status: 402 });
    }
    if (!quote.acceptedAt) {
      return NextResponse.json({ error: "Film quote not yet accepted" }, { status: 402 });
    }
    if (quote.spentCredits + credits > quote.hardCap) {
      return NextResponse.json({ error: "Spending cap reached — film paused" }, { status: 402 });
    }
    // Increment spentCredits atomically
    await prisma.filmQuote.update({
      where: { projectId },
      data: { spentCredits: { increment: credits } },
    });
  }

  const job = await prisma.job.create({
    data: {
      userId,
      projectId: projectId ?? null,
      prompt: prompt.slice(0, 1000),
      modelId,
      creditsCharged: credits,
      status: "pending",
    },
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
    // Refund cap spend if the submit failed
    if (projectId) {
      await prisma.filmQuote.update({
        where: { projectId },
        data: { spentCredits: { decrement: credits } },
      });
    }
    await prisma.job.update({ where: { id: job.id }, data: { status: "failed", errorMessage: errMsg } });
    return NextResponse.json({ error: "Failed to submit tool job" }, { status: 500 });
  }

  return NextResponse.json({ jobId: job.id });
}

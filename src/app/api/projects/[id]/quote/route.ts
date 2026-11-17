import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TOOL_CREDITS } from "@/config";

// Credit rates for quote line items
const STAGE_RATES = {
  script:      5,
  bible:       20,  // per character (placeholder; will be per-item when bible is built)
  storyboard:  0,   // stills covered by video prep credits
  video:       0,   // calculated from shot count × tier rate
  voice:       15,  // per scene (voiceover tool rate)
  music:       20,  // per film (stable-audio flat)
  export:       5,  // flat
} as const;

function buildLineItems(targetLength: number, shotCount?: number) {
  const shots = shotCount ?? Math.ceil(targetLength / 10); // ~1 shot per 10s
  const videoCredits = shots * (TOOL_CREDITS["kling-i2v"] ?? 60);
  const voiceCredits = Math.ceil(targetLength / 30) * STAGE_RATES.voice;

  return [
    { stage: "script",     description: "Script draft + revisions",             credits: STAGE_RATES.script },
    { stage: "bible",      description: "Story bible (cast, locations, style)",  credits: STAGE_RATES.bible },
    { stage: "storyboard", description: `Storyboard stills (${shots} shots)`,    credits: shots * 5 },
    { stage: "video",      description: `Video render — ${shots} shots (Standard tier)`, credits: videoCredits },
    { stage: "voice",      description: "Dialogue + narration",                  credits: voiceCredits },
    { stage: "music",      description: "Background score",                      credits: STAGE_RATES.music },
    { stage: "export",     description: "Final export + review link",            credits: STAGE_RATES.export },
  ];
}

// GET — return existing quote (or 404 if none)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { quote: { include: { lineItems: true } } },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

// POST — generate (or regenerate) a quote for the project
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { quote: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cannot regenerate a locked (accepted) quote
  if (project.quote?.acceptedAt) {
    return NextResponse.json({ error: "Quote is locked — cannot regenerate" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const shotCount = body.shotCount as number | undefined;

  const lineItems = buildLineItems(project.targetLength, shotCount);
  const totalCredits = lineItems.reduce((s, l) => s + l.credits, 0);

  // Upsert quote
  const quote = await prisma.filmQuote.upsert({
    where: { projectId: id },
    create: {
      projectId: id,
      totalCredits,
      hardCap: totalCredits,
      lineItems: { create: lineItems },
    },
    update: {
      totalCredits,
      hardCap: totalCredits,
      lineItems: {
        deleteMany: {},
        create: lineItems,
      },
    },
    include: { lineItems: true },
  });

  await prisma.project.update({ where: { id }, data: { status: "quoted" } });

  return NextResponse.json(quote);
}

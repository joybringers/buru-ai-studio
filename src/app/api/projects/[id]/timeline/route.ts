import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { timeline: true, storyboard: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

// Init timeline — seeds shotOrder from approved storyboard shots
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { storyboard: true, timeline: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Seed order from storyboard if not yet initialised
  const existingOrder = (project.timeline?.shotOrder ?? []) as string[];
  const shots = (project.storyboard?.shots ?? []) as Array<{ id: string; status: string }>;
  const approvedIds = shots.filter((s) => s.status === "approved").map((s) => s.id);
  // Merge: keep existing order, append any new approved shots not yet in list
  const merged = [
    ...existingOrder.filter((sid) => approvedIds.includes(sid)),
    ...approvedIds.filter((sid) => !existingOrder.includes(sid)),
  ];

  const timeline = await prisma.timeline.upsert({
    where: { projectId: id },
    create: { projectId: id, shotOrder: merged },
    update: { shotOrder: merged, updatedAt: new Date() },
  });
  return NextResponse.json(timeline, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = { updatedAt: new Date() };
  if (body.shotOrder !== undefined) data.shotOrder = body.shotOrder;
  if (body.voiceTrack !== undefined) data.voiceTrack = body.voiceTrack;
  if (body.musicTrack !== undefined) data.musicTrack = body.musicTrack;
  if (body.lock === true) data.lockedAt = new Date();
  if (body.lock === false) data.lockedAt = null;

  const timeline = await prisma.timeline.update({ where: { projectId: id }, data });
  return NextResponse.json(timeline);
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface SceneSpec {
  title: string;
  description: string;
  videoPrompt: string;
  duration: "5" | "10";
  mood: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.directorProject.findMany({
    where: { userId: session.user.id },
    include: { scenes: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { concept } = await req.json() as { concept?: string };
  if (!concept?.trim()) return NextResponse.json({ error: "concept is required" }, { status: 400 });

  // Ask Claude to break the concept into 4-6 scenes
  const message = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are a video director AI. Break this video concept into 4-6 scenes for a short film.

Concept: "${concept.trim()}"

Return ONLY a JSON array (no markdown, no explanation) where each item has:
- title: string (3-5 words)
- description: string (1-2 sentences describing what happens visually)
- videoPrompt: string (a detailed cinematic prompt for AI video generation, 20-40 words)
- duration: "5" or "10" (seconds; use "10" for complex scenes)
- mood: string (one word: dramatic, serene, intense, mysterious, joyful, etc.)

Make sure the scenes tell a coherent story arc. Keep videoPrompts vivid, cinematic and descriptive.`,
    }],
  });

  let scenes: SceneSpec[] = [];
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    scenes = JSON.parse(cleaned) as SceneSpec[];
    if (!Array.isArray(scenes)) throw new Error("not array");
  } catch {
    return NextResponse.json({ error: "AI failed to generate scenes", raw: text }, { status: 500 });
  }

  // Derive a title from the concept (first 6 words)
  const title = concept.trim().split(/\s+/).slice(0, 6).join(" ");

  const project = await prisma.directorProject.create({
    data: {
      userId: session.user.id,
      title,
      concept: concept.trim(),
      status: "draft",
      scenes: {
        create: scenes.map((s, i) => ({
          order: i,
          title: s.title ?? `Scene ${i + 1}`,
          description: s.description ?? "",
          videoPrompt: s.videoPrompt ?? s.description ?? concept.trim(),
          duration: s.duration === "10" ? "10" : "5",
          mood: s.mood ?? "",
        })),
      },
    },
    include: { scenes: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(project);
}

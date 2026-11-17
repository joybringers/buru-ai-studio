import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: { script: true, bible: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.script || !(project.script.scenes as unknown[]).length) {
    return NextResponse.json({ error: "No script scenes — write your script first" }, { status: 400 });
  }

  const prompt = `You are a storyboard artist. Break this film script into camera shots for a storyboard.

FILM: "${project.title}"
SCENES:
${JSON.stringify(project.script.scenes, null, 2)}

${project.bible ? `STORY BIBLE (characters & locations for reference):
Characters: ${JSON.stringify((project.bible as { characters: unknown[] }).characters?.map((c: unknown) => (c as { name: string; description: string }).name + ": " + (c as { name: string; description: string }).description))}
Locations: ${JSON.stringify((project.bible as { locations: unknown[] }).locations?.map((l: unknown) => (l as { name: string; description: string }).name + ": " + (l as { name: string; description: string }).description))}` : ""}

Break each scene into 2–5 shots. Return JSON only:
{
  "shots": [
    {
      "id": "shot-1",
      "sceneId": "scene-1",
      "sceneTitle": "Scene title from script",
      "shotNumber": 1,
      "shotType": "wide",
      "cameraAngle": "eye-level",
      "cameraMove": "static",
      "description": "What the camera sees — subject, action, background (1-2 sentences)",
      "dialogue": "Any spoken dialogue in this shot, or empty string",
      "estimatedDuration": 8,
      "status": "draft"
    }
  ]
}

shotType options: wide | medium | close-up | extreme-close | over-shoulder | aerial | insert
cameraAngle options: eye-level | low-angle | high-angle | dutch
cameraMove options: static | pan | tilt | dolly | handheld | crane
estimatedDuration: seconds for this individual shot (2–15s typical)
Return ONLY the JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });

    const data = JSON.parse(jsonMatch[0]);
    const shots = Array.isArray(data.shots) ? data.shots : [];

    const sb = await prisma.storyboard.upsert({
      where: { projectId: id },
      create: { projectId: id, shots },
      update: { shots, updatedAt: new Date() },
    });
    return NextResponse.json(sb);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

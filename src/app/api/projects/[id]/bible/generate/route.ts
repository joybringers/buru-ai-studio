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
    include: { script: true },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!project.script || !(project.script.scenes as unknown[]).length) {
    return NextResponse.json({ error: "No script scenes found — write your script first" }, { status: 400 });
  }

  const prompt = `You are a story development assistant. Analyse this film script and extract the story bible.

FILM: "${project.title}"
SCENES:
${JSON.stringify(project.script.scenes, null, 2)}

Extract and return a JSON object with these exact keys:
{
  "characters": [
    {
      "id": "char-1",
      "name": "Full Name",
      "role": "protagonist | antagonist | supporting | minor",
      "age": "approx age or range",
      "description": "Physical appearance in 1-2 sentences",
      "personality": "Key personality traits in 1-2 sentences",
      "motivation": "What drives them in this story"
    }
  ],
  "locations": [
    {
      "id": "loc-1",
      "name": "Location Name",
      "type": "interior | exterior",
      "description": "Visual description in 1-2 sentences",
      "mood": "The feeling/atmosphere of this place",
      "timeOfDay": "day | night | dawn | dusk | varies"
    }
  ],
  "props": [
    {
      "id": "prop-1",
      "name": "Prop Name",
      "description": "What it is and its significance",
      "usedBy": "character name",
      "scenes": ["scene-1"]
    }
  ],
  "styleNotes": "2-3 sentences on the visual style, colour palette, and tone of this film"
}

Only include characters with speaking lines or meaningful screen time. Only include locations that actually appear. Only include props that are story-relevant. Return ONLY the JSON, no extra text.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });

    const data = JSON.parse(jsonMatch[0]);

    const bible = await prisma.storyBible.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        characters: data.characters ?? [],
        locations: data.locations ?? [],
        props: data.props ?? [],
        styleNotes: data.styleNotes ?? "",
      },
      update: {
        characters: data.characters ?? [],
        locations: data.locations ?? [],
        props: data.props ?? [],
        styleNotes: data.styleNotes ?? "",
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(bible);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

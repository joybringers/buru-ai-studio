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
    return NextResponse.json({ error: "No script to check" }, { status: 400 });
  }

  const prompt = `You are a script editor. Review this film script for continuity issues.

FILM: "${project.title}"
SCRIPT SCENES:
${JSON.stringify(project.script.scenes, null, 2)}

${project.bible ? `STORY BIBLE:
Characters: ${JSON.stringify(project.bible.characters)}
Locations: ${JSON.stringify(project.bible.locations)}` : ""}

Check for:
1. Character name consistency (same character referred to by different names)
2. Location continuity (impossible scene transitions)
3. Timeline issues (day/night inconsistencies, pacing problems)
4. Dialogue coherence (characters knowing things they shouldn't)
5. Plot holes (unresolved story threads)

Respond in this format:
## Continuity Report

**Overall: PASS / MINOR ISSUES / MAJOR ISSUES**

### Issues Found
(list each issue as: 🔴 MAJOR / 🟡 MINOR — Scene X — description)
(write "None" if no issues)

### Suggestions
(1–3 specific improvement suggestions, or "None" if the script is clean)`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const notes = response.content[0].type === "text" ? response.content[0].text : "";
    await prisma.script.update({
      where: { projectId: id },
      data: { continuityNotes: notes, updatedAt: new Date() },
    });
    return NextResponse.json({ notes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

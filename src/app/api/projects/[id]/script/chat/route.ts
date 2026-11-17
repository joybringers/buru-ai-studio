import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" });

function buildSystemPrompt(title: string, targetLength: number, scenes: unknown[]): string {
  const mins = Math.floor(targetLength / 60);
  const secs = targetLength % 60;
  const lengthStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const totalDur = (scenes as Array<{ estimatedDuration?: number }>)
    .reduce((s, sc) => s + (sc.estimatedDuration ?? 0), 0);

  return `You are a story assistant for BuruStudio, an AI film-making platform.
You help creators turn ideas into scripts for short films.

FILM: "${title}"
TARGET LENGTH: ${lengthStr} (${targetLength} seconds)
CURRENT RUNTIME: ${totalDur}s across ${scenes.length} scenes
CURRENT SCENES: ${scenes.length === 0 ? "None yet" : JSON.stringify(scenes, null, 2)}

YOUR JOB:
- Help the creator build a compelling scene-by-scene script
- Suggest scenes, dialogue, characters, locations
- Keep total duration within ${targetLength} seconds
- Write natural, engaging dialogue
- When making script changes, end your reply with a JSON block

SCENE JSON FORMAT — always use this exact shape in your JSON block:
\`\`\`json
{
  "scenes": [
    {
      "id": "scene-1",
      "title": "Scene title",
      "location": "Location name",
      "timeOfDay": "day",
      "characters": ["Character A", "Character B"],
      "action": "What happens in this scene (1-3 sentences).",
      "dialogue": [
        { "character": "Character A", "line": "What they say." }
      ],
      "estimatedDuration": 30
    }
  ]
}
\`\`\`

RULES:
- Each scene: 15 to 90 seconds estimated duration
- If the user asks to change something, include ALL scenes in the JSON (not just changed ones)
- If conversation is about planning (not writing), skip the JSON block
- Aim for authentic Nigerian voices, settings, and storytelling when relevant
- Keep dialogue natural — people speak in short sentences, not paragraphs`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { message } = await req.json();
  if (!message?.trim()) return new Response("message required", { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: {
      script: { include: { messages: { orderBy: { createdAt: "asc" }, take: 40 } } },
    },
  });
  if (!project) return new Response("Not found", { status: 404 });

  // Ensure script exists
  const script = project.script ?? await prisma.script.create({
    data: { projectId: id, scenes: [] },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  // Save user message
  await prisma.scriptMessage.create({
    data: { scriptId: script.id, role: "user", content: message.trim() },
  });

  const history = (script.messages ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Build streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullText = "";

      try {
        const anthropicStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 2000,
          system: buildSystemPrompt(project.title, project.targetLength, script.scenes as unknown[]),
          messages: [
            ...history,
            { role: "user", content: message.trim() },
          ],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            fullText += chunk.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
          }
        }

        // Extract JSON scenes block if present
        const jsonMatch = fullText.match(/```json\s*([\s\S]*?)```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsed.scenes)) {
              await prisma.script.update({
                where: { id: script.id },
                data: { scenes: parsed.scenes, version: { increment: 1 }, updatedAt: new Date() },
              });
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ scenes: parsed.scenes })}\n\n`)
              );
            }
          } catch {
            // malformed JSON in block — ignore
          }
        }

        // Save assistant message
        await prisma.scriptMessage.create({
          data: { scriptId: script.id, role: "assistant", content: fullText },
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

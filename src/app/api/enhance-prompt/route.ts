import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM: Record<string, string> = {
  image: `You are a cinematic AI image prompt engineer. Take the user's idea and enhance it with specific visual details: composition, lighting setup, lens choice, color palette, texture, atmosphere, and technical quality. Keep the core concept intact. Output ONLY the enhanced prompt, no explanation, no quotes, no preamble. Max 200 words.`,
  video: `You are a cinematic AI video prompt engineer. Take the user's idea and enhance it with specific filmic details: camera movement, shot type, lighting, color grade, depth of field, motion blur, pacing, atmosphere, and production quality. Keep the core concept intact. Output ONLY the enhanced prompt, no explanation, no quotes, no preamble. Max 200 words.`,
  audio: `You are an AI music prompt engineer. Take the user's idea and enhance it with specific sonic details: instrumentation, tempo, mood, dynamics, production style, texture, and atmosphere. Keep the core concept intact. Output ONLY the enhanced prompt, no explanation, no quotes, no preamble. Max 150 words.`,
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { prompt, modelType, referenceImageUrl } = body as {
    prompt?: string;
    modelType?: string;
    referenceImageUrl?: string;
  };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const type = (modelType === "video" || modelType === "audio") ? modelType : "image";
  const systemPrompt = SYSTEM[type];

  // Build message content — include reference image if provided
  type ContentBlock =
    | { type: "image"; source: { type: "url"; url: string } }
    | { type: "text"; text: string };

  const content: ContentBlock[] = [];

  if (referenceImageUrl && referenceImageUrl.startsWith("https://")) {
    content.push({
      type: "image",
      source: { type: "url", url: referenceImageUrl },
    });
    content.push({
      type: "text",
      text: `The image above is a character/style reference. Describe the person or subject's appearance accurately and weave those specific details into the enhanced prompt so AI generation produces a consistent result.\n\nPrompt to enhance: ${prompt.trim()}`,
    });
  } else {
    content.push({ type: "text", text: `Enhance this prompt: ${prompt.trim()}` });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    const enhanced = (message.content[0] as { type: string; text?: string })?.text?.trim() ?? prompt;
    return NextResponse.json({ enhanced });
  } catch (err) {
    console.error("[enhance-prompt]", err);
    return NextResponse.json({ error: "Enhancement failed" }, { status: 500 });
  }
}

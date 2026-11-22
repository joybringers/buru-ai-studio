import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Buru, the creative AI director at BuruStudio. You help users create stunning AI-generated images, videos, and audio.

When someone tells you what they want to create, engage naturally and get to the point fast. Ask at most ONE clarifying question if genuinely needed. For most requests, go straight to the creation.

When you are ready to generate, include this EXACT block in your response:

[CREATE]
title: [3-5 word name for this creation]
prompt: [detailed, optimised AI generation prompt — specific about style, lighting, mood, composition]
model: [one of: flux-schnell, flux-dev, flux-pro, nano-banana-pro, minimax-video, kling-t2v, stable-audio]
ratio: [one of: 1:1, 16:9, 9:16, 4:3, 3:4]
credits: [credit cost as a plain number]
[/CREATE]

Model & credit guide:
- flux-schnell (3 cr): fast drafts, quick experiments
- flux-dev (15 cr): high quality images
- flux-pro (25 cr): best image quality, commercial use
- nano-banana-pro (20 cr): images with text, posters, logos
- minimax-video (50 cr): 5-second text-to-video
- kling-t2v (60 cr): cinematic quality 5-second video
- stable-audio (20 cr): 30-second AI music or sound design

Ratio guide:
- 1:1 — product shots, social posts, general images
- 16:9 — landscape video, YouTube, presentations
- 9:16 — TikTok, Instagram Stories, Reels
- 4:3 — standard video, presentations

Write your conversational text BEFORE the [CREATE] block. Keep it brief — 1-2 sentences maximum. No markdown formatting. Talk like a creative collaborator, not a formal assistant.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Chat is not configured" }, { status: 503 });
  }

  let body: { messages: Anthropic.MessageParam[] };
  try {
    body = await req.json() as { messages: Anthropic.MessageParam[] };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { messages } = body;

  const stream = client.messages.stream({
    model: "claude-haiku-5-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(enc.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        console.error("[chat] stream error:", err);
        controller.enqueue(enc.encode("\n\nSomething went wrong with the AI service. Please try again."));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

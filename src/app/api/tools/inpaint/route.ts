import { NextResponse } from "next/server";
import { submitTool } from "@/lib/submitTool";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { imageUrl, prompt, strength } = body as { imageUrl?: string; prompt?: string; strength?: number };
  if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  if (!prompt?.trim()) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  return submitTool({ modelId: "tool-img-edit", imageUrl, prompt, opts: { strength } });
}

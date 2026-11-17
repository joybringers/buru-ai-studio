import { NextResponse } from "next/server";
import { submitTool } from "@/lib/submitTool";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { imageUrl, swapImageUrl } = body as { imageUrl?: string; swapImageUrl?: string };
  if (!imageUrl) return NextResponse.json({ error: "imageUrl (base) is required" }, { status: 400 });
  if (!swapImageUrl) return NextResponse.json({ error: "swapImageUrl (face) is required" }, { status: 400 });
  return submitTool({ modelId: "tool-faceswap", imageUrl, opts: { swapImageUrl } });
}

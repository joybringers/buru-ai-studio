import { NextResponse } from "next/server";
import { submitTool } from "@/lib/submitTool";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { imageUrl } = body as { imageUrl?: string };
  if (!imageUrl) return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  return submitTool({ modelId: "tool-bg-remove", imageUrl });
}

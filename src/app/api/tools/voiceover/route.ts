import { NextRequest } from "next/server";
import { submitTool } from "@/lib/submitTool";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, voice } = body as { text?: string; voice?: string };

  if (!text?.trim()) {
    const { NextResponse } = await import("next/server");
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  return submitTool({
    modelId: "tool-voiceover",
    prompt: text.trim(),
    opts: voice ? { voice } : undefined,
  });
}

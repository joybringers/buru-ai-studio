import { NextRequest } from "next/server";
import { submitTool } from "@/lib/submitTool";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { refAudioUrl, prompt, refText } = body as {
    refAudioUrl?: string;
    prompt?: string;
    refText?: string;
  };

  if (!refAudioUrl?.startsWith("https://")) {
    const { NextResponse } = await import("next/server");
    return NextResponse.json({ error: "refAudioUrl is required" }, { status: 400 });
  }
  if (!prompt?.trim()) {
    const { NextResponse } = await import("next/server");
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  return submitTool({
    modelId: "tool-voice-clone",
    prompt: prompt.trim(),
    opts: { refAudioUrl, refText },
  });
}

import { NextRequest } from "next/server";
import { submitTool } from "@/lib/submitTool";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { videoUrl, prompt } = body as { videoUrl?: string; prompt?: string };

  return submitTool({
    modelId: "tool-video-edit",
    prompt: prompt ?? "",
    opts: { videoUrl },
  });
}

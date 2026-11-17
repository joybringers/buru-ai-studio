import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Edit Video — BuruStudio" };
export default function VideoEditPage() {
  return (
    <ToolPage config={{
      modelId: "tool-video-edit",
      title: "Edit Video",
      description: "Upload a video clip and describe the changes you want. Powered by Kling video-to-video AI.",
      apiRoute: "/api/tools/video-edit",
      inputLabel: "Source video",
      inputIsVideo: true,
      hasPrompt: true,
      promptLabel: "Edit description",
      promptPlaceholder: "e.g. change the background to a snowy mountain, make it look like a 1970s film, add dramatic lighting…",
      outputIsVideo: true,
      badge: "NEW",
    }} />
  );
}

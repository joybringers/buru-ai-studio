import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Remove Background — BuruStudio" };
export default function BackgroundPage() {
  return (
    <ToolPage config={{
      modelId: "tool-bg-remove",
      title: "Remove Background",
      description: "Instantly remove the background from any photo. Output is a transparent PNG.",
      apiRoute: "/api/tools/background",
      inputLabel: "Image",
    }} />
  );
}

import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Edit Image — BuruStudio" };
export default function InpaintPage() {
  return (
    <ToolPage config={{
      modelId: "tool-img-edit",
      title: "Edit Image",
      description: "Transform any image with a text instruction using FLUX Dev. Describe the change you want.",
      apiRoute: "/api/tools/inpaint",
      inputLabel: "Source image",
      hasPrompt: true,
      promptLabel: "Edit instruction",
      promptPlaceholder: "e.g. make it sunset, change the background to a beach, add snow…",
      strengthControl: true,
    }} />
  );
}

import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Expand Scene — BuruStudio" };
export default function ExpandPage() {
  return (
    <ToolPage config={{
      modelId: "tool-expand",
      title: "Expand Scene",
      description: "Zoom out and extend your image. AI fills the surrounding area with matching style, lighting, and atmosphere.",
      apiRoute: "/api/tools/expand",
      inputLabel: "Image to expand",
      hasPrompt: true,
      promptLabel: "What's outside the frame? (optional)",
      promptPlaceholder: "e.g. more forest, city street continues, ocean horizon stretching out…",
      strengthControl: true,
      selectField: {
        label: "Expand direction",
        name: "direction",
        options: [
          { value: "on all sides",   label: "All sides" },
          { value: "to the left",    label: "Left" },
          { value: "to the right",   label: "Right" },
          { value: "upward",         label: "Up" },
          { value: "downward",       label: "Down" },
        ],
      },
      badge: "NEW",
    }} />
  );
}

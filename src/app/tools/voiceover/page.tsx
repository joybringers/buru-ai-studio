import ToolPage from "@/components/ToolPage";
export const metadata = { title: "Voice Over — BuruStudio" };
export default function VoiceoverPage() {
  return (
    <ToolPage config={{
      modelId: "tool-voiceover",
      title: "Voice Over",
      description: "Convert any text into natural-sounding speech. Great for ads, explainers, and social videos.",
      apiRoute: "/api/tools/voiceover",
      textOnlyInput: true,
      outputIsAudio: true,
      promptLabel: "Script",
      promptPlaceholder: "Type your script here — up to a minute of speech…",
      selectField: {
        label: "Voice",
        name: "voice",
        options: [
          { value: "af_heart",    label: "Heart (Female, US)" },
          { value: "af_bella",    label: "Bella (Female, US)" },
          { value: "af_sarah",    label: "Sarah (Female, US)" },
          { value: "am_adam",     label: "Adam (Male, US)" },
          { value: "am_michael",  label: "Michael (Male, US)" },
          { value: "bf_emma",     label: "Emma (Female, UK)" },
          { value: "bm_george",   label: "George (Male, UK)" },
        ],
      },
      badge: "NEW",
    }} />
  );
}

export type FilmTemplate = {
  id: string;
  title: string;
  genre: string;
  description: string;
  targetLength: number; // seconds
  icon: string;
  starterPrompt: string; // sent to script assistant on first open
};

export const FILM_TEMPLATES: FilmTemplate[] = [
  {
    id: "short-drama",
    title: "Short Drama",
    genre: "Drama",
    description: "An intimate character-driven story with emotional depth — perfect for a 90-second film.",
    targetLength: 90,
    icon: "🎭",
    starterPrompt: "I want to write a 90-second short drama. Help me start with a compelling opening scene that introduces the main character and hints at their central conflict.",
  },
  {
    id: "comedy-sketch",
    title: "Comedy Sketch",
    genre: "Comedy",
    description: "A punchy, funny sketch with a clear setup, escalation, and punchline in 60 seconds.",
    targetLength: 60,
    icon: "😄",
    starterPrompt: "I want to write a 60-second comedy sketch. Suggest a funny scenario with a clear setup and punchline. Keep it punchy with 2–3 characters.",
  },
  {
    id: "action-promo",
    title: "Action Promo",
    genre: "Action",
    description: "High-energy promotional or teaser film — fast cuts, strong visuals, 45 seconds.",
    targetLength: 45,
    icon: "💥",
    starterPrompt: "I want to write a 45-second high-energy action promo film. Suggest a fast-paced sequence of shots that builds tension and excitement. Think cinematic trailer style.",
  },
  {
    id: "documentary-intro",
    title: "Documentary Intro",
    genre: "Documentary",
    description: "An engaging opening segment that introduces a subject, place, or story in 2 minutes.",
    targetLength: 120,
    icon: "🎙️",
    starterPrompt: "I want to write a 2-minute documentary-style film opening. Help me craft an engaging first sequence that introduces the subject with narration, interviews, and visual storytelling.",
  },
  {
    id: "music-video",
    title: "Music Video",
    genre: "Music",
    description: "A 3-minute visual narrative or performance film set to music.",
    targetLength: 180,
    icon: "🎵",
    starterPrompt: "I want to storyboard a 3-minute music video. Help me plan a compelling visual narrative — alternating between performance shots and a storyline that complements the music mood.",
  },
  {
    id: "brand-story",
    title: "Brand Story",
    genre: "Commercial",
    description: "A 60-second brand film that tells an authentic story and ends with a clear message.",
    targetLength: 60,
    icon: "✨",
    starterPrompt: "I want to write a 60-second brand story film. Help me create an authentic narrative that shows real people, a problem being solved, and ends with a memorable brand moment.",
  },
];

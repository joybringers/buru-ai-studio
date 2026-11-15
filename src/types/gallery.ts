export interface GalleryAsset {
  id: string;
  url: string;
  mimeType: string;
  createdAt: string; // ISO string — serialisable across the server→client boundary
  job: {
    prompt: string;
    modelId: string;
  };
}

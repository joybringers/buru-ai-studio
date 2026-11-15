export interface GenerateResult {
  url: string;
  mimeType: string;
}

export type GenerateStatus =
  | { status: "pending" }
  | { status: "failed"; error: string }
  | { status: "done"; result: GenerateResult };

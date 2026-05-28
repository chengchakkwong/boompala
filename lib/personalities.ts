export type FeedbackPersonaId = "cheeky" | "supportive";

export const PERSONA_STORAGE_KEY = "cheekycat_feedback_persona_id";

export const PERSONA_OPTIONS: ReadonlyArray<{
  id: FeedbackPersonaId;
  label: string;
}> = [
  { id: "cheeky", label: "嘴賤貓" },
  { id: "supportive", label: "暖心教練" },
] as const;

export const DEFAULT_PERSONA_ID: FeedbackPersonaId = "cheeky";

export const PERSONA_SWITCH_NOTICE =
  "已切換教練，請重新上傳／分析";

export function normalizePersonaId(
  raw: string | null | undefined,
): FeedbackPersonaId {
  if (raw === "cheeky" || raw === "supportive") return raw;
  return DEFAULT_PERSONA_ID;
}

export function readStoredPersonaId(): FeedbackPersonaId {
  if (typeof window === "undefined") return DEFAULT_PERSONA_ID;
  return normalizePersonaId(localStorage.getItem(PERSONA_STORAGE_KEY));
}

export function writeStoredPersonaId(id: FeedbackPersonaId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PERSONA_STORAGE_KEY, id);
}

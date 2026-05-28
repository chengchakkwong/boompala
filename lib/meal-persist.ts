import { apiFetch, apiFetchForm } from "@/lib/api";
import { buildMealCreatePayload } from "@/lib/meal-session";
import type {
  AnalysisVersion,
  ConversationMessage,
  FeedbackPersonaId,
  Meal,
  MealCreatePayload,
} from "@/lib/types/meal";

export type PersistMealData = {
  versions: AnalysisVersion[];
  chosenVersionIndex: number;
  conversation: ConversationMessage[];
  contextText: string;
  personaId: FeedbackPersonaId;
};

export function buildPersistPayload(data: PersistMealData): MealCreatePayload {
  return buildMealCreatePayload(
    data.versions,
    data.chosenVersionIndex,
    data.conversation,
    data.contextText,
    data.personaId,
  );
}

export async function createMealInDiary(
  file: File,
  data: PersistMealData,
): Promise<Meal> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("meal_json", JSON.stringify(buildPersistPayload(data)));
  return apiFetchForm<Meal>("/api/meals", formData);
}

export async function updateMealInDiary(
  mealId: string,
  data: PersistMealData,
): Promise<Meal> {
  return apiFetch<Meal>(`/api/meals/${mealId}`, {
    method: "PATCH",
    body: buildPersistPayload(data),
  });
}

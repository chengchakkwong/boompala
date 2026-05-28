export type FeedbackPersonaId = "cheeky" | "supportive";

export interface AnalysisResult {
  dish_name: string;
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  visual_clues: string[];
  assumption_and_blindspots: string;
  confidence_score: number;
  cheeky_cat_comment: string;
}

export type UploadMode = "default" | "with_context";
export type VersionSource = "initial" | "chat_refine";

export interface AnalysisVersion extends AnalysisResult {
  version_index: number;
  source: VersionSource;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  version_index: number;
  cheeky_cat_comment?: string;
}

export interface Meal extends AnalysisResult {
  id: string;
  user_id: string;
  created_at: string;
  user_correction_note: string | null;
  upload_mode?: UploadMode;
  upload_context_text?: string | null;
  chosen_version_index?: number;
  analysis_versions?: AnalysisVersion[];
  conversation?: ConversationMessage[];
  analysis_source: string;
  reused_from_meal_id: string | null;
  image_path: string | null;
  image_url: string | null;
  feedback_persona_id?: FeedbackPersonaId;
}

export type MealCreatePayload = AnalysisResult & {
  chosen_version_index: number;
  upload_mode: UploadMode;
  upload_context_text: string | null;
  feedback_persona_id: FeedbackPersonaId;
  analysis_versions: AnalysisVersion[];
  conversation: ConversationMessage[];
};

export interface UserPreferences {
  feedback_persona_id: FeedbackPersonaId;
}

export interface RefineResponse {
  version_index: number;
  analysis: AnalysisResult;
}

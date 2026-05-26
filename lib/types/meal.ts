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

export interface Meal extends AnalysisResult {
  id: string;
  user_id: string;
  created_at: string;
  user_correction_note: string | null;
  analysis_source: string;
  reused_from_meal_id: string | null;
  image_path: string | null;
}

export type MealCreatePayload = AnalysisResult & {
  user_correction_note?: string | null;
};

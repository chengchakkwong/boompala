-- P1: meals 日記表 + RLS（embedding 欄位留 P3 加 pgvector）
-- 執行：Supabase Dashboard → SQL Editor → 貼上並 Run

CREATE TABLE IF NOT EXISTS public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  dish_name text NOT NULL,
  calories_kcal int NOT NULL,
  protein_g double precision NOT NULL,
  carbs_g double precision NOT NULL,
  fat_g double precision NOT NULL,
  visual_clues jsonb NOT NULL DEFAULT '[]'::jsonb,
  assumption_and_blindspots text NOT NULL,
  confidence_score double precision NOT NULL,
  cheeky_cat_comment text NOT NULL,
  user_correction_note text,
  analysis_source text NOT NULL DEFAULT 'gemini_fresh',
  reused_from_meal_id uuid REFERENCES public.meals (id) ON DELETE SET NULL,
  image_path text,
  CONSTRAINT meals_analysis_source_check CHECK (
    analysis_source IN ('gemini_fresh', 'reused_previous')
  )
);

CREATE INDEX IF NOT EXISTS meals_user_created_idx
  ON public.meals (user_id, created_at DESC);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY meals_select_own ON public.meals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY meals_insert_own ON public.meals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY meals_update_own ON public.meals
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY meals_delete_own ON public.meals
  FOR DELETE
  USING (auth.uid() = user_id);

-- 後端 service_role（FastAPI）需表級權限；僅 RLS 不足
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meals TO authenticated;

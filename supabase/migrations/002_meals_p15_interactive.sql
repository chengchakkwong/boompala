-- P1.5: 互動修正欄位（上傳模式、多版本、對話）
-- 執行：Supabase Dashboard → SQL Editor → 貼上並 Run

ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS upload_mode text NOT NULL DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS upload_context_text text,
  ADD COLUMN IF NOT EXISTS chosen_version_index int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS analysis_versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conversation jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.meals
  DROP CONSTRAINT IF EXISTS meals_upload_mode_check;

ALTER TABLE public.meals
  ADD CONSTRAINT meals_upload_mode_check CHECK (
    upload_mode IN ('default', 'with_context')
  );

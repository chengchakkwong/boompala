-- P4.5: 教練性格偏好 + 日記快照
-- 執行：Supabase Dashboard → SQL Editor → 貼上並 Run

-- ---------------------------------------------------------------------
-- user_preferences：登入使用者預設教練性格
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  feedback_persona_id text NOT NULL DEFAULT 'cheeky',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_persona_check CHECK (
    feedback_persona_id IN ('cheeky', 'supportive')
  )
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_preferences_select_own ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_preferences_insert_own ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_preferences_update_own ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON TABLE public.user_preferences TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_preferences TO authenticated;

-- ---------------------------------------------------------------------
-- meals：存檔時快照當次使用的教練性格（舊列可為 NULL → 視為 cheeky）
-- ---------------------------------------------------------------------
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS feedback_persona_id text;

ALTER TABLE public.meals
  DROP CONSTRAINT IF EXISTS meals_feedback_persona_check;

ALTER TABLE public.meals
  ADD CONSTRAINT meals_feedback_persona_check CHECK (
    feedback_persona_id IS NULL
    OR feedback_persona_id IN ('cheeky', 'supportive')
  );

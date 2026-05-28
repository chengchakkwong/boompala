# CheekyCat 開發日誌

產品決策的「為什麼」與設定筆記；**現行規格以 [PLAN-v1.md](PLAN-v1.md) 為準**，重大變更會在該文 §12 修訂紀錄留一行摘要。

**驗收／發版請對照**：[RELEASE-CHECKLIST.md](./RELEASE-CHECKLIST.md)  
**用戶更新日誌（版號 0.x）**：[CHANGELOG-POLICY.md](./CHANGELOG-POLICY.md) · App `/changelog`

> **最新**：P4.5 雙性格 feedback 規格已定（待實作）→ 本章 [§2026-05-29 — P4.5](#2026-05-29--p45-雙性格-feedback教練風格)

---

## 2026-05-26 — P0 登入：Email → Google OAuth

### 決策

- **改為**：僅 **Google OAuth**（Supabase Auth）。
- **不再做**：Email + 密碼、`/signup` 註冊表單。

### 原因

- 家人自用：多數已有 Google 帳號，一鍵登入比記密碼、收確認信方便。
- P0 後端仍驗 Supabase JWT（`sub` = `user_id`），**FastAPI 驗證邏輯不需因 provider 而改**。

### 取捨

| 優點 | 注意 |
|------|------|
| 免密碼、免 Confirm email | 必須有 Google 帳號才能登入 |
| 第一次 OAuth 即建 `auth.users` | Redirect URL 漏填會登入失敗（本機 + Vercel 都要加） |
| 與 P0 驗收目標一致（有 token / 無 token） | 日後若再加 Email，需做 account linking，避免同一人的兩個帳號 |

### Step 0（Supabase + Google Cloud）摘要

1. **Google Cloud Console**：OAuth 同意畫面、Web Client ID/Secret；Redirect URI = `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase → Authentication → Providers → Google**：填入 Client ID/Secret
3. **URL Configuration**：Site URL `http://localhost:3000`；Redirect URLs 含 `http://localhost:3000/**` 與正式 Vercel 網域
4. **建議關閉 Email provider**，避免與 Google 產生兩套帳號
5. 金鑰仍複製：Project URL、anon key、JWT secret → 前後端 `.env`

### P0 驗收（更新）

1. 訪客：`analyze-food` 仍可用  
2. `/login` → Google → 回站後已登入  
3. 帶 token：`GET /api/meals` → 200  
4. 無 token → 401  

---

## 2026-05-26 — P0 驗收完成

### 狀態

- **P0 已驗收**（本機 + Cloud Run）：登入後 `GET /api/meals` → **200 `[]`**；瀏覽器直接開 API（無 Bearer）→ **401** `未提供登入憑證`。
- 訪客仍可 `POST /api/analyze-food`。

### JWT 驗證（後端）

- Supabase access token 的 **`alg` 為 ES256**（非 Legacy HS256）。
- 後端改為 **`SUPABASE_URL` + JWKS**（`{URL}/auth/v1/.well-known/jwks.json`）驗簽；**不再使用** `SUPABASE_JWT_SECRET`。
- Cloud Run 環境變數：設 `SUPABASE_URL`（與前端 `NEXT_PUBLIC_SUPABASE_URL` 同一專案）；部署含 `cryptography` 的映像。

### 備註

- 在 `localhost:3000` 登入後，僅 **前端帶 `Authorization: Bearer`** 的請求會 200；直接開 Cloud Run `/api/meals` 網址仍 401，屬正常。
- 下一步：**P1**（`meals` 表、確認後存檔、`/history`）。

---

## 2026-05-26 — P1 日記 MVP（已驗收）

### 決策（D1–D6）

| # | 決策 |
|---|------|
| D1 | **Service role + FastAPI** 寫庫；`user_id` 僅來自 JWT `sub` |
| D2 | RLS 仍啟用（防日後直連）；後端用 service role + 應用層 `WHERE user_id` |
| D3 | 存檔前**不可**改熱量／巨量；僅 `user_correction_note` |
| D4 | `GET /api/meals` 預設 `limit=20`、`offset=0` |
| D5 | Migration：`supabase/migrations/001_meals.sql`（含 `GRANT` 給 `service_role`） |
| D6 | 不做 P2 Storage、P3 embedding／相似度 |

### 實作摘要

- **DB**：`meals` 表 + RLS 四 policy；`embedding` 留 P3。
- **後端**：`POST/GET/DELETE /api/meals`；`SUPABASE_SERVICE_ROLE_KEY`。
- **前端**：確認後「儲存到日記」、`/history`、`/history/[id]` 刪除；訪客 in-memory only。

### 驗收（本機，2026-05-26）

1. 登入 → 分析 → 儲存 → `/history` 可見該筆  
2. 訪客僅 analyze、不寫庫  
3. 未按「儲存」不出現在時間軸  
4. 詳情刪除後列表與再開該 id 不可見  

### 踩坑：`permission denied for table meals`（42501）

- **原因**：SQL 建表後未對 `service_role` 做表級 `GRANT`（與 RLS 無關）。
- **修復**：執行 migration 末尾的 `GRANT ... TO service_role`（已併入 `001_meals.sql`）。若表已建過，可單獨在 SQL Editor 執行該兩行 `GRANT`。

### 依賴

- `PyJWT>=2.10.1`（與 `supabase` / `supabase-auth` 相容；見後端 `requirements.txt`）。

### 下一步（當時）

- 正式環境：Cloud Run 設 `SUPABASE_SERVICE_ROLE_KEY` 並重新部署後端。  
- 產品：**P1.5** 規格 → 實作 → **P2**（Storage 原圖）。

---

## 2026-05-26 — P1.5 互動修正（規格定稿）

### 為何要做（相對 P1）

- P1 的 `user_correction_note` **只存文字、不參與 Gemini**，無法修正熱量／份量，實務上幾乎沒用。
- 需求：分析前補充圖中看不到的資訊；分析後可 **多輪對話** 讓 AI 重算；使用者 **N 選一** 版本再存檔；歷史可回看 **採用版本 + 對話**。

### 決策（P1.5-1～8）

| # | 決策 |
|---|------|
| P1.5-1 | 主流程改為 **上傳補充 + 聊天修正 + 版本選擇**；`user_correction_note` **deprecated**（舊列詳情仍顯示） |
| P1.5-2 | 上傳模式：**預設**（僅圖）／**補充說明**（圖 + `context_text`） |
| P1.5-3 | **訪客**：可補充模式 analyze；**不可** refine；UI「登入以解鎖與 AI 修正」 |
| P1.5-4 | **登入者**：每則聊天 → 新版完整 `NutritionalAnalysis`；UI **N 選一** 後存檔 |
| P1.5-5 | 存檔前 session：**僅前端記憶體**；重整即丟；不建 `analysis_sessions` 表 |
| P1.5-6 | **歷史詳情**：顯示採用 vN + 完整對話；可選只讀其他版本 |
| P1.5-7 | 階段順序：**P1.5 在 P1 與 P2 之間**；P3 可用 `upload_context_text`／對話摘要作 `prior_correction` |
| P1.5-8 | `REFINE_MAX_ROUNDS` 預設 **5**；僅登入可 refine |

### 實作摘要

- migration `002_meals_p15_interactive.sql`；`lib/meal-session.ts`、`apiFetchForm`。
- 首頁：預設／補充模式、版本列、聊天 refine、存檔送 `analysis_versions` + `conversation`。
- `/history/[id]`：採用版本、對話軸、其他版本摺疊；舊 `user_correction_note` 仍顯示。

### 狀態

- **P1.5 已驗收**（本機，2026-05-27）：補充說明 analyze、登入多輪 refine、N 選一存檔、詳情對話與版本、訪客鎖聊天、重整未存檔即丟，皆符合預期。
- migration `002` 已於 Supabase SQL Editor 執行。
- `REFINE_MAX_ROUNDS` 預設 **5**（版本總數含 v0）。

### 下一步

- 產品：**P2**（Storage 原圖）。

### 與 P2 / P3

- **P2**：存檔時上傳原圖；P1.5 refine 仍每次帶同一張 `file`，不依賴 Storage。
- **P3**：相似餐重算時可注入歷史補充與對話摘要。

---

## 2026-05-27 — P2 原圖雲端（已驗收）

### 決策（P2）

| # | 決策 |
|---|------|
| P2-1 | Bucket **`meal-photos`**（private）；僅後端 **service role** 上傳／刪除／簽 URL |
| P2-2 | `POST /api/meals`：**multipart**（`file` + `meal_json`）；與 analyze／refine 一致 |
| P2-3 | 路徑 `{user_id}/{meal_id}.jpg`；存檔前轉 **JPEG**（Pillow，長邊 2048、品質 85） |
| P2-4 | 讀圖：FastAPI 簽 **signed URL** → 回應 `image_url`（預設 1 小時） |
| P2-5 | 列表縮圖：**CSS `object-cover`**（不另存 thumb） |
| P2-6 | 上傳失敗 **rollback**（刪 Storage 殘檔 + 刪 DB 列）；刪除日記先刪 Storage（失敗 log，仍刪 DB） |
| P2-7 | 舊列 `image_path` 為 null：不顯示照片（僅文字） |

### 實作摘要

- **Supabase**：Dashboard 建立 private bucket `meal-photos`；說明見 `supabase/migrations/003_meal_photos_storage.md`。
- **後端**：`main.py` multipart 存檔、Storage CRUD、GET 附 `image_url`；`Pillow`；`.env.example` P2 變數。
- **前端**：存檔 `apiFetchForm` + `currentFile`；`/history` 縮圖、`/history/[id]` 大圖；`Meal.image_url`。

### 驗收（本機 + 正式，2026-05-27）

1. 登入 → 分析 → 儲存 → 列表與詳情可見當初照片  
2. 刪除該筆 → 日記消失；Storage 對應物件已刪  
3. P1／P1.5 無圖舊列：仍可讀，不顯示圖片區  

### 踩坑：multipart 與 JSON 不一致

- **現象**：`{"detail":[{"loc":["body","file"],"msg":"Field required"},...]}`  
- **原因**：後端已改 multipart，前端仍送 JSON（未部署／快取舊 bundle）。  
- **處理**：重啟 dev、硬重新整理；**前後端一起部署**。

### 下一步（當時）

- 產品：**P3**（embedding、30 天相似圖、沿用／重算）→ 見下文 **2026-05-29 已擱置**。

---

## 2026-05-29 — P3 相似圖：擱置決策

### 決策

- **P3 暫不實作、擱置**；完整規格仍保留於 [PLAN-v1.md](PLAN-v1.md) §2.5、§7，日後可再啟用。
- **下一步產品方向**：**P4**（優先使用者可感知功能，如每日熱量加總；見 PLAN §7 P4）。

### 原因

| 面向 | 說明 |
|------|------|
| 價值 | P3 主效益為 **省 Gemini token**（相似圖命中後可沿用上次、少打 Vision），非核心流程缺口 |
| 現況 | **P0–P2 已驗收**；登入者每次上傳仍走 analyze → P1.5 修正 → 存檔，與現行體驗一致 |
| 規模 | 家人／小規模自用；預算粗算（約 10 張／天）下 P3 邊際效益低 |
| 優先級 | **功能價值 > 省費優化**；先做 P4 等較有感功能較划算 |

### 擱置期間行為（不變）

- 首頁維持 **§6.3 P1.5 流程**（選圖 → analyze／refine → 存檔）；**不**做 `check-similar`。
- 訪客仍跳過相似度（與 PLAN §6.2 一致）。
- DB：`embedding` 欄位仍未加；`analysis_source`／`reused_from_meal_id` 已存在，現況皆為 `gemini_fresh`。

### 何時再啟用 P3（建議觸發條件）

- Gemini **月帳單或用量**明顯偏高；或
- 使用者反覆反映「同一道菜每次都要重等 AI」；或
- 準備擴大使用者、需主動控 API 成本。

### 備註

- 啟用 P3 時仍可依 P1.5 的 `upload_context_text`、對話摘要作 `prior_correction`（PLAN §2.5 不變）。

---

## 2026-05-29 — P4.5 雙性格 Feedback（教練風格）

### 背景

- 使用者反映：無論吃什麼、`cheeky_cat_comment` 都偏毒舌，缺少鼓勵，容易產生愧疚感。
- 目標：保留原有 **嘴賤貓（`cheeky`）**，新增 **暖心教練（`supportive`）**；日後可再擴充更多 `persona_id`。

### 決策

| # | 項目 | 決定 |
|---|------|------|
| D1 | 性格 ID | `cheeky`（**預設**）、`supportive` |
| D2 | UI | **僅首頁**（分析前）segmented 選擇；v1 不做設定頁、詳情不顯示教練名稱 |
| D3 | 切換規則 | 若當次 session 已有分析結果（versions 非空）→ **清空** versions／conversation，提示「**已切換教練，請重新上傳／分析**」 |
| D4 | Loading | 分析／修正／存檔中 **不可**切換性格 |
| D5 | 訪客 | `localStorage` key：`cheekycat_feedback_persona_id` |
| D6 | 登入偏好 | 表 **`user_preferences`**（非 `user_metadata`）；登入後 **伺服器偏好覆蓋** localStorage；改選時 `PATCH`；每次登入沿用上次設定 |
| D7 | 歷史 | `meals.feedback_persona_id` **快照**；舊列 NULL 視為 `cheeky`；**不**依日後改偏好 retroactive 改寫舊評語 |
| D8 | JSON 欄位名 | **保留** `cheeky_cat_comment`（語意為 AI 評語，不更名） |
| D9 | 非法 `persona_id` | **fallback `cheeky`**（不為 MVP 回 400） |
| D10 | 營養估算 | 兩種性格 **共用**同一套營養／JSON schema 規則；**僅** `cheeky_cat_comment` 語氣不同 |
| D11 | Migration | `supabase/migrations/003_feedback_persona.sql`；由維護者在 **Supabase Dashboard → SQL Editor** 手動 Run |
| D12 | 後端 repo | `C:\Users\user\Desktop\健身AppBackend`（`personalities.py` + 擴充 `main.py`） |
| D13 | 與 P4 關係 | **並列**：P4（每日熱量加總等）仍為規格下一步；**P4.5 插隊實作**（使用者體驗優先） |
| D14 | 用戶 changelog | 功能上線後新增 **0.7.0**（見 [CHANGELOG-POLICY.md](./CHANGELOG-POLICY.md)）；**規格階段不**改 `content/changelog.ts` |

### `supportive` 人設（寫入 prompt，非通用聊天）

- **像媽媽／支持型**：不責備、不製造焦慮；大餐先安慰再溫柔提醒。
- **溫暖親切**：可用「寶貝」等稱呼；可輕微碎碎念（喝水、別只靠手搖），但須**與本餐相關**。
- **小進步就誇**：有記錄、有蔬菜、份量合理等皆可肯定。
- **限制**：`cheeky_cat_comment` **≤120 字**、1～3 句、繁中；**禁止捏造**圖中沒有的事（運動量、熬夜、老闆等），除非 `context_text` 有寫；熱量須誠實。
- **不要求**「喵～」結尾。

### `cheeky` 護欄（調整現有 prompt）

- 保留毒舌、幽默、可「喵～」結尾。
- **禁止**人身攻擊、飲食羞恥、連續羞辱。
- 高熱量／炸物：**至少一句**緩和或明日可執行小建議。
- 同樣 ≤120 字、針對**本餐**。

### 技術摘要（待實作）

- 後端：`build_analyze_prompt` / `build_refine_prompt` 接受 `persona_id`；`GET/PATCH /api/me/preferences`；analyze／refine／meals 帶 persona。
- 前端：首頁 segmented、`persona_id` 進 FormData、存檔帶 `feedback_persona_id`。
- 實作細節見 Cursor plan：`.cursor/plans/教練性格_feedback_3603e796.plan.md`（若檔名不同，以 repo 內最新 P4.5 plan 為準）。

### 驗收（草案）

- [ ] `supportive`：高熱量餐有安慰、無羞辱、≤120 字
- [ ] `cheeky`：仍毒舌但有緩和／建議
- [ ] 訪客選 `supportive` 重開分頁仍記得（localStorage）
- [ ] 登入改偏好、重登仍保留；切換時 PATCH 成功
- [ ] 有 v0 時切換性格 → 清空 + 提示文案；loading 時不可切
- [ ] 存檔後 `meals.feedback_persona_id` 正確；舊列 NULL 詳情正常
- [ ] Dashboard 已執行 migration 003
- [ ] 上線後 `content/changelog.ts` 新增 0.7.0

### 部署順序（實作時）

1. Dashboard 執行 `003_feedback_persona.sql`
2. 部署 `健身AppBackend`（Cloud Run）
3. 部署前端（Vercel）

### 狀態

- **程式已實作**（前端 `健身App`、後端 `健身AppBackend`）；migration 003 已由維護者在 Dashboard 執行。
- **待部署**：Cloud Run（後端）→ Vercel（前端）；本機可先用 `uvicorn` + `npm run dev` 驗收。

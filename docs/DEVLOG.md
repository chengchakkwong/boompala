# CheekyCat 開發日誌

產品決策的「為什麼」與設定筆記；**現行規格以 [PLAN-v1.md](PLAN-v1.md) 為準**，重大變更會在該文 §12 修訂紀錄留一行摘要。

**驗收／發版請對照**：[RELEASE-CHECKLIST.md](./RELEASE-CHECKLIST.md)

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

### 下一步

- 產品：**P3**（embedding、30 天相似圖、沿用／重算）。

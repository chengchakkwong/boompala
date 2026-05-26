# CheekyCat 開發日誌

產品決策的「為什麼」與設定筆記；**現行規格以 [PLAN-v1.md](PLAN-v1.md) 為準**，重大變更會在該文 §12 修訂紀錄留一行摘要。

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

### 下一步

- 正式環境：Cloud Run 設 `SUPABASE_SERVICE_ROLE_KEY` 並重新部署後端。  
- 產品：**P2**（Storage 原圖）。

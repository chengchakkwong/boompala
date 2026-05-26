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

# CheekyCat — 功能驗收／發版文檔清單

> 完成一個 **P 階段、使用者可感知的變更、或要部署到 Vercel／Cloud Run** 時，請依序勾選。  
> 對話時可對 Agent 說：**「照 RELEASE-CHECKLIST 提醒我」** 或 **「驗收完成，跑文檔清單」**。

---

## 必做（每次使用者可感知的變更）

- [ ] **`docs/DEVLOG.md`**：新章節（日期 + 標題）、決策表、實作摘要、驗收結果、下一步
- [ ] **`docs/PLAN-v1.md` §12 修訂紀錄**：一行版本摘要 + 日期（可選連 DEVLOG 章節）
- [ ] **`docs/PLAN-v1.md` 頂部狀態列**：例如「P2 已驗收；下一步 P3」
- [ ] **`content/changelog.ts`**：最上方新增一筆，**用戶語言** 3～5 條 highlights（版號規則見 [CHANGELOG-POLICY.md](./CHANGELOG-POLICY.md)；勿貼 DEVLOG 原文）

## 依變更類型（有改才勾）

- [ ] **API／環境變數**：`健身AppBackend/.env.example`、前端 `.env.example`（若有）
- [ ] **資料庫**：`supabase/migrations/` 新檔 + Dashboard／SQL Editor 已執行備註寫進 DEVLOG
- [ ] **Storage／OAuth**：DEVLOG 寫 Step 0 設定；Redirect URL 等
- [ ] **`README.md`**：僅在里程碑（如 P0–P3 階段驗收）改「已驗收／下一步」一句

## 不要混用

| 檔案 | 給誰看 | 寫什麼 |
|------|--------|--------|
| `docs/DEVLOG.md` | 開發者 | 為什麼、JWT、migration、踩坑 |
| `content/changelog.ts` | App 用戶（`/changelog`） | 新功能、怎麼用；版號見 CHANGELOG-POLICY |
| `docs/PLAN-v1.md` §12 | 規格追溯 | 一行版本說明 |

## 相關路徑

| 資源 | 路徑 |
|------|------|
| 產品規格 | `docs/PLAN-v1.md` |
| 開發日誌 | `docs/DEVLOG.md` |
| 本清單 | `docs/RELEASE-CHECKLIST.md` |
| 用戶版號／更新日誌政策 | `docs/CHANGELOG-POLICY.md` |
| App 更新日誌資料 | `content/changelog.ts` |

## 快速口令（給 Cursor）

- `驗收完成，跑文檔清單`
- `照 RELEASE-CHECKLIST 檢查還缺什麼`
- `幫我起草 changelog 一筆（用戶版）`

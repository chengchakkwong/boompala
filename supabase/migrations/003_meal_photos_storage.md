# P2：meal-photos Storage bucket

後端使用 **service role** 上傳／刪除／簽 signed URL；前端不直連 Storage。

## Supabase Dashboard 一次性設定

1. **Storage** → **New bucket**
2. Name：`meal-photos`
3. **Public bucket**：關閉（private）
4. 不需為 `authenticated` 新增 upload policy（僅 FastAPI service role 操作）

## 路徑規則

- `{user_id}/{meal_id}.jpg`（存檔時後端轉 JPEG）
- `meals.image_path` 存上述相對路徑

## 驗收

- 登入 → 分析 → 儲存 → `/history` 列表與詳情可見照片
- 刪除日記 → DB 列消失；Storage 對應物件一併刪除（失敗時後端仍刪 DB 並記 log）

"use client";

import React, { useState } from "react";

// 從 FastAPI 回傳的結構化資料型態
interface AnalysisResult {
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

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFoodAnalysis = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 🚀 1. 讀取環境變數中的後端基礎網址
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // 🚀 2. 動態拼接 API 路徑（如果環境變數不小心壞掉，預設回退到本地端，確保程式不崩潰）
      const apiUrl = `${baseUrl || "http://127.0.0.1:8000"}/api/analyze-food`;
      
      console.log(`📡 賴皮貓正準備將照片發射至：${apiUrl}`);

      // 🚀 3. 將原本寫死的網址換成 apiUrl 變數
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`後端伺服器抗議！狀態碼: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      console.error("❌ 串接失敗:", err);
      const message =
        err instanceof Error ? err.message : "發生未知錯誤，快去檢查後端 Terminal！";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      void handleFoodAnalysis(file);
    }
  };

  const macroTotal =
    result != null ? result.protein_g + result.carbs_g + result.fat_g : 0;
  const macroPct = (grams: number) =>
    macroTotal > 0 ? Math.round((grams / macroTotal) * 100) : 0;

  return (
    <main className="flex-1 bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-600 md:text-4xl">
            💪 AI-Native 健身飲食追蹤器
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            上傳食物照片，利用 Vision AI 結構化精算三大營養素
          </p>
        </header>

        <hr className="border-slate-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[350px]">
            {imagePreview ? (
              <div className="w-full space-y-4">
                <img
                  src={imagePreview}
                  alt="Food preview"
                  className="w-full h-64 object-cover rounded-xl border border-slate-200"
                />
                <label className="block text-center text-xs text-emerald-600 font-medium cursor-pointer hover:underline">
                  重新上傳照片
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            ) : (
              <label className="w-full h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition p-4">
                <span className="text-4xl mb-2">📸</span>
                <span className="font-semibold text-slate-700">
                  點擊上傳或拍攝食物照片
                </span>
                <span className="text-xs text-slate-400 mt-1">支援 JPG, PNG 格式</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[350px]">
            {!imagePreview && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <span>📊</span>
                <p className="text-sm">請先在左側上傳照片，AI 將即時分析營養成分</p>
              </div>
            )}

            {imagePreview && loading && (
              <div className="space-y-4 animate-pulse w-full">
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                <div className="h-24 bg-slate-200 rounded"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                <p className="text-center text-sm text-slate-400 pt-8 animate-bounce">
                  AI 正在計算結構化數據並進行快取比對...
                </p>
              </div>
            )}

            {imagePreview && error && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm text-rose-600 font-medium">{error}</p>
                <p className="text-xs text-slate-400">
                  請確認 FastAPI 已在 http://127.0.0.1:8000 啟動
                </p>
              </div>
            )}

            {imagePreview && result && !loading && (
              <div className="space-y-6 w-full">
                <div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    AI 辨識成功 · 信心{" "}
                    {result?.confidence_score !== undefined
                      ? `${(result.confidence_score * 100).toFixed(0)}%`
                      : "計算中..."}
                  </span>
                  <h2 className="text-xl font-bold mt-2 text-slate-800">
                    {result.dish_name}
                  </h2>
                </div>

                <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-inner">
                  <span className="text-sm text-slate-300 font-medium">預估總熱量</span>
                  <span className="text-2xl font-black text-amber-400">
                    {result.calories_kcal}{" "}
                    <span className="text-xs">kcal</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    三大營養素 (Macros)
                  </h3>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">🍗 蛋白質</span>
                      <span className="font-bold text-blue-600">{result.protein_g} g</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${macroPct(result.protein_g)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">🥑 脂肪</span>
                      <span className="font-bold text-amber-600">{result.fat_g} g</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${macroPct(result.fat_g)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">🍚 碳水化合物</span>
                      <span className="font-bold text-rose-600">{result.carbs_g} g</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full"
                        style={{ width: `${macroPct(result.carbs_g)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-600">
                    偵測到線索數量: {result.visual_clues?.length ?? 0} 個
                  </p>
                  <ul className="list-disc list-inside">
                    {result.visual_clues?.map((clue, index) => (
                      <li key={index}>{clue}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">
                  {result.assumption_and_blindspots}
                </p>

                <p className="text-sm bg-amber-50 text-amber-800 p-3 rounded-lg">
                  🐱 {result.cheeky_cat_comment}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import React, { useState } from "react";

// 模擬 AI 辨識成功後的假數據（之後會從 Python 後端傳過來）
const mockResult = {
  dish_name: "番茄炒蛋（健身低油版）",
  estimated_total_calories: 480,
  ingredients: [
    { name: "雞蛋 (4顆)", weight_g: 200, protein: 26, carbs: 2, fat: 20 },
    { name: "牛番茄 (1.5顆)", weight_g: 150, protein: 1.5, carbs: 6, fat: 0.3 },
    { name: "橄欖油", weight_g: 15, protein: 0, carbs: 0, fat: 15 },
  ],
};

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // 模擬上傳照片的動作
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsLoading(true);
        setShowResult(false);
        
        // 模擬 AI 正在分析的 3 秒鐘骨架屏/等待效果
        setTimeout(() => {
          setIsLoading(false);
          setShowResult(true);
        }, 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 標題區 */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-600 md:text-4xl">
            💪 AI-Native 健身飲食追蹤器
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            上傳食物照片，利用 Vision AI 結構化精算三大營養素
          </p>
        </header>

        <hr className="border-slate-200" />

        {/* 主操作區：左右兩欄架構 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 左欄：照片上傳與預覽 */}
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
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            ) : (
              <label className="w-full h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition p-4">
                <span className="text-4xl mb-2">📸</span>
                <span className="font-semibold text-slate-700">點擊上傳或拍攝食物照片</span>
                <span className="text-xs text-slate-400 mt-1">支援 JPG, PNG 格式</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          {/* 右欄：AI 辨識結果（面試官最看重的數據呈現區） */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between min-h-[350px]">
            {!imagePreview && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <span>📊</span>
                <p className="text-sm">請先在左側上傳照片，AI 將即時分析營養成分</p>
              </div>
            )}

            {isLoading && (
              <div className="space-y-4 animate-pulse w-full">
                <div className="h-6 bg-slate-200 rounded w-2/3"></div>
                <div className="h-24 bg-slate-200 rounded"></div>
                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                <p className="text-center text-sm text-slate-400 pt-8 animate-bounce">AI 正在計算結構化數據並進行快取比對...</p>
              </div>
            )}

            {showResult && (
              <div className="space-y-6 w-full">
                <div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">AI 辨識成功</span>
                  <h2 className="text-xl font-bold mt-2 text-slate-800">{mockResult.dish_name}</h2>
                </div>

                {/* 總熱量顯示 */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-inner">
                  <span className="text-sm text-slate-300 font-medium">預估總熱量</span>
                  <span className="text-2xl font-black text-amber-400">{mockResult.estimated_total_calories} <span className="text-xs">kcal</span></span>
                </div>

                {/* 三大營養素極簡進度條 (Macros) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">三大營養素比例 (Macros)</h3>
                  
                  {/* 蛋白質 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">🍗 蛋白質</span>
                      <span className="font-bold text-blue-600">27.5 g</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>

                  {/* 碳水 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">🥑 脂肪</span>
                      <span className="font-bold text-amber-600">35.3 g</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: "50%" }}></div>
                    </div>
                  </div>

                  {/* 脂肪 */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">🍚 碳水化合物</span>
                      <span className="font-bold text-rose-600">14.0 g</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
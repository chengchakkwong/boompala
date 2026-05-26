"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MealDetailView } from "@/components/MealDetailView";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { AnalysisResult, Meal, MealCreatePayload } from "@/lib/types/meal";

export default function Home() {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleFoodAnalysis = async (file: File) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSaveError(null);
    setSaveSuccess(false);
    setResult(null);
    setCorrectionNote("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const apiUrl = `${getApiBaseUrl()}/api/analyze-food`;
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`後端伺服器抗議！狀態碼: ${response.status}`);
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "發生未知錯誤，請檢查後端是否啟動";
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

  const handleSaveToDiary = useCallback(async () => {
    if (!result) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload: MealCreatePayload = {
      ...result,
      user_correction_note: correctionNote.trim() || null,
    };

    try {
      const meal = await apiFetch<Meal>("/api/meals", {
        method: "POST",
        body: payload,
      });
      setSaveSuccess(true);
      router.push(`/history/${meal.id}`);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }, [result, correctionNote, router]);

  return (
    <main className="flex-1 bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-600 md:text-4xl">
            AI-Native 健身飲食追蹤器
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            上傳食物照片，AI 分析後由你確認才存入日記
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
                <p className="text-sm">請先在左側上傳照片，AI 將分析營養成分</p>
              </div>
            )}

            {imagePreview && loading && (
              <div className="space-y-4 animate-pulse w-full">
                <div className="h-6 bg-slate-200 rounded w-2/3" />
                <div className="h-24 bg-slate-200 rounded" />
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <p className="text-center text-sm text-slate-400 pt-8 animate-bounce">
                  AI 分析中…
                </p>
              </div>
            )}

            {imagePreview && error && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm text-rose-600 font-medium">{error}</p>
                <p className="text-xs text-slate-400">
                  請確認 FastAPI 已在 {getApiBaseUrl()} 啟動
                </p>
              </div>
            )}

            {imagePreview && result && !loading && (
              <div className="space-y-4">
                <MealDetailView
                  meal={result}
                  showCorrectionField={isLoggedIn}
                  correctionValue={correctionNote}
                  onCorrectionChange={setCorrectionNote}
                />

                {isLoggedIn ? (
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      disabled={saving || saveSuccess}
                      onClick={() => void handleSaveToDiary()}
                      className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                      {saving ? "儲存中…" : "儲存到日記"}
                    </button>
                    {saveError && (
                      <p className="text-xs text-rose-600 text-center">{saveError}</p>
                    )}
                  </div>
                ) : (
                  <div className="border-t border-slate-100 pt-4 text-center space-y-2">
                    <p className="text-xs text-slate-500">
                      登入後可將餐點存入日記並在多裝置同步
                    </p>
                    <Link
                      href="/login"
                      className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      登入以存入日記
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

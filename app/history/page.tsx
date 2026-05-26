"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { Meal } from "@/lib/types/meal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      try {
        const data = await apiFetch<Meal[]>("/api/meals?limit=20");
        setMeals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "無法載入日記");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <main className="flex-1 bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">飲食日記</h1>
            <p className="text-sm text-slate-500 mt-1">最近 20 筆，依時間倒序</p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-emerald-600 hover:underline shrink-0"
          >
            新增分析
          </Link>
        </header>

        {loading && (
          <p className="text-sm text-slate-400 text-center py-12">載入中…</p>
        )}

        {error && !loading && (
          <p className="text-sm text-rose-600 text-center py-12">{error}</p>
        )}

        {!loading && !error && meals.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <p className="text-slate-500">尚無紀錄</p>
            <Link
              href="/"
              className="inline-block text-sm font-medium text-emerald-600 hover:underline"
            >
              去首頁分析第一餐
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {meals.map((meal) => (
            <li key={meal.id}>
              <Link
                href={`/history/${meal.id}`}
                className="block bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:border-emerald-200 transition"
              >
                <div className="flex justify-between items-start gap-3">
                  {meal.image_url && (
                    <img
                      src={meal.image_url}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover shrink-0 bg-slate-100"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-slate-800 truncate">
                      {meal.dish_name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(meal.created_at)}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-amber-600 shrink-0">
                    {meal.calories_kcal}{" "}
                    <span className="text-xs font-medium">kcal</span>
                  </span>
                </div>
                {meal.user_correction_note && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                    備註：{meal.user_correction_note}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

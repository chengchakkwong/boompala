"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MealDetailView } from "@/components/MealDetailView";
import { apiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import type { Meal } from "@/lib/types/meal";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = typeof params.id === "string" ? params.id : "";

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!mealId) return;

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
        const data = await apiFetch<Meal>(`/api/meals/${mealId}`);
        setMeal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "無法載入餐點");
      } finally {
        setLoading(false);
      }
    })();
  }, [mealId, router]);

  const handleDelete = useCallback(async () => {
    if (!mealId || !confirm("確定要刪除這筆日記嗎？此操作無法復原。")) {
      return;
    }

    setDeleting(true);
    try {
      await apiFetch<void>(`/api/meals/${mealId}`, { method: "DELETE" });
      router.push("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
      setDeleting(false);
    }
  }, [mealId, router]);

  return (
    <main className="flex-1 bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            ← 返回日記
          </Link>
        </div>

        {loading && (
          <p className="text-sm text-slate-400 text-center py-12">載入中…</p>
        )}

        {error && !loading && (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-rose-600">{error}</p>
            <Link href="/history" className="text-sm text-emerald-600 hover:underline">
              返回列表
            </Link>
          </div>
        )}

        {meal && !loading && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <p className="text-xs text-slate-400">儲存於 {formatDate(meal.created_at)}</p>
            <MealDetailView meal={meal} correctionNote={meal.user_correction_note} />
            <div className="border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition"
              >
                {deleting ? "刪除中…" : "刪除此筆日記"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

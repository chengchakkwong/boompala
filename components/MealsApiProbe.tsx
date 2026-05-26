"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function MealsApiProbe() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const probeMeals = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setStatus("無 session");
        return;
      }

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
      const response = await fetch(`${baseUrl}/api/meals`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const body = await response.text();
      setStatus(`${response.status} ${body.slice(0, 80)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知錯誤";
      setStatus(`失敗：${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void probeMeals()}
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition"
        title="P0 驗收：帶 JWT 呼叫 GET /api/meals"
      >
        {loading ? "測試中…" : "測試日記 API"}
      </button>
      {status && (
        <span className="text-xs text-slate-500 max-w-[140px] truncate" title={status}>
          {status}
        </span>
      )}
    </div>
  );
}

import type { AnalysisResult } from "@/lib/types/meal";

type MealDetailViewProps = {
  meal: AnalysisResult;
  correctionNote?: string | null;
  showCorrectionField?: boolean;
  correctionValue?: string;
  onCorrectionChange?: (value: string) => void;
};

export function MealDetailView({
  meal,
  correctionNote,
  showCorrectionField = false,
  correctionValue = "",
  onCorrectionChange,
}: MealDetailViewProps) {
  const macroTotal = meal.protein_g + meal.carbs_g + meal.fat_g;
  const macroPct = (grams: number) =>
    macroTotal > 0 ? Math.round((grams / macroTotal) * 100) : 0;

  return (
    <div className="space-y-6 w-full">
      <div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          AI 辨識 · 信心 {(meal.confidence_score * 100).toFixed(0)}%
        </span>
        <h2 className="text-xl font-bold mt-2 text-slate-800">{meal.dish_name}</h2>
      </div>

      <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-inner">
        <span className="text-sm text-slate-300 font-medium">預估總熱量</span>
        <span className="text-2xl font-black text-amber-400">
          {meal.calories_kcal} <span className="text-xs">kcal</span>
        </span>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          三大營養素
        </h3>
        {(
          [
            ["蛋白質", meal.protein_g, "text-blue-600", "bg-blue-500"],
            ["脂肪", meal.fat_g, "text-amber-600", "bg-amber-500"],
            ["碳水化合物", meal.carbs_g, "text-rose-600", "bg-rose-500"],
          ] as const
        ).map(([label, grams, textClass, barClass]) => (
          <div key={label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold text-slate-700">{label}</span>
              <span className={`font-bold ${textClass}`}>{grams} g</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`${barClass} h-full rounded-full`}
                style={{ width: `${macroPct(grams)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {meal.visual_clues?.length > 0 && (
        <div className="text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-600">視覺線索</p>
          <ul className="list-disc list-inside">
            {meal.visual_clues.map((clue, index) => (
              <li key={index}>{clue}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">
        {meal.assumption_and_blindspots}
      </p>

      <p className="text-sm bg-amber-50 text-amber-800 p-3 rounded-lg">
        {meal.cheeky_cat_comment}
      </p>

      {showCorrectionField && onCorrectionChange && (
        <div className="space-y-1">
          <label
            htmlFor="correction-note"
            className="text-xs font-semibold text-slate-600"
          >
            修正備註（可選）
          </label>
          <textarea
            id="correction-note"
            rows={2}
            placeholder="例如：這是譚仔酸辣過橋，醬料偏油"
            value={correctionValue}
            onChange={(e) => onCorrectionChange(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
      )}

      {!showCorrectionField && correctionNote && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="text-xs font-semibold text-slate-500 mb-1">修正備註</p>
          <p>{correctionNote}</p>
        </div>
      )}
    </div>
  );
}

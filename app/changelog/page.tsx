import Link from "next/link";
import { CHANGELOG } from "@/content/changelog";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ChangelogPage() {
  return (
    <main className="flex-1 bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">更新日誌</h1>
            <p className="text-sm text-slate-500 mt-1">
              內測版 · 依版本由新到舊排列
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-emerald-600 hover:underline shrink-0"
          >
            回到首頁
          </Link>
        </header>

        <ol className="space-y-4 list-none p-0 m-0">
          {CHANGELOG.map((entry) => (
            <li
              key={entry.version}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  v{entry.version}
                </span>
                <time
                  dateTime={entry.date}
                  className="text-xs text-slate-400"
                >
                  {formatDate(entry.date)}
                </time>
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                {entry.title}
              </h2>
              <ul className="text-sm text-slate-600 space-y-1.5 list-disc pl-5">
                {entry.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p className="text-center text-xs text-slate-400 pb-4">
          持續微調中，感謝參與內測。
        </p>
      </div>
    </main>
  );
}

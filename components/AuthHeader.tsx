import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export async function AuthHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm font-bold text-emerald-600">
          CheekyCat
        </Link>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                href="/history"
                className="text-slate-600 hover:text-emerald-600 font-medium transition"
              >
                日記
              </Link>
              <span className="text-slate-600 truncate max-w-[200px] hidden sm:inline">
                {user.email ?? user.id.slice(0, 8)}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <span className="text-slate-500 text-xs hidden sm:inline">
                訪客可試用分析；登入以同步日記
              </span>
              <Link
                href="/login"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700 transition"
              >
                登入
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

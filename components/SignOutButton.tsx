"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50 transition"
    >
      登出
    </button>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MealDetailView } from "@/components/MealDetailView";
import { apiFetchForm, fetchPreferences, getApiBaseUrl, updatePreferences } from "@/lib/api";
import { createMealInDiary, updateMealInDiary } from "@/lib/meal-persist";
import {
  DEFAULT_PERSONA_ID,
  PERSONA_OPTIONS,
  PERSONA_SWITCH_NOTICE,
  readStoredPersonaId,
  writeStoredPersonaId,
  type FeedbackPersonaId,
} from "@/lib/personalities";
import {
  analysisToVersion,
  appendAssistantMessage,
  appendUserMessage,
  stripVersionMeta,
  versionLabel,
} from "@/lib/meal-session";
import { createClient } from "@/lib/supabase/client";
import type {
  AnalysisResult,
  AnalysisVersion,
  ConversationMessage,
  RefineResponse,
} from "@/lib/types/meal";
import type { PersistMealData } from "@/lib/meal-persist";

async function parseErrorResponse(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text) as { detail?: string };
    if (typeof json.detail === "string") return json.detail;
  } catch {
    /* ignore */
  }
  return text || `請求失敗（${response.status}）`;
}

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [contextText, setContextText] = useState("");
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [savedMealId, setSavedMealId] = useState<string | null>(null);
  const savedMealIdRef = useRef<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [versions, setVersions] = useState<AnalysisVersion[]>([]);
  const [chosenVersionIndex, setChosenVersionIndex] = useState(0);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [personaId, setPersonaId] = useState<FeedbackPersonaId>(DEFAULT_PERSONA_ID);
  const [personaSwitchNotice, setPersonaSwitchNotice] = useState<string | null>(
    null,
  );

  const previewAnalysis: AnalysisResult | null =
    versions.length > 0
      ? stripVersionMeta(
          versions.find((v) => v.version_index === chosenVersionIndex) ??
            versions[versions.length - 1],
        )
      : null;

  useEffect(() => {
    const supabase = createClient();
    const syncPersonaForSession = async (loggedIn: boolean) => {
      if (loggedIn) {
        try {
          const prefs = await fetchPreferences();
          setPersonaId(prefs.feedback_persona_id);
          writeStoredPersonaId(prefs.feedback_persona_id);
        } catch {
          setPersonaId(readStoredPersonaId());
        }
      } else {
        setPersonaId(readStoredPersonaId());
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      void syncPersonaForSession(loggedIn);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session;
      setIsLoggedIn(loggedIn);
      void syncPersonaForSession(loggedIn);
    });
    return () => subscription.unsubscribe();
  }, []);

  const setSavedMeal = useCallback((mealId: string | null) => {
    savedMealIdRef.current = mealId;
    setSavedMealId(mealId);
  }, []);

  const resetSession = useCallback(() => {
    setVersions([]);
    setChosenVersionIndex(0);
    setConversation([]);
    setChatInput("");
    setError(null);
    setPersistError(null);
    setSavedMeal(null);
  }, [setSavedMeal]);

  const syncMealToDiary = useCallback(
    async (data: PersistMealData, file: File | null) => {
      if (!isLoggedIn) return;

      setPersisting(true);
      setPersistError(null);

      try {
        const mealId = savedMealIdRef.current;
        if (mealId) {
          await updateMealInDiary(mealId, data);
        } else {
          if (!file) {
            setPersistError("找不到照片，請重新選擇圖片");
            return;
          }
          const meal = await createMealInDiary(file, data);
          setSavedMeal(meal.id);
        }
      } catch (err: unknown) {
        setPersistError(err instanceof Error ? err.message : "同步日記失敗");
      } finally {
        setPersisting(false);
      }
    },
    [isLoggedIn, setSavedMeal],
  );

  const retryPersist = useCallback(() => {
    if (versions.length === 0) return;
    void syncMealToDiary(
      {
        versions,
        chosenVersionIndex,
        conversation,
        contextText,
        personaId,
      },
      currentFile,
    );
  }, [
    versions,
    chosenVersionIndex,
    conversation,
    contextText,
    personaId,
    currentFile,
    syncMealToDiary,
  ]);

  const handlePersonaChange = useCallback(
    (next: FeedbackPersonaId) => {
      if (next === personaId) return;
      if (versions.length > 0) {
        resetSession();
        setPersonaSwitchNotice(PERSONA_SWITCH_NOTICE);
      }
      setPersonaId(next);
      writeStoredPersonaId(next);
      if (isLoggedIn) {
        void updatePreferences(next).catch(() => {
          /* 偏好同步失敗不阻擋本地切換 */
        });
      }
    },
    [personaId, versions.length, resetSession, isLoggedIn],
  );

  const handleFoodAnalysis = async (file: File) => {
    setLoading(true);
    setError(null);
    setPersonaSwitchNotice(null);
    resetSession();

    const trimmedContext = contextText.trim();
    const formData = new FormData();
    formData.append("file", file);
    if (trimmedContext) {
      formData.append("context_text", trimmedContext);
    }
    formData.append("persona_id", personaId);

    try {
      const headers: Record<string, string> = {};
      if (isLoggedIn) {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }
      }
      const response = await fetch(`${getApiBaseUrl()}/api/analyze-food`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      const data = (await response.json()) as AnalysisResult;
      const initialVersions = [analysisToVersion(data, 0, "initial")];
      setVersions(initialVersions);
      setChosenVersionIndex(0);

      if (isLoggedIn) {
        await syncMealToDiary(
          {
            versions: initialVersions,
            chosenVersionIndex: 0,
            conversation: [],
            contextText,
            personaId,
          },
          file,
        );
      }
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
      resetSession();
      setCurrentFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitAnalysis = () => {
    if (!currentFile || loading) return;
    void handleFoodAnalysis(currentFile);
  };

  const handleRefine = async () => {
    if (!currentFile || !chatInput.trim() || versions.length === 0) return;

    const message = chatInput.trim();
    const nextIndex = versions.length;
    const conversationWithUser = appendUserMessage(
      conversation,
      message,
      nextIndex,
    );

    setRefining(true);
    setError(null);
    setChatInput("");

    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("message", message);
    formData.append("versions_json", JSON.stringify(versions));
    formData.append("conversation_json", JSON.stringify(conversationWithUser));
    const trimmedContext = contextText.trim();
    if (trimmedContext) {
      formData.append("upload_context_text", trimmedContext);
    }
    formData.append("persona_id", personaId);

    try {
      const data = await apiFetchForm<RefineResponse>(
        "/api/analyze-food/refine",
        formData,
      );
      const newVersion = analysisToVersion(
        data.analysis,
        data.version_index,
        "chat_refine",
      );
      const nextVersions = [...versions, newVersion];
      const nextConversation = appendAssistantMessage(
        conversationWithUser,
        data.analysis,
        data.version_index,
      );
      setVersions(nextVersions);
      setConversation(nextConversation);
      setChosenVersionIndex(data.version_index);

      if (isLoggedIn) {
        await syncMealToDiary(
          {
            versions: nextVersions,
            chosenVersionIndex: data.version_index,
            conversation: nextConversation,
            contextText,
            personaId,
          },
          currentFile,
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "修正失敗");
      setChatInput(message);
    } finally {
      setRefining(false);
    }
  };

  const handleChooseVersion = (versionIndex: number) => {
    setChosenVersionIndex(versionIndex);
    if (!isLoggedIn || versions.length === 0) return;
    void syncMealToDiary(
      {
        versions,
        chosenVersionIndex: versionIndex,
        conversation,
        contextText,
        personaId,
      },
      currentFile,
    );
  };

  const hasResult = versions.length > 0 && previewAnalysis;
  const canSubmitAnalysis = !!currentFile && !loading && !refining;
  const inputLocked = loading || refining || persisting;

  return (
    <main className="flex-1 bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-emerald-600 md:text-4xl">
            AI-Native 健身飲食追蹤器
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            上傳照片後可選填補充，按「開始分析」再交由 AI 估算營養
          </p>
        </header>

        <hr className="border-slate-200" />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600">教練風格</p>
          <div
            className="flex rounded-xl bg-slate-100 p-1 gap-1"
            role="group"
            aria-label="教練風格"
          >
            {PERSONA_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                disabled={inputLocked}
                onClick={() => handlePersonaChange(opt.id)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                  personaId === opt.id
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                } disabled:opacity-50`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {personaSwitchNotice && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              {personaSwitchNotice}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[350px]">
            {imagePreview ? (
              <div className="w-full flex flex-col gap-4 flex-1">
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
                    disabled={inputLocked}
                  />
                </label>

                <div className="space-y-2">
                  <label
                    htmlFor="context-text"
                    className="block text-xs font-semibold text-slate-600"
                  >
                    補充說明（選填）
                  </label>
                  <textarea
                    id="context-text"
                    rows={2}
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    disabled={inputLocked}
                    placeholder="例如：三哥酸辣薯粉加腩肉（可留空）"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <button
                  type="button"
                  disabled={!canSubmitAnalysis}
                  onClick={handleSubmitAnalysis}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {loading
                    ? "分析中…"
                    : hasResult
                      ? "重新分析"
                      : "開始分析"}
                </button>
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

            {imagePreview && !loading && !hasResult && !error && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 text-center">
                <span>✨</span>
                <p className="text-sm">照片已就緒，請在左側按「開始分析」</p>
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

            {imagePreview && error && !loading && !hasResult && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <span className="text-2xl">⚠️</span>
                <p className="text-sm text-rose-600 font-medium">{error}</p>
                <p className="text-xs text-slate-400">
                  請確認 FastAPI 已在 {getApiBaseUrl()} 啟動
                </p>
              </div>
            )}

            {imagePreview && hasResult && !loading && previewAnalysis && (
              <div className="space-y-4">
                {error && (
                  <p className="text-xs text-rose-600 text-center">{error}</p>
                )}
                {versions.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {versions.map((v) => (
                      <button
                        key={v.version_index}
                        type="button"
                        onClick={() => handleChooseVersion(v.version_index)}
                        disabled={persisting}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                          chosenVersionIndex === v.version_index
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {versionLabel(v.version_index)}
                      </button>
                    ))}
                  </div>
                )}

                <MealDetailView meal={previewAnalysis} />

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">與 AI 修正</p>
                  {isLoggedIn ? (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={refining || persisting}
                          placeholder="例如：這是三人份，但我們兩個人吃"
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleRefine();
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={refining || persisting || !chatInput.trim()}
                          onClick={() => void handleRefine()}
                          className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                        >
                          {refining ? "…" : "送出"}
                        </button>
                      </div>
                      {conversation.length > 0 && (
                        <ul className="max-h-28 overflow-y-auto space-y-1 text-xs text-slate-500">
                          {conversation.map((msg, i) => (
                            <li
                              key={i}
                              className={
                                msg.role === "user" ? "text-slate-700" : "text-slate-500"
                              }
                            >
                              <span className="font-medium">
                                {msg.role === "user" ? "你" : "貓"}：
                              </span>{" "}
                              {msg.content.slice(0, 80)}
                              {msg.content.length > 80 ? "…" : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      <Link href="/login" className="text-emerald-600 font-medium hover:underline">
                        登入
                      </Link>
                      以解鎖與 AI 修正
                    </p>
                  )}
                </div>

                {isLoggedIn ? (
                  <div className="space-y-2 border-t border-slate-100 pt-4 text-center">
                    {persisting && (
                      <p className="text-xs text-slate-500">同步至日記中…</p>
                    )}
                    {!persisting && savedMealId && !persistError && (
                      <p className="text-xs text-emerald-700">
                        已自動存入日記
                        <Link
                          href={`/history/${savedMealId}`}
                          className="ml-1 font-medium underline hover:text-emerald-800"
                        >
                          查看
                        </Link>
                      </p>
                    )}
                    {persistError && (
                      <div className="space-y-2">
                        <p className="text-xs text-rose-600">{persistError}</p>
                        <button
                          type="button"
                          onClick={retryPersist}
                          disabled={persisting}
                          className="text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
                        >
                          重試同步
                        </button>
                      </div>
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

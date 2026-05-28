import { createClient } from "@/lib/supabase/client";
import type { FeedbackPersonaId, UserPreferences } from "@/lib/types/meal";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("請先登入");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (typeof json.detail === "string") {
        detail = json.detail;
      }
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `請求失敗（${response.status}）`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

type ApiFetchFormOptions = {
  method?: string;
  auth?: boolean;
};

export async function apiFetchForm<T>(
  path: string,
  formData: FormData,
  options: ApiFetchFormOptions = {},
): Promise<T> {
  const { method = "POST", auth = true } = options;
  const headers: Record<string, string> = {};

  if (auth) {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("請先登入");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try {
      const json = JSON.parse(text) as { detail?: string };
      if (typeof json.detail === "string") {
        detail = json.detail;
      }
    } catch {
      /* use raw text */
    }
    throw new Error(detail || `請求失敗（${response.status}）`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  return apiFetch<UserPreferences>("/api/me/preferences");
}

export async function updatePreferences(
  feedback_persona_id: FeedbackPersonaId,
): Promise<UserPreferences> {
  return apiFetch<UserPreferences>("/api/me/preferences", {
    method: "PATCH",
    body: { feedback_persona_id },
  });
}

// api.ts — API klients

import { CONFIG } from "./config";
import { $auth, clearAuth } from "./store";
import type { HistoryResponse, CheckDetail, Limits, ApiError } from "./types";
import { MOCK_HISTORY, MOCK_LIMITS, getMockCheckDetail } from "./mock-data";

// Veic autorizētu API pieprasījumu
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = $auth.get();
  if (!auth) {
    throw new Error("Nav autorizēts");
  }

  const response = await fetch(`${CONFIG.WORKER_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "X-Auth-Provider": auth.provider,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    clearAuth();
    const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    window.location.href = `${basePath}/`;
    throw new Error("Sesija beigusies");
  }

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error?.message || "API kļūda");
  }

  return response.json() as Promise<T>;
}

// Iegūst pārbaužu vēsturi
export async function fetchHistory(
  limit = 20,
  offset = 0
): Promise<HistoryResponse> {
  // Mock mode
  if (CONFIG.MOCK_MODE) {
    await delay(300); // Simulē tīkla aizkavi
    const checks = MOCK_HISTORY.slice(offset, offset + limit);
    return {
      checks,
      total: MOCK_HISTORY.length,
      limit,
      offset,
    };
  }

  return apiRequest<HistoryResponse>(
    `/api/history?limit=${limit}&offset=${offset}`
  );
}

// Iegūst konkrētas pārbaudes detaļas
export async function fetchCheckById(id: number): Promise<CheckDetail> {
  // Mock mode
  if (CONFIG.MOCK_MODE) {
    await delay(300);
    return getMockCheckDetail(id);
  }

  return apiRequest<CheckDetail>(`/api/check/${id}`);
}

// Iegūst limitu informāciju
export async function fetchLimits(): Promise<Limits> {
  // Mock mode
  if (CONFIG.MOCK_MODE) {
    await delay(100);
    return MOCK_LIMITS;
  }

  return apiRequest<Limits>("/api/limits");
}

// Palīgfunkcija aizkaves simulēšanai
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Formatē datumu latviski
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("lv-LV", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formatē relatīvo laiku
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "tikko";
  if (diffMins < 60) return `pirms ${diffMins} min`;
  if (diffHours < 24) return `pirms ${diffHours} st`;
  if (diffDays < 7) return `pirms ${diffDays} d`;
  return formatDate(dateString);
}

// Saīsina URL attēlošanai
export function truncateUrl(url: string, maxLength = 50): string {
  try {
    const parsed = new URL(url);
    const display = parsed.hostname + parsed.pathname;
    if (display.length <= maxLength) return display;
    return display.substring(0, maxLength - 3) + "...";
  } catch {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + "...";
  }
}

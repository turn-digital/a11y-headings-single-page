// store.ts — nanostores stāvokļa pārvaldība

import { atom } from "nanostores";
import type { AuthData, Limits, HistoryCheck, CheckDetail } from "./types";
import { CONFIG } from "./config";
import { MOCK_USER, MOCK_LIMITS } from "./mock-data";

// Auth stāvoklis
export const $auth = atom<AuthData | null>(null);
export const $isAuthLoading = atom<boolean>(true);

// Limits stāvoklis
export const $limits = atom<Limits | null>(null);

// Vēstures stāvoklis
export const $checks = atom<HistoryCheck[]>([]);
export const $checksTotal = atom<number>(0);
export const $checksOffset = atom<number>(0);
export const $checksLoading = atom<boolean>(false);

// Pašreizējās pārbaudes detaļas
export const $currentCheck = atom<CheckDetail | null>(null);
export const $currentCheckLoading = atom<boolean>(false);

// Kļūdu stāvoklis
export const $error = atom<string | null>(null);

// Inicializē auth no localStorage (vai mock mode)
export function initAuthFromStorage(): void {
  if (typeof window === "undefined") return;

  // Mock mode — izmanto viltotus datus
  if (CONFIG.MOCK_MODE) {
    $auth.set({
      token: "mock_token",
      provider: "google",
      user: MOCK_USER,
    });
    $limits.set(MOCK_LIMITS);
    $isAuthLoading.set(false);
    return;
  }

  const stored = localStorage.getItem("auth");
  if (stored) {
    try {
      const authData = JSON.parse(stored) as AuthData;
      $auth.set(authData);
    } catch {
      localStorage.removeItem("auth");
    }
  }
  $isAuthLoading.set(false);
}

// Saglabā auth localStorage
export function setAuth(authData: AuthData): void {
  $auth.set(authData);
  localStorage.setItem("auth", JSON.stringify(authData));
}

// Izdzēš auth
export function clearAuth(): void {
  $auth.set(null);
  $limits.set(null);
  localStorage.removeItem("auth");
}

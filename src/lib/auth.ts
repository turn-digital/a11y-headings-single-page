// auth.ts — OAuth PKCE autentifikācija

import { CONFIG } from "./config";
import { setAuth, clearAuth, $auth, $limits } from "./store";
import type { AuthData, Limits, User } from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Ģenerē drošu nejaušu virkni
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Base64 URL kodējums
function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Ģenerē code_challenge no code_verifier
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

// Sāk Google OAuth plūsmu
export async function initiateGoogleLogin(returnTo?: string): Promise<void> {
  const codeVerifier = generateRandomString(32);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Saglabā code_verifier un return URL
  sessionStorage.setItem("oauth_code_verifier", codeVerifier);
  if (returnTo) {
    sessionStorage.setItem("oauth_return_to", returnTo);
  }

  const params = new URLSearchParams({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    redirect_uri: CONFIG.getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
  });

  window.location.href = `${GOOGLE_AUTH_URL}?${params}`;
}

// Apstrādā OAuth callback
export async function handleOAuthCallback(): Promise<{
  success: boolean;
  returnTo?: string;
  error?: string;
}> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");

  if (error) {
    return { success: false, error: `OAuth kļūda: ${error}` };
  }

  if (!code) {
    return { success: false, error: "Nav saņemts autorizācijas kods" };
  }

  const codeVerifier = sessionStorage.getItem("oauth_code_verifier");
  if (!codeVerifier) {
    return { success: false, error: "Nav atrasts code_verifier" };
  }

  const returnTo = sessionStorage.getItem("oauth_return_to") || "/";

  // Notīra sessionStorage
  sessionStorage.removeItem("oauth_code_verifier");
  sessionStorage.removeItem("oauth_return_to");

  try {
    const response = await fetch(`${CONFIG.WORKER_URL}/api/auth/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        provider: "google",
        redirect_uri: CONFIG.getRedirectUri(),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: data.error?.message || "Autentifikācija neizdevās",
      };
    }

    const data = (await response.json()) as {
      access_token: string;
      user: User;
      limits: Limits;
    };

    const authData: AuthData = {
      token: data.access_token,
      provider: "google",
      user: data.user,
    };

    setAuth(authData);
    $limits.set(data.limits);

    return { success: true, returnTo };
  } catch (err) {
    return {
      success: false,
      error: `Tīkla kļūda: ${err instanceof Error ? err.message : "Nezināma kļūda"}`,
    };
  }
}

// Verificē esošo tokenu
export async function verifyToken(): Promise<boolean> {
  // Mock mode — vienmēr derīgs
  if (CONFIG.MOCK_MODE) {
    return true;
  }

  const auth = $auth.get();
  if (!auth) return false;

  try {
    const response = await fetch(`${CONFIG.WORKER_URL}/api/auth/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "X-Auth-Provider": auth.provider,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      clearAuth();
      return false;
    }

    const data = (await response.json()) as { user: User; limits: Limits };
    $limits.set(data.limits);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

// Iziet no sistēmas
export function logout(): void {
  clearAuth();
  window.location.href = "/";
}

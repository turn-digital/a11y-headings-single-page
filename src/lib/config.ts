// config.ts — konfigurācijas konstantes

export const CONFIG = {
  // MOCK_MODE: true = izmanto viltotus datus bez autentifikācijas
  // Nomainiet uz false, kad Google OAuth ir konfigurēts
  MOCK_MODE: false,

  WORKER_URL: "https://a11y-test-worker.peteris-6aa.workers.dev",
  GOOGLE_CLIENT_ID:
    "268844119090-fde6bu1ldovlmt7ap41dal4pq0f95d8a.apps.googleusercontent.com",
  // Redirect URI tiks noteikts dinamiski, pamatojoties uz pašreizējo URL
  getRedirectUri: () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/callback`;
  },
};

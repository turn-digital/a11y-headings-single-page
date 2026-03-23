// DashboardApp.tsx — galvenā dashboard aplikācija ar Carbon komponentēm

import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Loading } from "@carbon/react";
import {
  $auth,
  $isAuthLoading,
  initAuthFromStorage,
} from "../../lib/store";
import { initiateGoogleLogin, verifyToken } from "../../lib/auth";
import { fetchCheckById } from "../../lib/api";
import type { CheckDetail, CheckResult } from "../../lib/types";

import Header from "./Header";
import LoginScreen from "./LoginScreen";
import HistorySidebar from "./HistorySidebar";
import WelcomeScreen from "./WelcomeScreen";
import CheckDetailView from "./CheckDetailView";

export default function DashboardApp() {
  const auth = useStore($auth);
  const isAuthLoading = useStore($isAuthLoading);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState<number | null>(null);
  const [currentCheck, setCurrentCheck] = useState<CheckDetail | null>(null);
  const [currentResult, setCurrentResult] = useState<CheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  // Initialize auth on mount
  useEffect(() => {
    initAuthFromStorage();
  }, []);

  // Verify token when auth changes
  useEffect(() => {
    async function verify() {
      if (auth && !isAuthLoading) {
        setIsVerifying(true);
        await verifyToken();
        setIsVerifying(false);
      }
    }
    verify();
  }, [auth, isAuthLoading]);

  // Parse URL for check ID on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let checkId = params.get("id");
    if (!checkId && window.location.hash) {
      checkId = window.location.hash.slice(1);
    }
    if (checkId && !isNaN(parseInt(checkId))) {
      setCurrentCheckId(parseInt(checkId));
    }
  }, []);

  // Load check when ID changes
  useEffect(() => {
    if (currentCheckId && auth) {
      loadCheck(currentCheckId);
    }
  }, [currentCheckId, auth]);

  // Check if mobile
  function isMobile(): boolean {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
  }

  async function loadCheck(id: number) {
    setCheckLoading(true);
    setCheckError(null);
    try {
      const check = await fetchCheckById(id);
      const result = JSON.parse(check.result_json) as CheckResult;
      setCurrentCheck(check);
      setCurrentResult(result);
    } catch (err) {
      setCheckError(err instanceof Error ? err.message : "Kļūda");
      setCurrentCheck(null);
      setCurrentResult(null);
    } finally {
      setCheckLoading(false);
    }
  }

  function handleCheckSelect(id: number) {
    if (id !== currentCheckId) {
      setCurrentCheckId(id);
      window.history.pushState({}, "", `${basePath}/?id=${id}`);
      if (isMobile()) {
        setSidebarOpen(false);
      }
    }
  }

  function handleLogin() {
    initiateGoogleLogin(`${basePath}/`);
  }

  function handleShareUpdate(shareToken: string | null) {
    if (currentCheck) {
      setCurrentCheck({ ...currentCheck, share_token: shareToken });
    }
  }

  // Loading state
  if (isAuthLoading || isVerifying) {
    return (
      <>
        <Header />
        <div className="loading-container">
          <Loading description="Ielādē..." withOverlay={false} />
        </div>
      </>
    );
  }

  // Not authenticated
  if (!auth) {
    return (
      <>
        <Header />
        <LoginScreen onLogin={handleLogin} />
      </>
    );
  }

  // Authenticated - show dashboard
  return (
    <>
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="check-page-layout">
        <HistorySidebar
          isOpen={sidebarOpen}
          activeCheckId={currentCheckId}
          onCheckSelect={handleCheckSelect}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="check-main">
          {checkLoading ? (
            <div className="loading-container">
              <Loading description="Ielādē..." withOverlay={false} />
            </div>
          ) : checkError ? (
            <div className="error-container">
              <p>{checkError}</p>
            </div>
          ) : currentCheck && currentResult ? (
            <CheckDetailView
              check={currentCheck}
              result={currentResult}
              onShareUpdate={handleShareUpdate}
            />
          ) : (
            <WelcomeScreen isMobile={isMobile()} />
          )}
        </main>
      </div>
    </>
  );
}

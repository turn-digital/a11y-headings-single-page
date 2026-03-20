// Header.tsx — galvenā navigācija

import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  Header as CarbonHeader,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
} from "@carbon/react";
import { Logout, UserAvatar, Menu, Close } from "@carbon/icons-react";
import { $auth, $isAuthLoading, initAuthFromStorage } from "../../lib/store";
import { logout, verifyToken } from "../../lib/auth";

export default function Header() {
  const auth = useStore($auth);
  const isLoading = useStore($isAuthLoading);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  useEffect(() => {
    initAuthFromStorage();
  }, []);

  useEffect(() => {
    if (auth && !isLoading) {
      verifyToken();
    }
  }, [auth, isLoading]);

  // Listen for sidebar close events (when check is selected on mobile)
  useEffect(() => {
    const handleCloseSidebar = () => setSidebarOpen(false);
    window.addEventListener("closeSidebar", handleCloseSidebar);
    return () => window.removeEventListener("closeSidebar", handleCloseSidebar);
  }, []);

  // Dispatch sidebar state to the page
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", { detail: { open: sidebarOpen } })
    );

    // Handle body scroll lock
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [sidebarOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <CarbonHeader aria-label="A11y Headings">
      <SkipToContent />

      {/* Hamburger menu - only visible on mobile/tablet when authenticated */}
      {auth && (
        <HeaderGlobalAction
          aria-label={sidebarOpen ? "Aizvērt izvēlni" : "Atvērt vēsturi"}
          aria-expanded={sidebarOpen}
          aria-controls="history-sidebar"
          onClick={toggleSidebar}
          className="menu-toggle"
        >
          {sidebarOpen ? <Close size={20} /> : <Menu size={20} />}
        </HeaderGlobalAction>
      )}

      <HeaderName href={`${basePath}/`} prefix="">
        A11y Headings
      </HeaderName>

      <HeaderGlobalBar>
        {auth && (
          <>
            <span
              className="user-info"
              title={auth.user.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                padding: "0 0.75rem",
              }}
            >
              {auth.user.picture && !imgError ? (
                <img
                  src={auth.user.picture}
                  alt={auth.user.name}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <UserAvatar size={20} />
              )}
            </span>
            <HeaderGlobalAction
              aria-label="Iziet"
              tooltipAlignment="end"
              onClick={logout}
            >
              <Logout size={20} />
            </HeaderGlobalAction>
          </>
        )}
      </HeaderGlobalBar>
    </CarbonHeader>
  );
}

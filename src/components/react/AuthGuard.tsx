// AuthGuard.tsx — aizsargā lapas, kam nepieciešama autorizācija

import { useEffect, type ReactNode } from "react";
import { useStore } from "@nanostores/react";
import { InlineLoading } from "@carbon/react";
import { $auth, $isAuthLoading, initAuthFromStorage } from "../../lib/store";
import { verifyToken, initiateGoogleLogin } from "../../lib/auth";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const auth = useStore($auth);
  const isLoading = useStore($isAuthLoading);

  useEffect(() => {
    initAuthFromStorage();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && auth) {
        const valid = await verifyToken();
        if (!valid) {
          // Token nederīgs, pāradresē uz sākumlapu
          const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
          window.location.href = `${basePath}/`;
        }
      } else if (!isLoading && !auth) {
        // Nav auth, pāradresē uz pieteikšanos ar return URL
        initiateGoogleLogin(window.location.pathname);
      }
    };

    checkAuth();
  }, [auth, isLoading]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <InlineLoading description="Pārbauda autorizāciju..." status="active" />
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="loading-container">
        <InlineLoading description="Pāradresē uz pieteikšanos..." status="active" />
      </div>
    );
  }

  return <>{children}</>;
}

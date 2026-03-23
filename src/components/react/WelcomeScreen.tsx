// WelcomeScreen.tsx — sveiciena ekrāns ar Carbon Tile

import { Tile } from "@carbon/react";
import { useStore } from "@nanostores/react";
import { $auth, $limits } from "../../lib/store";
import { formatDate } from "../../lib/api";

interface WelcomeScreenProps {
  isMobile: boolean;
}

export default function WelcomeScreen({ isMobile }: WelcomeScreenProps) {
  const auth = useStore($auth);
  const limits = useStore($limits);

  const instructionText = isMobile
    ? "Nospiediet izvēlnes pogu augšā, lai skatītu pārbaužu vēsturi."
    : "Izvēlieties pārbaudi no saraksta kreisajā pusē, lai skatītu detaļas.";

  return (
    <div className="welcome-screen">
      <h1>Sveiki, {auth?.user.name || "lietotāj"}!</h1>
      <p className="welcome-instruction">{instructionText}</p>

      {limits && (
        <>
          <div className="stats-grid">
            <Tile className="stat-card">
              <div className="stat-value">{limits.used}</div>
              <div className="stat-label">Izmantotas</div>
            </Tile>
            <Tile className="stat-card">
              <div className="stat-value">{limits.remaining}</div>
              <div className="stat-label">Atlikušas</div>
            </Tile>
            <Tile className="stat-card">
              <div className="stat-value">{limits.limit}</div>
              <div className="stat-label">Limits</div>
            </Tile>
          </div>
          <p className="reset-info">
            Limits atjaunojas: {formatDate(limits.resets_at)}
          </p>
        </>
      )}
    </div>
  );
}

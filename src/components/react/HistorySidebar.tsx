// HistorySidebar.tsx — vēstures sānjosla ar Carbon komponentēm

import { useEffect, useState } from "react";
import {
  SkeletonText,
  IconButton,
  Tag,
} from "@carbon/react";
import { Close, CheckmarkFilled, ErrorFilled } from "@carbon/icons-react";
import type { HistoryCheck } from "../../lib/types";
import { fetchHistory, formatRelativeTime, truncateUrl } from "../../lib/api";

interface HistorySidebarProps {
  isOpen: boolean;
  activeCheckId: number | null;
  onCheckSelect: (id: number) => void;
  onClose: () => void;
}

export default function HistorySidebar({
  isOpen,
  activeCheckId,
  onCheckSelect,
  onClose,
}: HistorySidebarProps) {
  const [checks, setChecks] = useState<HistoryCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoading(true);
      const data = await fetchHistory(50, 0);
      setChecks(data.checks);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nezināma kļūda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`history-sidebar ${isOpen ? "open" : ""}`}
        id="history-sidebar"
        aria-label="Pārbaužu vēsture"
      >
        <div className="sidebar-header">
          <h2>Vēsture</h2>
          <IconButton
            kind="ghost"
            size="sm"
            label="Aizvērt izvēlni"
            onClick={onClose}
            className="close-sidebar-btn"
          >
            <Close size={20} />
          </IconButton>
        </div>

        <div className="history-list" role="list">
          {loading ? (
            <div className="history-loading">
              <SkeletonText paragraph lineCount={3} />
              <SkeletonText paragraph lineCount={3} />
              <SkeletonText paragraph lineCount={3} />
            </div>
          ) : error ? (
            <p className="history-error">{error}</p>
          ) : checks.length === 0 ? (
            <p className="history-empty">Nav pārbaužu.</p>
          ) : (
            checks.map((check) => (
              <button
                key={check.id}
                type="button"
                className={`history-item ${check.id === activeCheckId ? "active" : ""}`}
                onClick={() => onCheckSelect(check.id)}
              >
                <span className="status-icon">
                  {check.score === 5 ? (
                    <CheckmarkFilled size={16} className="status-pass" />
                  ) : (
                    <ErrorFilled size={16} className="status-fail" />
                  )}
                </span>
                <div className="item-content">
                  <div className="item-title">
                    {check.page_title || truncateUrl(check.url, 30)}
                  </div>
                  <div className="item-meta">
                    <Tag
                      type={check.score === 5 ? "green" : "red"}
                      size="sm"
                      className="status-tag"
                    >
                      {check.score === 5 ? "OK" : `${check.issues_count} probl.`}
                    </Tag>
                    <span className="item-time">
                      {formatRelativeTime(check.created_at)}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

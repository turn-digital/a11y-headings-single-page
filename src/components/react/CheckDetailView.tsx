// CheckDetailView.tsx — pārbaudes detaļas ar Carbon komponentēm

import { useState } from "react";
import {
  Button,
  Tag,
  Accordion,
  AccordionItem,
  InlineLoading,
  Link,
  CodeSnippet,
  Layer,
  Modal,
} from "@carbon/react";
import {
  Copy,
  Share,
  TrashCan,
  CheckmarkFilled,
  ErrorFilled,
  Launch,
} from "@carbon/icons-react";
import type { CheckDetail, CheckResult, CheckItem, Finding } from "../../lib/types";
import { CHECK_LABELS } from "../../lib/types";
import { formatDate, truncateUrl, createShareLink, removeShareLink } from "../../lib/api";

interface CheckDetailViewProps {
  check: CheckDetail;
  result: CheckResult;
  onShareUpdate: (shareToken: string | null) => void;
}

export default function CheckDetailView({
  check,
  result,
  onShareUpdate,
}: CheckDetailViewProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "copied">("idle");
  const [unshareStatus, setUnshareStatus] = useState<"idle" | "loading">("idle");
  const [showUnshareModal, setShowUnshareModal] = useState(false);
  const [unshareError, setUnshareError] = useState<string | null>(null);

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  async function handleCopy() {
    const text = formatResultForCopy(result);
    await navigator.clipboard.writeText(text);
    setCopyStatus("copied");
    setTimeout(() => setCopyStatus("idle"), 2000);
  }

  async function handleShare() {
    if (check.share_token) {
      // Already shared - copy URL
      const url = `${window.location.origin}${basePath}/share?token=${check.share_token}`;
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } else {
      // Create share link
      setShareStatus("loading");
      try {
        const shareResult = await createShareLink(check.id);
        onShareUpdate(shareResult.share_token);
        setShareStatus("idle");
      } catch {
        setShareStatus("idle");
      }
    }
  }

  function handleUnshareClick() {
    setUnshareError(null);
    setShowUnshareModal(true);
  }

  async function handleUnshareConfirm() {
    setUnshareStatus("loading");
    setUnshareError(null);
    try {
      await removeShareLink(check.id);
      setShowUnshareModal(false);
      onShareUpdate(null);
    } catch (err) {
      setUnshareError(err instanceof Error ? err.message : "Neizdevās atcelt kopīgošanu");
    } finally {
      setUnshareStatus("idle");
    }
  }

  function formatResultForCopy(result: CheckResult): string {
    const lines: string[] = [];
    lines.push(`WCAG: ${result.compliant ? "Atbilst" : "Neatbilst"}`);
    lines.push("");
    for (const checkItem of result.checks) {
      const icon = checkItem.status === "pass" ? "✅" : "❌";
      lines.push(`${icon} ${CHECK_LABELS[checkItem.id] || checkItem.id}`);
      for (const f of checkItem.findings) {
        lines.push(`  - ${f.element}: ${f.current} → ${f.expected}`);
      }
    }
    if (result.summary) {
      lines.push("");
      lines.push(result.summary);
    }
    return lines.join("\n");
  }

  const shareUrl = check.share_token
    ? `${window.location.origin}${basePath}/share?token=${check.share_token}`
    : "";

  return (
    <div className="check-detail">
      {/* Header */}
      <div className="check-detail-header">
        <div className="check-detail-info">
          <h1>{check.page_title || "Bez nosaukuma"}</h1>
          <Link
            href={check.url}
            target="_blank"
            rel="noopener noreferrer"
            renderIcon={Launch}
            className="check-url"
          >
            {truncateUrl(check.url, 60)}
          </Link>
          <div className="check-meta">{formatDate(check.created_at)}</div>
        </div>

        <div className="check-detail-actions">
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={Copy}
            onClick={handleCopy}
          >
            {copyStatus === "copied" ? "Nokopēts!" : "Kopēt"}
          </Button>
          <Button
            kind={check.share_token ? "secondary" : "primary"}
            size="sm"
            renderIcon={shareStatus === "loading" ? undefined : Share}
            onClick={handleShare}
            disabled={shareStatus === "loading"}
          >
            {shareStatus === "loading" ? (
              <InlineLoading description="Izveido..." />
            ) : shareStatus === "copied" ? (
              "Saite nokopēta!"
            ) : check.share_token ? (
              "Kopīgots"
            ) : (
              "Kopīgot"
            )}
          </Button>
          {check.share_token && (
            <Button
              kind="danger--tertiary"
              size="sm"
              renderIcon={TrashCan}
              onClick={handleUnshareClick}
            >
              Atcelt
            </Button>
          )}
        </div>
      </div>

      {/* Share URL */}
      {check.share_token && (
        <Layer className="share-url-container">
          <Tag type="green" size="sm">Kopīgots</Tag>
          <Link
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="share-url-link"
          >
            {shareUrl}
          </Link>
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Copy}
            hasIconOnly
            iconDescription="Kopēt saiti"
            tooltipPosition="bottom"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setShareStatus("copied");
              setTimeout(() => setShareStatus("idle"), 2000);
            }}
            className="share-url-copy"
          >
            {shareStatus === "copied" ? "Nokopēts!" : ""}
          </Button>
          {shareStatus === "copied" && (
            <Tag type="green" size="sm" className="copied-tag">Nokopēts!</Tag>
          )}
        </Layer>
      )}

      {/* Compliance Badge */}
      <Tag
        type={result.compliant ? "green" : "red"}
        size="lg"
        className="compliance-badge"
      >
        {result.compliant ? (
          <>
            <CheckmarkFilled size={16} /> Atbilst WCAG 2.4.6
          </>
        ) : (
          <>
            <ErrorFilled size={16} /> Neatbilst WCAG 2.4.6
          </>
        )}
      </Tag>

      {/* Summary */}
      {result.summary && (
        <div className="summary-box">{result.summary}</div>
      )}

      {/* Checks */}
      <h2>Pārbaudes</h2>
      <Accordion>
        {result.checks.map((checkItem: CheckItem) => (
          <AccordionItem
            key={checkItem.id}
            title={
              <span className="check-item-title">
                {checkItem.status === "pass" ? (
                  <CheckmarkFilled size={16} className="status-pass" />
                ) : (
                  <ErrorFilled size={16} className="status-fail" />
                )}
                {CHECK_LABELS[checkItem.id] || checkItem.id}
              </span>
            }
            open={checkItem.status === "fail"}
          >
            {checkItem.findings.length === 0 ? (
              <p className="no-issues">Nav problēmu.</p>
            ) : (
              <div className="findings-cards">
                {checkItem.findings.map((f: Finding, idx: number) => (
                  <div key={idx} className="finding-card">
                    <div className="finding-card-header">
                      <ErrorFilled size={16} className="status-fail" />
                      <span className="finding-element">{f.element}</span>
                    </div>
                    <div className="finding-card-body">
                      <div className="finding-row">
                        <span className="finding-label">Pašreizējais:</span>
                        <span className="finding-value">{f.current}</span>
                      </div>
                      <div className="finding-row">
                        <span className="finding-label">Gaidāmais:</span>
                        <span className="finding-value finding-expected">{f.expected}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionItem>
        ))}
      </Accordion>

      {/* Outline Comparison */}
      {result.current_outline?.length > 0 && (
        <div className="outline-section">
          <h2>Struktūras salīdzinājums</h2>
          {result.suggested_outline?.length > 0 ? (
            <div className="outline-comparison">
              <div className="outline-col outline-current">
                <h3>Pašreizējā struktūra</h3>
                <CodeSnippet type="multi" hideCopyButton className="outline-code">
                  {result.current_outline.join("\n")}
                </CodeSnippet>
              </div>
              <div className="outline-col outline-suggested">
                <h3>Ieteicamā struktūra</h3>
                <CodeSnippet type="multi" hideCopyButton className="outline-code outline-good">
                  {result.suggested_outline.join("\n")}
                </CodeSnippet>
              </div>
            </div>
          ) : (
            <div className="outline-success">
              <Tag type="green" size="md">
                <CheckmarkFilled size={16} /> Struktūra ir laba
              </Tag>
              <CodeSnippet type="multi" hideCopyButton className="outline-code">
                {result.current_outline.join("\n")}
              </CodeSnippet>
            </div>
          )}
        </div>
      )}

      {/* Unshare Confirmation Modal */}
      <Modal
        open={showUnshareModal}
        onRequestClose={() => setShowUnshareModal(false)}
        onRequestSubmit={handleUnshareConfirm}
        danger
        modalHeading="Atcelt kopīgošanu"
        primaryButtonText={unshareStatus === "loading" ? "Atceļ..." : "Atcelt kopīgošanu"}
        secondaryButtonText="Aizvērt"
        primaryButtonDisabled={unshareStatus === "loading"}
      >
        <p style={{ marginBottom: "1rem" }}>
          Vai tiešām vēlaties atcelt kopīgošanu? Kopīgotā saite vairs nedarbosies un citi lietotāji nevarēs skatīt šo pārbaudi.
        </p>
        {unshareError && (
          <p style={{ color: "#da1e28" }}>{unshareError}</p>
        )}
      </Modal>
    </div>
  );
}

// SharePage.tsx — kopīgotās pārbaudes lapa ar Carbon komponentēm

import { useEffect, useState } from "react";
import {
  Header,
  HeaderName,
  Tag,
  Button,
  Loading,
  Accordion,
  AccordionItem,
  Link,
  CodeSnippet,
} from "@carbon/react";
import {
  CheckmarkFilled,
  ErrorFilled,
  Launch,
  Download,
} from "@carbon/icons-react";
import { CONFIG } from "../../lib/config";
import { CHECK_LABELS } from "../../lib/types";

interface ShareData {
  url: string;
  page_title: string;
  created_at: string;
  compliant: boolean;
  summary: string;
  checks: Array<{
    id: string;
    status: "pass" | "fail";
    findings: Array<{
      element: string;
      current: string;
      expected: string;
    }>;
  }>;
  current_outline: string[];
  suggested_outline: string[];
}

export default function SharePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ShareData | null>(null);

  const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  useEffect(() => {
    loadSharedCheck();
  }, []);

  function getToken(): string | null {
    const params = new URLSearchParams(window.location.search);
    if (params.get("token")) return params.get("token");
    if (window.location.hash) return window.location.hash.slice(1);
    const pathMatch = window.location.pathname.match(/\/share\/([A-Za-z0-9]+)/);
    if (pathMatch) return pathMatch[1];
    return null;
  }

  async function loadSharedCheck() {
    const token = getToken();

    if (!token) {
      setError("Nav norādīts pārbaudes tokens.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${CONFIG.WORKER_URL}/api/share/${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Pārbaude nav atrasta");
      }

      const shareData = await response.json();
      setData(shareData);

      // Track with Plausible
      if (typeof (window as any).plausible !== "undefined") {
        const checkedDomain = new URL(shareData.url).hostname;
        (window as any).plausible("pageview", {
          props: {
            share_token: token,
            checked_domain: checkedDomain,
            is_compliant: String(shareData.compliant),
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nezināma kļūda");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("lv-LV", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleCtaClick(button: string) {
    const token = getToken();
    if (typeof (window as any).plausible !== "undefined") {
      (window as any).plausible("CTA Click", {
        props: { button, share_token: token },
      });
    }
  }

  return (
    <div className="share-page">
      <Header aria-label="A11y Headings Checker">
        <HeaderName href={`${basePath}/`} prefix="">
          A11y Headings Checker
        </HeaderName>
        <Tag type="gray" className="shared-badge">
          Kopīgota pārbaude
        </Tag>
      </Header>

      <main className="share-main">
        {loading ? (
          <div className="share-loading">
            <Loading description="Ielādē pārbaudi..." withOverlay={false} />
          </div>
        ) : error ? (
          <div className="share-error">
            <h1>Pārbaude nav atrasta</h1>
            <p>{error}</p>
            <p className="share-error-hint">
              Ja iepriekš varējāt skatīt šo pārbaudi, iespējams, īpašnieks ir atcēlis kopīgošanu un padarījis to privātu.
            </p>
            <Button kind="primary" href={`${basePath}/`}>
              Doties uz sākumlapu
            </Button>
          </div>
        ) : data ? (
          <div className="share-content">
            {/* Header */}
            <div className="share-check-header">
              <h1>{data.page_title || "Bez nosaukuma"}</h1>
              <Link
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                renderIcon={Launch}
                className="share-check-url"
              >
                {data.url}
              </Link>
              <div className="share-check-meta">
                Pārbaudīts: {formatDate(data.created_at)}
              </div>
            </div>

            {/* Compliance Badge */}
            <Tag
              type={data.compliant ? "green" : "red"}
              size="lg"
              className="compliance-badge"
            >
              {data.compliant ? (
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
            {data.summary && (
              <div className="summary-box">{data.summary}</div>
            )}

            {/* Checks */}
            <h2>Pārbaudes</h2>
            <Accordion>
              {data.checks.map((checkItem) => (
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
                      {checkItem.findings.map((f, idx) => (
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
            {data.current_outline?.length > 0 && (
              <div className="outline-section">
                <h2>Struktūras salīdzinājums</h2>
                {data.suggested_outline?.length > 0 ? (
                  <div className="outline-comparison">
                    <div className="outline-col outline-current">
                      <h3>Pašreizējā struktūra</h3>
                      <CodeSnippet
                        type="multi"
                        hideCopyButton
                        className="outline-code"
                      >
                        {data.current_outline.join("\n")}
                      </CodeSnippet>
                    </div>
                    <div className="outline-col outline-suggested">
                      <h3>Ieteicamā struktūra</h3>
                      <CodeSnippet
                        type="multi"
                        hideCopyButton
                        className="outline-code outline-good"
                      >
                        {data.suggested_outline.join("\n")}
                      </CodeSnippet>
                    </div>
                  </div>
                ) : (
                  <div className="outline-success">
                    <Tag type="green" size="md">
                      <CheckmarkFilled size={16} /> Struktūra ir laba
                    </Tag>
                    <CodeSnippet
                      type="multi"
                      hideCopyButton
                      className="outline-code"
                    >
                      {data.current_outline.join("\n")}
                    </CodeSnippet>
                  </div>
                )}
              </div>
            )}

            {/* CTA Section */}
            <div className="cta-section">
              <h2>Vēlaties pārbaudīt savu vietni?</h2>
              <p>
                Instalējiet A11y Headings Checker pārlūkprogrammas paplašinājumu
                un pārbaudiet jebkuras lapas virsrakstu struktūru.
              </p>
              <div className="cta-buttons">
                <Button
                  kind="primary"
                  href="https://chrome.google.com/webstore"
                  target="_blank"
                  rel="noopener noreferrer"
                  renderIcon={Download}
                  onClick={() => handleCtaClick("install_extension")}
                >
                  Instalēt paplašinājumu
                </Button>
                <Button
                  kind="secondary"
                  href={`${basePath}/`}
                  onClick={() => handleCtaClick("sign_up")}
                >
                  Reģistrēties bez maksas
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="share-footer">
        <p>
          Izveidots ar{" "}
          <Link href={`${basePath}/`}>A11y Headings Checker</Link> — WCAG 2.4.6
          piekļūstamības pārbaudes rīks
        </p>
      </footer>
    </div>
  );
}

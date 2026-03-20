// mock-data.ts — viltoti dati lokālai izstrādei

import type { User, Limits, HistoryCheck, CheckDetail, CheckResult } from "./types";

export const MOCK_USER: User = {
  id: "mock_user_123",
  email: "demo@example.com",
  name: "Demo Lietotājs",
  picture: "https://ui-avatars.com/api/?name=Demo+User&background=0f62fe&color=fff",
};

export const MOCK_LIMITS: Limits = {
  plan: "free",
  used: 7,
  limit: 20,
  remaining: 13,
  resets_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
};

export const MOCK_HISTORY: HistoryCheck[] = [
  {
    id: 1,
    url: "https://example.com/page-1",
    page_title: "Mājas lapa - Example",
    score: 5,
    issues_count: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
  },
  {
    id: 2,
    url: "https://example.com/about",
    page_title: "Par mums - Example",
    score: 1,
    issues_count: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: 3,
    url: "https://example.com/contact",
    page_title: "Kontakti - Example",
    score: 1,
    issues_count: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 4,
    url: "https://example.com/services",
    page_title: "Pakalpojumi - Example",
    score: 5,
    issues_count: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: 5,
    url: "https://example.com/blog/post-1",
    page_title: "Pirmais ieraksts - Example Blog",
    score: 1,
    issues_count: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
  },
];

const MOCK_RESULT_PASS: CheckResult = {
  compliant: true,
  checks: [
    { id: "presence", status: "pass", findings: [] },
    { id: "h1_first", status: "pass", findings: [] },
    { id: "hierarchy", status: "pass", findings: [] },
    { id: "empty_headings", status: "pass", findings: [] },
  ],
  current_outline: ["H1: Mājas lapa", "  H2: Par mums", "  H2: Pakalpojumi", "    H3: Web izstrāde", "    H3: Dizains"],
  suggested_outline: [],
  summary: "Virsrakstu struktūra ir labi organizēta un atbilst WCAG 2.4.6 prasībām.",
};

const MOCK_RESULT_FAIL: CheckResult = {
  compliant: false,
  checks: [
    { id: "presence", status: "pass", findings: [] },
    { id: "h1_first", status: "pass", findings: [] },
    {
      id: "hierarchy",
      status: "fail",
      findings: [
        {
          element: "H4: Kontaktforma",
          current: "H4 seko pēc H2 (izlaists H3)",
          expected: "H3 vai H2",
        },
      ],
    },
    {
      id: "empty_headings",
      status: "fail",
      findings: [
        {
          element: "<h3></h3>",
          current: "Tukšs virsraksts",
          expected: "Virsrakstam jābūt ar saturu",
        },
      ],
    },
    {
      id: "semantic_quality",
      status: "fail",
      findings: [
        {
          element: "Klikšķini šeit",
          current: "Nav aprakstošs teksts",
          expected: "Skaidrs, aprakstošs virsraksta teksts",
        },
      ],
    },
  ],
  current_outline: ["H1: Par mums", "  H2: Mūsu komanda", "    H4: Kontaktforma", "  H2: Vēsture"],
  suggested_outline: ["H1: Par mums", "  H2: Mūsu komanda", "    H3: Kontaktforma", "  H2: Vēsture"],
  summary: "Konstatētas vairākas strukturālas problēmas: izlaisti hierarhijas līmeņi un tukši virsraksti. Ieteicams pārskatīt virsrakstu struktūru.",
};

export function getMockCheckDetail(id: number): CheckDetail {
  const historyItem = MOCK_HISTORY.find((h) => h.id === id) || MOCK_HISTORY[0];
  const result = historyItem.score === 5 ? MOCK_RESULT_PASS : MOCK_RESULT_FAIL;

  return {
    id: historyItem.id,
    user_id: MOCK_USER.id,
    url: historyItem.url,
    page_title: historyItem.page_title,
    headings_markdown: "# " + historyItem.page_title + "\n\n## Saturs\n\nTeksts...",
    heading_count: 5,
    score: historyItem.score,
    issues_count: historyItem.issues_count,
    result_json: JSON.stringify(result),
    created_at: historyItem.created_at,
  };
}

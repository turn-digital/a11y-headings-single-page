// types.ts — TypeScript tipu definīcijas

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Limits {
  plan?: string;
  used: number;
  limit: number;
  remaining: number;
  resets_at: string;
}

export interface AuthData {
  token: string;
  provider: "google";
  user: User;
}

export interface Finding {
  element: string;
  current: string;
  expected: string;
  font_info?: string;
}

export interface CheckItem {
  id: string;
  status: "pass" | "fail";
  findings: Finding[];
}

export interface CheckResult {
  compliant: boolean;
  checks: CheckItem[];
  current_outline: string[];
  suggested_outline: string[];
  summary: string;
}

export interface HistoryCheck {
  id: number;
  url: string;
  page_title: string;
  score: number;
  issues_count: number;
  created_at: string;
}

export interface HistoryResponse {
  checks: HistoryCheck[];
  total: number;
  limit: number;
  offset: number;
}

export interface CheckDetail {
  id: number;
  user_id: string;
  url: string;
  page_title: string;
  headings_markdown: string;
  heading_count: number;
  score: number;
  issues_count: number;
  result_json: string;
  share_token: string | null;
  shared_at: string | null;
  created_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Čeku nosaukumi latviski
export const CHECK_LABELS: Record<string, string> = {
  presence: "Virsrakstu esamība",
  h1_first: "H1 virsraksts",
  hierarchy: "Hierarhijas secība",
  empty_headings: "Tukši virsraksti",
  visual_headings: "Vizuālie virsraksti",
  content_match: "Satura atbilstība",
  logical_structure: "Loģiskā struktūra",
  semantic_quality: "Semantiskā kvalitāte",
  visual_match: "Vizuālā atbilstība",
  language_quality: "Valodas kvalitāte",
};

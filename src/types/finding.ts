import type { Severity } from "@/lib/severity";

export type Finding = {
  id: string;
  severity: Severity;
  pattern_type: string;
  matched_value: string;
  risk_score: number;
  source: string | null;
  domain: string | null;
  context: string | null;
  status: string;
  created_at: string;
};

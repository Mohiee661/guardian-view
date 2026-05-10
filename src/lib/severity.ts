export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export const severityLabel = (s: Severity) =>
  s.charAt(0).toUpperCase() + s.slice(1);

export const severityRank: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Muted, restrained badge styles — no neon
export const severityClasses: Record<Severity, string> = {
  critical:
    "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
  high: "bg-severity-high/10 text-severity-high border-severity-high/30",
  medium: "bg-severity-medium/10 text-severity-medium border-severity-medium/30",
  low: "bg-severity-low/10 text-severity-low border-severity-low/30",
};

export const severityDot: Record<Severity, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
};

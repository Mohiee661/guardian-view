import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Search as SearchIcon, ShieldAlert, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useFindings } from "@/hooks/use-findings";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, Cell,
} from "recharts";
import { SEVERITIES, severityRank, type Severity } from "@/lib/severity";

const severityHsl: Record<Severity, string> = {
  critical: "hsl(var(--severity-critical))",
  high: "hsl(var(--severity-high))",
  medium: "hsl(var(--severity-medium))",
  low: "hsl(var(--severity-low))",
};

export default function DomainLookup() {
  const { data, loading } = useFindings();
  const findings = data ?? [];

  const [input, setInput] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(["acme.io"]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = input.trim().toLowerCase();
    if (!v) return;
    setQuery(v);
    setRecent((r) => [v, ...r.filter((x) => x !== v)].slice(0, 6));
  };

  const matches = useMemo(() => {
    if (!query) return [];
    return findings.filter(
      (f) =>
        (f.domain ?? "").toLowerCase().includes(query) ||
        f.matched_value.toLowerCase().includes(query),
    );
  }, [findings, query]);

  const summary = useMemo(() => {
    if (matches.length === 0) return null;
    const highest = matches.reduce((acc, f) =>
      severityRank[f.severity] > severityRank[acc.severity] ? f : acc,
    ).severity;
    const avg = Math.round(
      matches.reduce((s, f) => s + f.risk_score, 0) / matches.length,
    );
    return { total: matches.length, highest, avg };
  }, [matches]);

  const timeline = useMemo(() => {
    const days: Record<string, number> = {};
    matches.forEach((f) => {
      const k = new Date(f.created_at).toLocaleDateString(undefined, {
        month: "short", day: "numeric",
      });
      days[k] = (days[k] || 0) + 1;
    });
    return Object.entries(days).reverse().map(([day, count]) => ({ day, count }));
  }, [matches]);

  const dist = useMemo(
    () =>
      SEVERITIES.map((s) => ({
        name: s,
        value: matches.filter((m) => m.severity === s).length,
        color: severityHsl[s],
      })),
    [matches],
  );

  const hasCritical = matches.some((m) => m.severity === "critical");

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-8 shadow-soft">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold tracking-tight">Domain & indicator lookup</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Search threat intelligence across all ingested findings.
          </p>
          <form onSubmit={submit} className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="acme.io, AKIA…, sk_live_…"
                className="h-10 pl-9 text-sm"
              />
            </div>
            <Button type="submit" className="h-10 px-5 text-xs">Search</Button>
          </form>
          {recent.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Recent:</span>
              {recent.map((r) => (
                <button
                  key={r}
                  onClick={() => { setInput(r); setQuery(r); }}
                  className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono hover:bg-muted"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {query && !loading && (
        <>
          {hasCritical && (
            <div className="flex items-start gap-2 rounded-lg border border-severity-critical/30 bg-severity-critical/10 p-3 text-xs text-severity-critical">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Critical findings detected for <span className="font-mono">{query}</span>. Triage immediately.
              </span>
            </div>
          )}
          {matches.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-success/30 bg-success/10 p-3 text-xs text-success">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                No findings match <span className="font-mono">{query}</span>. This indicator looks clean.
              </span>
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricCard label="Total matches" value={summary.total} />
              <MetricCard
                label="Highest severity"
                value={summary.highest}
                tone={summary.highest === "critical" ? "critical" : summary.highest === "high" ? "warning" : "default"}
              />
              <MetricCard label="Avg. risk score" value={summary.avg} />
              <MetricCard
                label="Most recent"
                value={formatDistanceToNow(new Date(matches[0].created_at), { addSuffix: true })}
              />
            </div>
          )}

          {matches.length > 0 && (
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4 shadow-soft lg:col-span-2">
                <h3 className="text-sm font-medium">Findings timeline</h3>
                <div className="mt-3 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline}>
                      <defs>
                        <linearGradient id="lookupGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--severity-medium))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--severity-medium))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={28} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--severity-medium))" strokeWidth={1.5} fill="url(#lookupGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
                <h3 className="text-sm font-medium">By severity</h3>
                <div className="mt-3 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dist}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={24} />
                      <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
                      <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                        {dist.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {matches.length > 0 && (
            <div className="rounded-lg border border-border bg-card shadow-soft">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-medium">Matching findings</h3>
              </div>
              <div className="divide-y divide-border">
                {matches.slice(0, 10).map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-muted/40">
                    <SeverityBadge severity={f.severity} />
                    <span className="font-mono text-[11px] text-muted-foreground">{f.pattern_type}</span>
                    <span className="flex-1 truncate font-mono text-[11px]">{f.matched_value}</span>
                    <span className="font-mono tabular-nums">{f.risk_score}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Activity,
  KeyRound,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useMemo } from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { MetricCard } from "@/components/MetricCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useFindings } from "@/hooks/use-findings";
import { Skeleton } from "@/components/ui/skeleton";
import type { Finding } from "@/types/finding";
import { SEVERITIES, type Severity } from "@/lib/severity";

const severityHsl: Record<Severity, string> = {
  critical: "hsl(var(--severity-critical))",
  high: "hsl(var(--severity-high))",
  medium: "hsl(var(--severity-medium))",
  low: "hsl(var(--severity-low))",
};

function buildActivitySeries(findings: Finding[]) {
  const now = new Date();
  const days: { day: string; count: number; date: Date }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
      date: d,
    });
  }
  findings.forEach((f) => {
    const t = new Date(f.created_at).getTime();
    for (let i = 0; i < days.length; i++) {
      const start = days[i].date.getTime();
      const end = start + 24 * 60 * 60 * 1000;
      if (t >= start && t < end) {
        days[i].count++;
        break;
      }
    }
  });
  return days;
}

export default function Dashboard() {
  const { data, loading, error } = useFindings();
  const findings = data ?? [];

  const stats = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      apiKey: findings.filter((f) =>
        /api[_-]?key|token|secret|aws|stripe|openai|google_api/i.test(f.pattern_type),
      ).length,
      today: findings.filter((f) => new Date(f.created_at) >= startOfToday).length,
    };
  }, [findings]);

  const severityDist = useMemo(
    () =>
      SEVERITIES.map((s) => ({
        name: s,
        value: findings.filter((f) => f.severity === s).length,
        color: severityHsl[s],
      })),
    [findings],
  );

  const activity = useMemo(() => buildActivitySeries(findings), [findings]);
  const recent = findings.slice(0, 8);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load findings: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">SOC overview</h2>
          <p className="text-xs text-muted-foreground">
            Live operational view of detected exposures and threat indicators.
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Updated {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Total findings"
          value={stats.total}
          hint="Across all sources"
          icon={Activity}
          loading={loading}
        />
        <MetricCard
          label="Critical threats"
          value={stats.critical}
          hint="Immediate action"
          icon={ShieldAlert}
          loading={loading}
          tone="critical"
        />
        <MetricCard
          label="High severity"
          value={stats.high}
          hint="Review within 24h"
          icon={AlertTriangle}
          loading={loading}
          tone="warning"
        />
        <MetricCard
          label="API key exposures"
          value={stats.apiKey}
          hint="Secrets & tokens"
          icon={KeyRound}
          loading={loading}
          tone="info"
        />
        <MetricCard
          label="Findings today"
          value={stats.today}
          hint="Last 24 hours"
          icon={Sparkles}
          loading={loading}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Threat activity</h3>
              <p className="text-[11px] text-muted-foreground">
                Findings ingested over the last 14 days
              </p>
            </div>
          </div>
          <div className="h-56">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--severity-medium))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--severity-medium))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--severity-medium))"
                    strokeWidth={1.5}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
          <h3 className="text-sm font-medium">Severity distribution</h3>
          <p className="text-[11px] text-muted-foreground">All findings</p>
          <div className="mt-2 h-44">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDist}
                    dataKey="value"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  >
                    {severityDist.map((s) => (
                      <Cell key={s.name} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {severityDist.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 capitalize text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-mono tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h3 className="text-sm font-medium">Recent findings</h3>
            <p className="text-[11px] text-muted-foreground">
              Latest indicators ingested across the platform
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium">Severity</th>
                <th className="px-4 py-2 text-left font-medium">Pattern</th>
                <th className="px-4 py-2 text-left font-medium">Match</th>
                <th className="px-4 py-2 text-left font-medium">Risk</th>
                <th className="px-4 py-2 text-left font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))}
              {!loading && recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No findings yet.
                  </td>
                </tr>
              )}
              {!loading &&
                recent.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-border/50 transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-2.5">
                      <SeverityBadge severity={f.severity} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                      {f.pattern_type}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-foreground/90">
                      <span className="block max-w-[280px] truncate">{f.matched_value}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums">{f.risk_score}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

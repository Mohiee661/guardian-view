import { useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line, ResponsiveContainer, Tooltip,
  XAxis, YAxis, CartesianGrid, Cell,
} from "recharts";
import { useFindings } from "@/hooks/use-findings";
import { Skeleton } from "@/components/ui/skeleton";
import { SEVERITIES, type Severity } from "@/lib/severity";
import type { Finding } from "@/types/finding";

const severityHsl: Record<Severity, string> = {
  critical: "hsl(var(--severity-critical))",
  high: "hsl(var(--severity-high))",
  medium: "hsl(var(--severity-medium))",
  low: "hsl(var(--severity-low))",
};

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 6,
  fontSize: 11,
};

function dailySeries(findings: Finding[], days = 30) {
  const now = new Date();
  const out: { day: string; total: number; api: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const start = d.getTime();
    const end = start + 86400000;
    const inDay = findings.filter((f) => {
      const t = new Date(f.created_at).getTime();
      return t >= start && t < end;
    });
    out.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      total: inDay.length,
      api: inDay.filter((f) =>
        /api[_-]?key|token|secret|aws|stripe|openai|google_api/i.test(f.pattern_type),
      ).length,
    });
  }
  return out;
}

export default function Analytics() {
  const { data, loading } = useFindings();
  const findings = data ?? [];

  const series = useMemo(() => dailySeries(findings, 30), [findings]);

  const topCategories = useMemo(() => {
    const map: Record<string, number> = {};
    findings.forEach((f) => { map[f.pattern_type] = (map[f.pattern_type] || 0) + 1; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [findings]);

  const severitySeries = useMemo(() => {
    const days = 14;
    const now = new Date();
    const out: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 86400000;
      const row: any = {
        day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
      SEVERITIES.forEach((s) => {
        row[s] = findings.filter((f) => {
          const t = new Date(f.created_at).getTime();
          return t >= start && t < end && f.severity === s;
        }).length;
      });
      out.push(row);
    }
    return out;
  }, [findings]);

  if (loading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Findings over time" subtitle="Last 30 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={4} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--foreground))" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="API & secret exposures" subtitle="Last 30 days">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={4} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="api" stroke="hsl(var(--severity-high))" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Top threat categories" subtitle="By volume">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCategories} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={130} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="hsl(var(--severity-medium))" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Severity trends" subtitle="Stacked, last 14 days">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={severitySeries}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} interval={1} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} width={24} />
              <Tooltip contentStyle={tooltipStyle} />
              {SEVERITIES.map((s) => (
                <Bar key={s} dataKey={s} stackId="a" fill={severityHsl[s]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
        <div className="mb-3">
          <h3 className="text-sm font-medium">Severity heatmap</h3>
          <p className="text-[11px] text-muted-foreground">Density per day, by severity</p>
        </div>
        <div className="space-y-2">
          {SEVERITIES.map((s) => {
            const max = Math.max(1, ...severitySeries.map((r: any) => r[s]));
            return (
              <div key={s} className="flex items-center gap-2">
                <span className="w-16 text-[11px] capitalize text-muted-foreground">{s}</span>
                <div className="flex flex-1 gap-0.5">
                  {severitySeries.map((row: any, i: number) => {
                    const intensity = row[s] / max;
                    return (
                      <div
                        key={i}
                        title={`${row.day}: ${row[s]}`}
                        className="h-5 flex-1 rounded-sm border border-border/40"
                        style={{
                          background: row[s] === 0 ? "hsl(var(--muted))" : severityHsl[s],
                          opacity: row[s] === 0 ? 0.4 : 0.25 + 0.75 * intensity,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="mb-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="h-56">{children}</div>
    </div>
  );
}

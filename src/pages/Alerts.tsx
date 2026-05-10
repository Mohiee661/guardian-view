import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useFindings } from "@/hooks/use-findings";
import { Skeleton } from "@/components/ui/skeleton";
import { severityRank } from "@/lib/severity";

const statusClasses: Record<string, string> = {
  open: "bg-severity-critical/10 text-severity-critical border-severity-critical/30",
  triaged: "bg-severity-high/10 text-severity-high border-severity-high/30",
  monitoring: "bg-severity-medium/10 text-severity-medium border-severity-medium/30",
  resolved: "bg-success/10 text-success border-success/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export default function Alerts() {
  const { data, loading } = useFindings();
  const alerts = (data ?? [])
    .filter((f) => severityRank[f.severity] >= 3 || f.status === "open")
    .slice(0, 30);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-medium">Security notifications</h2>
            <p className="text-[11px] text-muted-foreground">
              High-priority alerts requiring analyst attention.
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No active alerts.
        </div>
      )}

      <div className="space-y-2">
        {!loading &&
          alerts.map((a) => {
            const cls = statusClasses[a.status] ?? statusClasses.open;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-soft transition-colors hover:bg-muted/40"
              >
                <SeverityBadge severity={a.severity} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {a.pattern_type}
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="truncate font-mono text-[11px]">{a.matched_value}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {a.context ?? "No additional context."}
                  </div>
                </div>
                <span className={`rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${cls}`}>
                  {a.status}
                </span>
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

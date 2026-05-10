import { useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ArrowUpDown, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SeverityBadge } from "@/components/SeverityBadge";
import { useFindings } from "@/hooks/use-findings";
import type { Finding } from "@/types/finding";
import { SEVERITIES, severityRank } from "@/lib/severity";

type SortKey = "created_at" | "risk_score" | "severity";

export default function ThreatFeed() {
  const { data, loading } = useFindings();
  const findings = data ?? [];

  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<string>("all");
  const [pattern, setPattern] = useState<string>("all");
  const [minRisk, setMinRisk] = useState<string>("0");
  const [sort, setSort] = useState<SortKey>("created_at");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Finding | null>(null);

  const patternTypes = useMemo(
    () => Array.from(new Set(findings.map((f) => f.pattern_type))).sort(),
    [findings],
  );

  const filtered = useMemo(() => {
    const min = Number(minRisk) || 0;
    let out = findings.filter((f) => {
      if (severity !== "all" && f.severity !== severity) return false;
      if (pattern !== "all" && f.pattern_type !== pattern) return false;
      if (f.risk_score < min) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          f.matched_value.toLowerCase().includes(q) ||
          f.pattern_type.toLowerCase().includes(q) ||
          (f.domain ?? "").toLowerCase().includes(q) ||
          (f.source ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
    out = [...out].sort((a, b) => {
      if (sort === "risk_score") return b.risk_score - a.risk_score;
      if (sort === "severity")
        return severityRank[b.severity] - severityRank[a.severity];
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return out;
  }, [findings, query, severity, pattern, minRisk, sort]);

  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetFilters = () => {
    setQuery(""); setSeverity("all"); setPattern("all"); setMinRisk("0"); setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-3 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search match, domain, source…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="h-8 w-64 text-xs"
          />
          <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pattern} onValueChange={(v) => { setPattern(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Pattern type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All patterns</SelectItem>
              {patternTypes.map((p) => (
                <SelectItem key={p} value={p} className="font-mono text-[11px]">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={minRisk} onValueChange={(v) => { setMinRisk(v); setPage(1); }}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Min risk" /></SelectTrigger>
            <SelectContent>
              {["0","30","50","70","90"].map((r) => (
                <SelectItem key={r} value={r}>Risk ≥ {r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <ArrowUpDown className="mr-1 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest first</SelectItem>
              <SelectItem value="risk_score">Risk score</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs">
            <X className="mr-1 h-3 w-3" /> Reset
          </Button>
          <span className="ml-auto text-[11px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium">Severity</th>
                <th className="px-4 py-2 text-left font-medium">Pattern</th>
                <th className="px-4 py-2 text-left font-medium">Match</th>
                <th className="px-4 py-2 text-left font-medium">Domain</th>
                <th className="px-4 py-2 text-left font-medium">Source</th>
                <th className="px-4 py-2 text-left font-medium">Risk</th>
                <th className="px-4 py-2 text-left font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full max-w-[140px]" /></td>
                    ))}
                  </tr>
                ))}
              {!loading && view.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No findings match these filters.
                  </td>
                </tr>
              )}
              {!loading && view.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => setSelected(f)}
                  className="cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5"><SeverityBadge severity={f.severity} /></td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{f.pattern_type}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">
                    <span className="block max-w-[260px] truncate">{f.matched_value}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{f.domain ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <span className="block max-w-[180px] truncate">{f.source ?? "—"}</span>
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
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span>Page {page} of {pageCount}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
              disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs"
              disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={selected.severity} />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {selected.pattern_type}
                  </span>
                </div>
                <SheetTitle className="break-all font-mono text-sm">
                  {selected.matched_value}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Finding ID <span className="font-mono">{selected.id.slice(0, 8)}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Field label="Risk score" value={String(selected.risk_score)} mono />
                <Field label="Status" value={selected.status} />
                <Field label="Domain" value={selected.domain ?? "—"} />
                <Field label="Source" value={selected.source ?? "—"} />
                <Field
                  label="Detected"
                  value={format(new Date(selected.created_at), "PPpp")}
                  full
                />
                <Field
                  label="Context"
                  value={selected.context ?? "No additional context."}
                  full
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, value, mono, full }: { label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={full ? "col-span-2 rounded-md border border-border bg-muted/30 p-2.5" : "rounded-md border border-border bg-muted/30 p-2.5"}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xs ${mono ? "font-mono tabular-nums" : ""} break-all`}>{value}</div>
    </div>
  );
}

import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const reports = [
  { title: "Weekly SOC summary", desc: "Findings, severity trends, and remediation status.", date: "Mon" },
  { title: "Monthly executive brief", desc: "High-level posture report for leadership.", date: "Apr 01" },
  { title: "Incident retrospective", desc: "Root-cause analysis for resolved incidents.", date: "Mar 28" },
  { title: "Compliance evidence pack", desc: "Audit-ready evidence (SOC 2, ISO 27001).", date: "Mar 22" },
];

export default function Reports() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-4 shadow-soft">
        <h2 className="text-sm font-medium">Reports</h2>
        <p className="text-[11px] text-muted-foreground">
          Generated SOC reports and audit-ready exports.
        </p>
      </div>
      <div className="grid gap-2">
        {reports.map((r) => (
          <div
            key={r.title}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-soft transition-colors hover:bg-muted/40"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-[11px] text-muted-foreground">{r.desc}</div>
            </div>
            <span className="text-[11px] text-muted-foreground">{r.date}</span>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
              <Download className="mr-1 h-3 w-3" /> Export
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

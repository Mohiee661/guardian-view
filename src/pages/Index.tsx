import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Activity, Database, FileText, RefreshCw, ShieldCheck } from "lucide-react";

// Backend base URL — assumes Flask runs on same origin or proxied.
// Change to e.g. "http://localhost:5000" if needed.
const API_BASE = "";

type LogEntry = {
  user: string;
  timestamp: string;
  action: string;
  resource: string;
  status?: string;
};

type Block = {
  index: number;
  timestamp: string | number;
  hash: string;
  previous_hash: string;
};

const short = (h: string) =>
  !h ? "—" : h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;

const Index = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chain, setChain] = useState<Block[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    user: "",
    timestamp: "",
    action: "login",
    resource: "",
  });

  // Fetch logs + chain in parallel from Flask backend
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, chainRes] = await Promise.all([
        fetch(`${API_BASE}/logs`),
        fetch(`${API_BASE}/chain`),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(Array.isArray(data) ? data : data.logs ?? []);
      }
      if (chainRes.ok) {
        const data = await chainRes.json();
        setChain(Array.isArray(data) ? data : data.chain ?? []);
      }
    } catch (err) {
      toast({
        title: "Connection error",
        description: "Could not reach backend API.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on page load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // POST a new log to the backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user || !form.timestamp || !form.resource) {
      toast({ title: "Missing fields", description: "Fill out all fields." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/add_log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      toast({ title: "Log added", description: `${form.user} · ${form.action}` });
      setForm({ user: "", timestamp: "", action: "login", resource: "" });
      refresh();
    } catch {
      toast({
        title: "Failed to add log",
        description: "Backend rejected the request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isSuspicious = (l: LogEntry) =>
    (l.status ?? "").toLowerCase().includes("suspicious") ||
    l.action === "file_delete";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              AI · Blockchain Security Suite
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Insider Threat Detection Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              AI + Blockchain-based Monitoring System
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <span className="text-sm font-medium text-foreground">System Active</span>
          </div>
        </header>

        {/* Top grid: Add Log + Blockchain */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* A. Add Log */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lg lg:col-span-1">
            <div className="mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold">Add Log</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="user">User</Label>
                <Input
                  id="user"
                  placeholder="e.g. alice"
                  value={form.user}
                  onChange={(e) => setForm({ ...form, user: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timestamp">Timestamp</Label>
                <Input
                  id="timestamp"
                  type="time"
                  value={form.timestamp}
                  onChange={(e) => setForm({ ...form, timestamp: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select
                  value={form.action}
                  onValueChange={(v) => setForm({ ...form, action: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="login">login</SelectItem>
                    <SelectItem value="file_read">file_read</SelectItem>
                    <SelectItem value="file_delete">file_delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resource">Resource</Label>
                <Input
                  id="resource"
                  placeholder="e.g. /reports/q4.pdf"
                  value={form.resource}
                  onChange={(e) => setForm({ ...form, resource: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Adding…" : "Add Log"}
              </Button>
            </form>
          </section>

          {/* C. Blockchain Viewer */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lg lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold">Blockchain Viewer</h2>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {chain.length} blocks
              </Badge>
            </div>
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {chain.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No blocks yet.
                </p>
              )}
              {chain.map((b) => (
                <div
                  key={b.index}
                  className="rounded-xl border border-border bg-background/60 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-serif text-lg font-semibold">
                      Block #{b.index}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(b.timestamp)}
                    </span>
                  </div>
                  <div className="grid gap-1 font-mono text-xs">
                    <div className="flex gap-2">
                      <span className="w-24 text-muted-foreground">hash</span>
                      <span className="truncate text-foreground">{short(b.hash)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-24 text-muted-foreground">prev</span>
                      <span className="truncate text-muted-foreground">
                        {short(b.previous_hash)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* B. Logs Table */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lg">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              <h2 className="text-xl font-semibold">Activity Logs</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead>User</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No logs recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((l, i) => {
                  const sus = isSuspicious(l);
                  return (
                    <TableRow
                      key={i}
                      className={sus ? "bg-destructive/5 hover:bg-destructive/10" : ""}
                    >
                      <TableCell className="font-medium">{l.user}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {l.timestamp}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{l.action}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {l.resource}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={sus ? "destructive" : "secondary"}
                          className="font-medium"
                        >
                          {sus ? "Suspicious" : l.status ?? "Normal"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Secured by AI heuristics &amp; immutable blockchain ledger
        </footer>
      </div>
    </div>
  );
};

export default Index;

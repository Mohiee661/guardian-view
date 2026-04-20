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

type LogEntry = {
  user: string;
  timestamp: string;
  action: string;
  resource: string;
  status?: string;
  explanation?: string;
};

type Block = {
  index: number;
  timestamp: string | number;
  hash: string;
  previous_hash: string;
};

const short = (hash: string) =>
  !hash ? "-" : hash.length > 14 ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;

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

  // Fetch logs from the Flask backend and display them in the table.
  const loadLogs = useCallback(async () => {
    try {
      const response = await fetch("/logs");
      if (!response.ok) {
        throw new Error("Failed to load logs");
      }

      const data = await response.json();
      setLogs(Array.isArray(data) ? data : data.logs ?? []);
    } catch (err) {
      console.error("Error loading logs:", err);
      alert("Failed to load logs.");
    }
  }, []);

  // Fetch blockchain data from the Flask backend and display each block.
  const loadChain = useCallback(async () => {
    try {
      const response = await fetch("/chain");
      if (!response.ok) {
        throw new Error("Failed to load blockchain");
      }

      const data = await response.json();
      setChain(Array.isArray(data) ? data : data.chain ?? []);
    } catch (err) {
      console.error("Error loading blockchain:", err);
      alert("Failed to load blockchain.");
    }
  }, []);

  // Reload logs and blockchain data when the Refresh button is clicked.
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadLogs(), loadChain()]);
    } finally {
      setLoading(false);
    }
  }, [loadLogs, loadChain]);

  // Auto-load logs and blockchain data when the page opens.
  useEffect(() => {
    loadLogs();
    loadChain();
  }, [loadLogs, loadChain]);

  // Capture form input and send it to the Flask backend without reloading.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.user || !form.timestamp || !form.resource) {
      toast({ title: "Missing fields", description: "Fill out all fields." });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/add_log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to add log");
      }

      toast({ title: "Log added", description: `${form.user} - ${form.action}` });
      setForm({ user: "", timestamp: "", action: "login", resource: "" });
      await Promise.all([loadLogs(), loadChain()]);
    } catch (err) {
      console.error("Error adding log:", err);
      alert("Failed to add log.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSuspicious = (log: LogEntry) =>
    (log.status ?? "").toLowerCase().includes("suspicious") ||
    log.action === "file_delete";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              AI + Blockchain Security Suite
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

        <div className="grid gap-6 lg:grid-cols-3">
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
                  onValueChange={(value) => setForm({ ...form, action: value })}
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
                {submitting ? "Adding..." : "Add Log"}
              </Button>
            </form>
          </section>

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
              {chain.map((block) => (
                <div
                  key={block.index}
                  className="rounded-xl border border-border bg-background/60 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-serif text-lg font-semibold">
                      Block #{block.index}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(block.timestamp)}
                    </span>
                  </div>
                  <div className="grid gap-1 font-mono text-xs">
                    <div className="flex gap-2">
                      <span className="w-24 text-muted-foreground">hash</span>
                      <span className="truncate text-foreground">
                        {short(block.hash)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-24 text-muted-foreground">prev</span>
                      <span className="truncate text-muted-foreground">
                        {short(block.previous_hash)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

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
                  <TableHead>Explanation</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No logs recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((log, index) => {
                  const suspicious = isSuspicious(log);

                  return (
                    <TableRow
                      key={index}
                      className={
                        suspicious ? "bg-destructive/5 hover:bg-destructive/10" : ""
                      }
                    >
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {log.timestamp}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.action}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.resource}
                      </TableCell>
                      <TableCell className="max-w-sm text-xs leading-relaxed text-muted-foreground">
                        {log.explanation ?? "No explanation available."}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={suspicious ? "destructive" : "secondary"}
                          className="font-medium"
                        >
                          {suspicious ? "Suspicious" : log.status ?? "Normal"}
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
          Secured by AI heuristics and immutable blockchain ledger
        </footer>
      </div>
    </div>
  );
};

export default Index;

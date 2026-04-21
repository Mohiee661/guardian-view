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
import {
  Activity,
  AlertCircle,
  Database,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

type LogEntry = {
  user: string;
  timestamp: string;
  action: string;
  resource: string;
  status?: string;
  risk_score?: number;
  explanation?: string;
};

type Block = {
  index: number;
  timestamp: string | number;
  hash: string;
  previous_hash: string;
};

type RiskLevel = "Low" | "Medium" | "High";

const short = (hash: string) =>
  !hash ? "-" : hash.length > 14 ? `${hash.slice(0, 8)}...${hash.slice(-6)}` : hash;

const buildApiUrl = (path: string) => {
  if (!API_BASE_URL) {
    throw new Error("Missing VITE_API_URL environment variable.");
  }

  return `${API_BASE_URL}${path}`;
};

const getRiskLevel = (score: number): RiskLevel => {
  if (score > 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
};

const getRiskClassName = (score: number) => {
  const level = getRiskLevel(score);

  if (level === "High") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  if (level === "Medium") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700";
  }

  return "border-success/30 bg-success/10 text-success";
};

const getSuggestedAction = (log: LogEntry) => {
  const score = log.risk_score ?? 0;
  const level = getRiskLevel(score);

  if (level === "High") {
    return "Review immediately, verify the user, and restrict access if needed.";
  }

  if (level === "Medium") {
    return "Monitor the activity and confirm it matches expected work.";
  }

  return "No immediate action required. Continue normal monitoring.";
};

const Index = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [chain, setChain] = useState<Block[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<LogEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    user: "",
    timestamp: "",
    action: "login",
    resource: "",
  });

  const showError = (message: string, error: unknown) => {
    console.error(message, error);
    setErrorMessage(message);
    toast({
      title: "Something went wrong",
      description: message,
      variant: "destructive",
    });
  };

  // Fetch logs from the deployed Flask backend and display them in the table.
  const loadLogs = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/logs"));
      if (!response.ok) {
        throw new Error("The backend could not load logs.");
      }

      const data = await response.json();
      const nextLogs = Array.isArray(data) ? data : data.logs ?? [];
      setLogs(nextLogs);
      setErrorMessage("");
    } catch (err) {
      showError("Unable to load activity logs. Please try again.", err);
    }
  }, []);

  // Fetch blockchain data from the deployed Flask backend.
  const loadChain = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl("/chain"));
      if (!response.ok) {
        throw new Error("The backend could not load the blockchain.");
      }

      const data = await response.json();
      setChain(Array.isArray(data) ? data : data.chain ?? []);
      setErrorMessage("");
    } catch (err) {
      showError("Unable to load blockchain data. Please try again.", err);
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
    refresh();
  }, [refresh]);

  // Capture form input and send it to the deployed Flask backend.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.user || !form.timestamp || !form.resource) {
      toast({ title: "Missing fields", description: "Fill out all fields." });
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(buildApiUrl("/add_log"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("The backend rejected this log entry.");
      }

      const result = await response.json();
      const savedLog = result.log as LogEntry;

      setLatestAnalysis(savedLog);
      toast({ title: "Log analyzed", description: `${form.user} - ${form.action}` });
      setForm({ user: "", timestamp: "", action: "login", resource: "" });
      await Promise.all([loadLogs(), loadChain()]);
    } catch (err) {
      showError("Unable to analyze this log. Please check the backend URL.", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isSuspicious = (log: LogEntry) =>
    (log.status ?? "").toLowerCase().includes("suspicious") ||
    getRiskLevel(log.risk_score ?? 0) === "High";

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

        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

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
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Analyzing..." : "Analyze Log"}
              </Button>
            </form>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lg lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold">Latest Analysis</h2>
              </div>
              {latestAnalysis && (
                <Badge className={getRiskClassName(latestAnalysis.risk_score ?? 0)}>
                  {getRiskLevel(latestAnalysis.risk_score ?? 0)} Risk
                </Badge>
              )}
            </div>

            {!latestAnalysis ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Submit a log to see risk level, reason, and suggested action.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Risk Level
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {getRiskLevel(latestAnalysis.risk_score ?? 0)}
                  </p>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    Score: {latestAnalysis.risk_score ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Reason
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {latestAnalysis.explanation ?? "No explanation available."}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background/60 p-4">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Suggested Action
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {getSuggestedAction(latestAnalysis)}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-lg">
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
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Explanation</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No logs recorded yet.
                    </TableCell>
                  </TableRow>
                )}
                {logs.map((log, index) => {
                  const suspicious = isSuspicious(log);
                  const riskScore = log.risk_score ?? 0;

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
                      <TableCell>
                        <Badge className={getRiskClassName(riskScore)}>
                          {getRiskLevel(riskScore)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-mono ${getRiskClassName(riskScore)}`}>
                          {riskScore}
                        </Badge>
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

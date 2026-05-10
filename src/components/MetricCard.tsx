import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  tone?: "default" | "critical" | "warning" | "info";
  className?: string;
}

const toneText: Record<NonNullable<Props["tone"]>, string> = {
  default: "text-foreground",
  critical: "text-severity-critical",
  warning: "text-severity-high",
  info: "text-severity-medium",
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  tone = "default",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "group rounded-lg border border-border bg-card p-4 shadow-soft transition-colors hover:border-border/80 hover:bg-card/80",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground/70" />}
      </div>
      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className={cn("text-2xl font-semibold tabular-nums", toneText[tone])}>
            {value}
          </div>
        )}
      </div>
      {hint && (
        <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

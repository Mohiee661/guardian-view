import { cn } from "@/lib/utils";
import {
  type Severity,
  severityClasses,
  severityDot,
  severityLabel,
} from "@/lib/severity";

interface Props {
  severity: Severity;
  className?: string;
  withDot?: boolean;
}

export function SeverityBadge({ severity, className, withDot = true }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        severityClasses[severity],
        className,
      )}
    >
      {withDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", severityDot[severity])} />
      )}
      {severityLabel(severity)}
    </span>
  );
}

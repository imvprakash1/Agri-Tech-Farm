type MetricStatus = "normal" | "warning" | "critical";

const TEXT_COLOR: Record<MetricStatus, string> = {
  normal: "text-foreground",
  warning: "text-status-warn",
  critical: "text-status-critical",
};

export function MetricDisplay({
  label,
  value,
  unit,
  status = "normal",
}: {
  label: string;
  value: number | null;
  unit: string;
  status?: MetricStatus;
}) {
  return (
    <div className="rounded-lg bg-surface p-3 border border-border">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={`text-2xl font-mono font-semibold ${TEXT_COLOR[status]}`}>
        {value !== null ? value.toFixed(1) : "--"}
        <span className="text-sm text-text-muted ml-1">{unit}</span>
      </p>
    </div>
  );
}

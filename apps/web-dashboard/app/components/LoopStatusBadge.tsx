const STATUS_STYLES: Record<string, string> = {
  IDLE: "bg-zinc-800 text-zinc-400",
  VIOLATION_DETECTED: "bg-red-950 text-status-warn border border-status-critical",
  DOSING: "bg-amber-950 text-status-warn",
  COOLDOWN: "bg-zinc-800 text-status-warn",
  PURGING: "bg-amber-950 text-status-warn",
  CHILLING: "bg-blue-950 text-blue-400",
  CIRCULATING: "bg-cyan-950 text-cyan-400",
};

export function LoopStatusBadge({ loopName, status }: { loopName: string; status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-zinc-800 text-zinc-400";

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-muted">{loopName}</span>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ${style}`}>
        {status}
      </span>
    </div>
  );
}

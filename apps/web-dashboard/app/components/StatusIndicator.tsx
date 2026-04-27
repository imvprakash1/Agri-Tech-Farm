type Status = "online" | "offline" | "warning" | "unknown";

const COLOR_MAP: Record<Status, string> = {
  online: "bg-status-ok",
  warning: "bg-status-warn",
  offline: "bg-status-critical",
  unknown: "bg-zinc-600",
};

export function StatusIndicator({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-3 w-3" : "h-2.5 w-2.5";
  const pulse = status === "online" ? "animate-pulse" : "";

  return (
    <span className={`inline-block rounded-full ${dim} ${COLOR_MAP[status]} ${pulse}`} />
  );
}

import { t } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  approved: "bg-success/15 text-success",
  resolved: "bg-success/15 text-success",
  pending: "bg-warn/15 text-warn",
  open: "bg-warn/15 text-warn",
  draft: "bg-elevated text-muted",
  dismissed: "bg-elevated text-muted",
  rejected: "bg-danger/15 text-danger",
  removed: "bg-danger/15 text-danger",
  suspended: "bg-danger/15 text-danger",
};

export function StatusBadge({ status }: { status: string }) {
  const label =
    status in t.ops.status ? t.ops.status[status as keyof typeof t.ops.status] : status;
  return (
    <span
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-medium capitalize",
        tones[status] ?? "bg-elevated text-muted",
      )}
    >
      {label}
    </span>
  );
}

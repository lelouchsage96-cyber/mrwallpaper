import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { t } from "@/lib/i18n/en";
import { cn, formatCount } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  delta,
  to,
  icon,
}: {
  label: string;
  value: number;
  hint?: string;
  delta?: number;
  to?: "/ops/wallpapers" | "/ops/reports" | "/ops/users";
  icon?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-widest text-subtle uppercase">{label}</p>
        {icon ? <span className="text-subtle">{icon}</span> : null}
      </div>
      <p className="mt-3 font-display text-3xl tabular-nums text-fg">{formatCount(value)}</p>
      {delta !== undefined && delta !== 0 ? (
        <p className={cn("mt-1 text-xs tabular-nums", delta > 0 ? "text-success" : "text-danger")}>
          {delta > 0 ? "+" : ""}
          {delta} {t.ops.vsYesterday}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted">{hint}</p>
      ) : null}
    </>
  );

  const className = "block rounded-xl bg-elevated px-4 py-4";
  if (to) {
    return (
      <Link to={to} className={cn(className, "transition-opacity hover:opacity-90")}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

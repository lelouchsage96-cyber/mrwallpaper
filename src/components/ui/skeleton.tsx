import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[12px] bg-elevated", className)}
      aria-hidden
    />
  );
}

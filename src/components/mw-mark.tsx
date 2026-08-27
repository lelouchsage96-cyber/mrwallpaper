import { cn } from "@/lib/utils";

export function MwMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={cn("text-fg", className)}
      role="img"
      aria-label="Mr Wallpapers"
    >
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="16"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M10 46 V18 L21 40 L32 18 V46"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M34 18 L40 46 L46 28 L52 46 L58 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

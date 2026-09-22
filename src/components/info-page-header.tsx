import { ArrowLeft } from "lucide-react";

export function InfoPageHeader({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Home",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="max-w-2xl">
      <a
        href={backHref}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-elevated/55 px-3.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-fg"
      >
        <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" />
        {backLabel}
      </a>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-subtle">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{description}</p>
        ) : null}
      </div>
    </header>
  );
}

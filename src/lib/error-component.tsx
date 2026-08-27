import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { t } from "@/lib/i18n/en";

export function AppErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-2xl">{t.errors.generic}</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {error.message || t.errors.empty}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="grid h-11 place-items-center rounded-full bg-fg px-5 text-sm font-medium text-bg"
        >
          {t.errors.retry}
        </button>
        <a
          href="/app"
          className="grid h-11 place-items-center rounded-full bg-elevated px-5 text-sm font-medium text-fg"
        >
          {t.nav.home}
        </a>
      </div>
    </main>
  );
}

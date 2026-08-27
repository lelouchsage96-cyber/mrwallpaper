import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/empty-state";
import { LazyImage } from "@/components/lazy";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { t } from "@/lib/i18n/en";
import { getExploreMeta, getTaste, saveTaste } from "@/lib/server/api";
import { readLocalTaste, writeLocalTaste } from "@/lib/taste";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/taste")({ component: TastePage });

function TastePage() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [picked, setPicked] = useState<string[]>(() => readLocalTaste());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getExploreMeta()
      .then((meta) => setCategories(meta.categories))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setPicked((prev) => (prev.length ? prev : readLocalTaste()));
      return;
    }
    void getTaste()
      .then((taste) => {
        setPicked((prev) => {
          if (prev.length) return prev;
          return taste.categoryIds.length ? taste.categoryIds : readLocalTaste();
        });
      })
      .catch(() => undefined);
  }, [user, isPending]);

  function toggle(id: string) {
    setMsg(null);
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    if (picked.length < 3) {
      setMsg(t.taste.needThree);
      return;
    }
    setBusy(true);
    writeLocalTaste(picked);
    try {
      if (user) {
        const res = await saveTaste({ data: { categoryIds: picked } });
        if (!res.ok) {
          setMsg(t.taste.needThree);
          return;
        }
      }
      await router.invalidate();
      void navigate({ to: "/app" });
    } catch {
      setMsg(t.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  const ready = picked.length >= 3;

  return (
    <div className="px-4 pt-5 pb-36">
      <p className="text-xs tracking-[0.2em] text-muted uppercase">{t.preview.live}</p>
      <h1 className="mt-2 font-display text-3xl text-fg">{t.taste.title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted">{t.taste.hint}</p>

      {error ? (
        <div className="mt-6">
          <ErrorState
            onRetry={() => {
              setError(false);
              setLoading(true);
              void getExploreMeta()
                .then((meta) => setCategories(meta.categories))
                .catch(() => setError(true))
                .finally(() => setLoading(false));
            }}
          />
        </div>
      ) : loading ? (
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-elevated" />
          ))}
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {categories.map((c) => {
            const on = picked.includes(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={on}
                  className={cn(
                    "relative block w-full overflow-hidden rounded-xl text-left shadow-[var(--shadow-border)] transition-[opacity,transform] duration-150 ease-out active:scale-[0.98]",
                    on ? "ring-2 ring-fg ring-offset-2 ring-offset-bg" : "opacity-80",
                  )}
                >
                  <span className="relative block aspect-[4/5] bg-elevated">
                    {c.coverUrl ? (
                      <LazyImage src={c.coverUrl} alt="" className="size-full object-cover" />
                    ) : null}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/85 to-transparent px-3 py-2.5">
                      <span className="text-sm font-medium text-fg">{c.name}</span>
                    </span>
                    {on ? (
                      <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-fg text-bg">
                        <Check className="size-3.5" strokeWidth={2.4} />
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-30 px-4">
        <div className="pointer-events-auto mx-auto flex max-w-5xl items-center gap-3 rounded-xl bg-bg/90 p-3 shadow-[var(--shadow-border)] backdrop-blur-md">
          <p className="min-w-0 flex-1 text-sm text-muted">
            {ready ? t.taste.picked.replace("{n}", String(picked.length)) : t.taste.needThree}
            {msg ? ` · ${msg}` : ""}
          </p>
          <Button className="shrink-0" disabled={busy || loading || !ready} onClick={() => void save()}>
            {t.taste.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

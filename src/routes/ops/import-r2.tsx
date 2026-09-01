import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Cloud, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  importOpsR2Wallpaper,
  listOpsR2Candidates,
  type OpsR2Candidate,
} from "@/lib/server/ops-r2-import";
import type { Category } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

export const Route = createFileRoute("/ops/import-r2")({ component: ImportR2Page });

type FormState = {
  title: string;
  description: string;
  categoryId: string;
  deviceType: "phone" | "tablet" | "both";
  tags: string;
};

function ImportR2Page() {
  const [items, setItems] = useState<OpsR2Candidate[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<OpsR2Candidate | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ id: string; slug: string } | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    categoryId: "",
    deviceType: "phone",
    tags: "",
  });

  const categoryOptions = useMemo(() => categories, [categories]);

  async function load(next: string | null = null) {
    setLoading(true);
    setError(null);
    try {
      const res = await listOpsR2Candidates({
        data: { cursor: next, prefix: prefix.trim() || undefined },
      });
      setItems(res.items);
      setCategories(res.categories);
      setCursor(next);
      setNextCursor(res.nextCursor);
      if (!form.categoryId && res.categories[0]?.id) {
        setForm((prev) => ({ ...prev, categoryId: res.categories[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not scan R2.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(item: OpsR2Candidate) {
    setSelected(item);
    setSuccess(null);
    setError(null);
    setForm((prev) => ({
      ...prev,
      title: item.suggestedTitle,
      description: "",
      tags: "",
    }));
  }

  async function importSelected() {
    if (!selected || !form.categoryId || form.title.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const res = await importOpsR2Wallpaper({
        data: {
          key: selected.key,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          categoryId: form.categoryId,
          deviceType: form.deviceType,
          tags: form.tags.trim() || undefined,
        },
      });
      if (!res.ok) {
        const messages: Record<string, string> = {
          duplicate: "This wallpaper is already in the website database.",
          size: "This R2 image is larger than the current upload limit.",
          missing: "The R2 object could not be read.",
          image: "The file is not a supported wallpaper image.",
          category: "Choose a valid category.",
          file: "This R2 object cannot be imported as a wallpaper.",
        };
        setError(messages[res.error] ?? "Import failed.");
        return;
      }
      setSuccess({ id: res.id, slug: res.slug });
      setItems((prev) => prev.filter((item) => item.key !== selected.key));
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">Cloudflare R2</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Import existing wallpapers</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Scan files already stored in your R2 bucket and publish them without re-uploading or duplicating storage.
          </p>
        </div>
        <Link to="/ops/upload" className="text-sm text-muted hover:text-fg">
          Upload a new wallpaper instead
        </Link>
      </div>

      <div className="rounded-xl bg-elevated p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Optional folder/prefix, e.g. wallpapers/"
            className="flex-1 bg-surface"
          />
          <Button variant="secondary" onClick={() => void load(null)} disabled={loading}>
            <RefreshCw className="size-4" />
            Scan R2
          </Button>
        </div>
      </div>

      {success ? (
        <div className="flex items-center gap-3 rounded-xl bg-elevated p-4 text-sm text-fg">
          <CheckCircle2 className="size-5" />
          Wallpaper imported and published.
          <Link to="/wallpaper/$id" params={{ id: success.id }} className="underline underline-offset-4">
            View it
          </Link>
        </div>
      ) : null}

      {error ? <p className="rounded-xl bg-elevated p-4 text-sm text-danger">{error}</p> : null}

      {selected ? (
        <section className="rounded-xl bg-elevated p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              {selected.publicUrl ? (
                <img
                  src={selected.publicUrl}
                  alt=""
                  className="mx-auto max-h-80 w-full rounded-xl bg-surface object-contain"
                />
              ) : (
                <div className="flex aspect-[9/16] items-center justify-center rounded-xl bg-surface text-muted">
                  <Cloud className="size-8" />
                </div>
              )}
              <p className="mt-3 break-all text-xs text-muted">{selected.key}</p>
              <p className="mt-1 text-xs text-subtle">{formatBytes(selected.size)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  maxLength={60}
                  className="bg-surface"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value.slice(0, 280) }))}
                  rows={3}
                  className="w-full rounded-xl bg-surface px-4 py-3 text-sm text-fg outline-none shadow-[var(--shadow-border)]"
                  placeholder="Optional"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                    className="h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Device</label>
                  <select
                    value={form.deviceType}
                    onChange={(e) => setForm((p) => ({ ...p, deviceType: e.target.value as FormState["deviceType"] }))}
                    className="h-11 w-full rounded-xl bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                  >
                    <option value="phone">Phone</option>
                    <option value="tablet">Tablet</option>
                    <option value="both">Phone + Tablet</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Tags</label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="minimal, motivational, dark"
                  className="bg-surface"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void importSelected()} disabled={busy || !form.categoryId || form.title.trim().length < 2}>
                  {busy ? "Importing…" : "Import & publish free"}
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)} disabled={busy}>Cancel</Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-fg">R2 files not yet imported</h2>
          <span className="text-xs text-muted">{items.length} shown</span>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-elevated" />
        ) : items.length === 0 ? (
          <div className="rounded-xl bg-elevated px-4 py-12 text-center text-sm text-muted">
            No unimported wallpaper images found on this page of the bucket.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => choose(item)}
                className="overflow-hidden rounded-xl bg-elevated text-left transition hover:opacity-90"
              >
                {item.publicUrl ? (
                  <div className="flex h-48 items-center justify-center bg-surface">
                    <img src={item.publicUrl} alt="" loading="lazy" className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-surface text-muted"><Cloud className="size-8" /></div>
                )}
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-fg">{item.suggestedTitle}</p>
                  <p className="mt-1 truncate text-xs text-muted">{item.key}</p>
                  <p className="mt-1 text-xs text-subtle">{formatBytes(item.size)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          disabled={!cursor || loading}
          onClick={() => void load(null)}
        >
          First page
        </Button>
        <Button
          variant="secondary"
          disabled={!nextCursor || loading}
          onClick={() => void load(nextCursor)}
        >
          Next R2 page
        </Button>
      </div>
    </div>
  );
}

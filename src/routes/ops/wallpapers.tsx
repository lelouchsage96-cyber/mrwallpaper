import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ErrorState } from "@/components/empty-state";
import { StatusBadge } from "@/components/ops/status-badge";
import { OpsThumb } from "@/components/ops/thumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n/en";
import {
  listOpsFeatured,
  listOpsWallpapers,
  removeFeaturedSlot,
  setFeaturedSlot,
  updateWallpaperOps,
} from "@/lib/server/ops";
import type { OpsFeaturedRow, OpsWallpaperRow } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";

export const Route = createFileRoute("/ops/wallpapers")({ component: OpsWallpapersPage });

const statuses = ["pending", "approved", "draft", "rejected", "removed"] as const;
const slots = ["wotd", "editors_choice"] as const;

function Select({
  value,
  onChange,
  children,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  "aria-label": string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 min-w-0 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
    >
      {children}
    </select>
  );
}

function slotLabel(slot: string) {
  return slot === "wotd" ? t.ops.wotd : t.ops.editors;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function CatalogRow({
  w,
  onPatch,
  onPlace,
}: {
  w: OpsWallpaperRow;
  onPatch: (next: Partial<OpsWallpaperRow>) => void;
  onPlace: (slot: "wotd" | "editors_choice") => void;
}) {
  return (
    <li className="px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <OpsThumb src={w.thumbnailUrl} alt={w.title} id={w.id} />
          <Link
            to="/wallpaper/$id"
            params={{ id: w.id }}
            className="min-w-0 flex-1"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-fg">{w.title}</span>
              <StatusBadge status={w.status} />
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {w.categoryName}
              {" · "}
              {t.ops.device[w.deviceType]}
              {" · "}
              {formatCount(w.downloadCount)} {t.wallpaper.downloads}
            </span>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:max-w-xl lg:justify-end">
          <Link
            to="/ops/wallpapers/$id/edit"
            params={{ id: w.id }}
            className="inline-flex h-11 items-center justify-center rounded-full bg-surface px-4 text-sm font-medium text-fg shadow-[var(--shadow-border)] transition-opacity hover:opacity-80"
          >
            Edit
          </Link>
          <button
            type="button"
            className={cn(
              "h-11 rounded-full px-4 text-sm",
              w.accessType === "premium" ? "bg-fg text-bg" : "bg-surface text-muted",
            )}
            onClick={() =>
              onPatch({ accessType: w.accessType === "premium" ? "free" : "premium" })
            }
          >
            {w.accessType === "premium" ? t.ops.access.premium : t.ops.access.free}
          </button>
          <Select
            value={w.deviceType}
            aria-label={t.ops.device.phone}
            onChange={(v) => onPatch({ deviceType: v as OpsWallpaperRow["deviceType"] })}
          >
            <option value="phone">{t.ops.device.phone}</option>
            <option value="tablet">{t.ops.device.tablet}</option>
            <option value="both">{t.ops.device.both}</option>
          </Select>
          <Select
            value={w.status}
            aria-label={t.ops.wallpapers}
            onChange={(v) => onPatch({ status: v })}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t.ops.status[s]}
              </option>
            ))}
          </Select>
          <Select
            value=""
            aria-label={t.ops.placeOn}
            onChange={(v) => {
              if (v === "wotd" || v === "editors_choice") onPlace(v);
            }}
          >
            <option value="" disabled>
              {t.ops.placeOn}
            </option>
            <option value="wotd">{t.ops.placeWotd}</option>
            <option value="editors_choice">{t.ops.placeEditors}</option>
          </Select>
        </div>
      </div>
      <details className="group mt-3">
        <summary className="flex h-9 w-fit cursor-pointer list-none items-center gap-1 text-xs text-muted hover:text-fg [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-3.5 shrink-0 transition-transform duration-150 group-open:rotate-180" />
          {t.ops.seo}
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={t.ops.seoSlug}>
            <Input
              className="bg-surface"
              defaultValue={w.slug}
              placeholder={t.ops.seoSlug}
              aria-label={t.ops.seoSlug}
              onBlur={(e) => {
                const slug = e.target.value.trim();
                if (slug && slug !== w.slug) onPatch({ slug });
              }}
            />
          </Field>
          <Field label={t.ops.seoTitle}>
            <Input
              className="bg-surface"
              defaultValue={w.seoTitle}
              placeholder={t.ops.seoTitle}
              aria-label={t.ops.seoTitle}
              onBlur={(e) => onPatch({ seoTitle: e.target.value })}
            />
          </Field>
          <Field label={t.ops.seoDescription}>
            <Input
              className="bg-surface"
              defaultValue={w.seoDescription}
              placeholder={t.ops.seoDescription}
              aria-label={t.ops.seoDescription}
              onBlur={(e) => onPatch({ seoDescription: e.target.value })}
            />
          </Field>
          <Field label={t.ops.seoAlt}>
            <Input
              className="bg-surface"
              defaultValue={w.altText}
              placeholder={t.ops.seoAlt}
              aria-label={t.ops.seoAlt}
              onBlur={(e) => onPatch({ altText: e.target.value })}
            />
          </Field>
          <Field label={t.ops.seoCanonical}>
            <Input
              className="bg-surface"
              defaultValue={w.canonicalPath}
              placeholder={t.ops.seoCanonical}
              aria-label={t.ops.seoCanonical}
              onBlur={(e) => onPatch({ canonicalPath: e.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                w.robots === "index" ? "bg-fg text-bg" : "bg-surface text-muted",
              )}
              onClick={() => onPatch({ robots: w.robots === "index" ? "noindex" : "index" })}
            >
              {t.ops.seoIndex}: {w.robots}
            </button>
          </div>
        </div>
      </details>
    </li>
  );
}

function OpsWallpapersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<OpsWallpaperRow[]>([]);
  const [featured, setFeatured] = useState<OpsFeaturedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function load() {
    setLoading(true);
    setError(false);
    void Promise.all([
      listOpsWallpapers({ data: { q: q.trim() || undefined, status: status || undefined } }),
      listOpsFeatured(),
    ])
      .then(([w, f]) => {
        setItems(w.items);
        setFeatured(f.items);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const id = window.setTimeout(() => load(), 200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  async function patch(id: string, next: Partial<OpsWallpaperRow>) {
    await updateWallpaperOps({
      data: {
        wallpaperId: id,
        status: next.status as "draft" | "pending" | "approved" | "rejected" | "removed" | undefined,
        accessType: next.accessType,
        deviceType: next.deviceType,
        slug: next.slug,
        seoTitle: next.seoTitle,
        seoDescription: next.seoDescription,
        altText: next.altText,
        canonicalPath: next.canonicalPath,
        robots: next.robots as "index" | "noindex" | undefined,
      },
    });
    setItems((prev) => prev.map((w) => (w.id === id ? { ...w, ...next } : w)));
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium tracking-widest text-subtle uppercase">{t.ops.studio}</p>
        <h1 className="mt-1 font-display text-4xl text-fg">{t.ops.wallpapers}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">{t.ops.catalogHint}</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl text-fg">{t.ops.featured}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {slots.map((slot) => {
            const rows = featured.filter((f) => f.slot === slot);
            return (
              <div key={slot} className="rounded-xl bg-elevated p-4">
                <p className="text-xs font-medium tracking-widest text-subtle uppercase">
                  {slotLabel(slot)}
                </p>
                {rows.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">{t.ops.emptySlot}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {rows.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center gap-3 rounded-lg bg-surface p-2"
                      >
                        <OpsThumb src={f.thumbnailUrl} alt={f.title} id={f.wallpaperId} />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                          {f.title}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await removeFeaturedSlot({ data: { id: f.id } });
                            setFeatured((prev) => prev.filter((x) => x.id !== f.id));
                          }}
                        >
                          {t.ops.removePlace}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.explore.placeholder}
          aria-label={t.explore.placeholder}
          type="search"
        />
        <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setStatus("")}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-sm",
              status === "" ? "bg-fg text-bg" : "bg-elevated text-muted",
            )}
          >
            {t.ops.allStatuses}
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm",
                status === s ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              {t.ops.status[s]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState onRetry={load} />
      ) : loading && items.length === 0 ? (
        <div className="h-48 animate-pulse rounded-xl bg-elevated" />
      ) : items.length === 0 ? (
        <p className="rounded-xl bg-elevated px-4 py-10 text-center text-sm text-muted">
          {t.ops.emptyCatalog}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-elevated">
          {items.map((w) => (
            <CatalogRow
              key={w.id}
              w={w}
              onPatch={(next) => void patch(w.id, next)}
              onPlace={(slot) => {
                void setFeaturedSlot({
                  data: { wallpaperId: w.id, slot },
                }).then(load);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

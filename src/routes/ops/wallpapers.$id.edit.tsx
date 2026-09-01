import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOpsWallpaperEdit,
  updateOpsWallpaperMetadata,
  type OpsWallpaperEditData,
} from "@/lib/server/ops-wallpaper-edit";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/ops/wallpapers/$id/edit")({ component: EditWallpaperPage });

const statuses = ["draft", "pending", "approved", "rejected", "removed"] as const;

function EditWallpaperPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [wallpaper, setWallpaper] = useState<OpsWallpaperEditData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deviceType, setDeviceType] = useState<"phone" | "tablet" | "both">("phone");
  const [status, setStatus] = useState<(typeof statuses)[number]>("approved");
  const [tags, setTags] = useState("");

  useEffect(() => {
    setLoading(true);
    void getOpsWallpaperEdit({ data: { wallpaperId: id } })
      .then((result) => {
        setCategories(result.categories);
        setWallpaper(result.wallpaper);
        if (result.wallpaper) {
          setTitle(result.wallpaper.title);
          setDescription(result.wallpaper.description);
          setCategoryId(result.wallpaper.categoryId);
          setDeviceType(result.wallpaper.deviceType);
          setStatus(result.wallpaper.status);
          setTags(result.wallpaper.tags.join(", "));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-elevated" />;
  }

  if (!wallpaper) {
    return (
      <div className="rounded-xl bg-elevated p-6">
        <h1 className="font-display text-3xl text-fg">Wallpaper not found</h1>
        <Link to="/ops/wallpapers" className="mt-4 inline-block text-sm text-muted hover:text-fg">
          Back to wallpapers
        </Link>
      </div>
    );
  }

  async function save() {
    const cleanTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);
    setSaving(true);
    setMessage("");
    try {
      const result = await updateOpsWallpaperMetadata({
        data: {
          wallpaperId: id,
          title,
          description,
          categoryId,
          deviceType,
          status,
          tags: cleanTags,
        },
      });
      if (!result.ok) {
        setMessage("Please choose a valid category.");
        return;
      }
      setMessage("Saved successfully.");
    } catch {
      setMessage("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-subtle">Wallpaper</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Edit wallpaper</h1>
          <p className="mt-2 text-sm text-muted">Change metadata without re-uploading the image.</p>
        </div>
        <Button variant="secondary" onClick={() => void navigate({ to: "/ops/wallpapers" })}>
          Back
        </Button>
      </div>

      <section className="grid gap-6 rounded-xl bg-elevated p-5 md:grid-cols-[180px_1fr]">
        <div>
          {wallpaper.thumbnailUrl ? (
            <img
              src={wallpaper.thumbnailUrl}
              alt={title || wallpaper.title}
              className="aspect-[9/16] w-full rounded-xl object-cover"
            />
          ) : (
            <div className="aspect-[9/16] w-full rounded-xl bg-surface" />
          )}
          <p className="mt-2 break-all text-xs text-subtle">ID: {wallpaper.id}</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-muted">
            Title
            <Input
              className="mt-1 bg-surface"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              required
            />
            <span className="mt-1 block text-xs text-subtle">{title.length}/60</span>
          </label>

          <label className="block text-sm text-muted">
            Description
            <textarea
              className="mt-1 min-h-28 w-full resize-y rounded-[12px] bg-surface px-4 py-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              placeholder="Short description of this wallpaper"
            />
            <span className="mt-1 block text-xs text-subtle">{description.length}/280</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-muted">
              Category
              <select
                className="mt-1 h-11 w-full rounded-[12px] bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-muted">
              Device
              <select
                className="mt-1 h-11 w-full rounded-[12px] bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value as "phone" | "tablet" | "both")}
              >
                <option value="phone">Phone</option>
                <option value="tablet">Tablet</option>
                <option value="both">Both</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-muted">
              Status
              <select
                className="mt-1 h-11 w-full rounded-[12px] bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof statuses)[number])}
              >
                {statuses.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm text-muted">
              Tags
              <Input
                className="mt-1 bg-surface"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="minimal, blue, quote"
              />
              <span className="mt-1 block text-xs text-subtle">Up to 8 tags, separated by commas.</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={() => void save()} disabled={saving || title.trim().length < 2 || !categoryId}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {message ? <p className="text-sm text-muted">{message}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

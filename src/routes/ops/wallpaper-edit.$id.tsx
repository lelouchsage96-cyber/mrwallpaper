import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOpsWallpaperEdit,
  updateOpsWallpaperMetadata,
  type OpsWallpaperEditData,
} from "@/lib/server/ops-wallpaper-edit";
import type { Category } from "@/lib/types";
import { checkWallpaperSeoConflicts, generateWallpaperSeo, type SeoConflict, type SeoField } from "@/lib/server/ops-upload";

export const Route = createFileRoute("/ops/wallpaper-edit/$id")({ component: EditWallpaperPage });

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
  const [altText, setAltText] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [conflicts, setConflicts] = useState<SeoConflict[]>([]);
  const [confirmedConflicts, setConfirmedConflicts] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMessage("");
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
          setAltText(result.wallpaper.altText);
          setPrimaryKeyword(result.wallpaper.primaryKeyword);
        }
      })
      .catch(() => setMessage("Could not load this wallpaper."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-elevated" />;
  }

  if (!wallpaper) {
    return (
      <div className="rounded-xl bg-elevated p-6">
        <h1 className="font-display text-3xl text-fg">Wallpaper not found</h1>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
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
      .slice(0, 18);
    if (!confirmedConflicts) {
      const check = await checkWallpaperSeoConflicts({ data: { title, primaryKeyword, excludeWallpaperId: id } });
      setConflicts(check.conflicts);
      if (check.conflicts.length) {
        setMessage("Review the possible duplicate SEO, then save again if it is intentional.");
        setConfirmedConflicts(true);
        return;
      }
    }
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
          altText,
          primaryKeyword,
        },
      });
      if (!result.ok) {
        setMessage("Please choose a valid category.");
        return;
      }
      setWallpaper((current) => current ? {
        ...current,
        title: title.trim(),
        description: description.trim(),
        categoryId,
        categoryName: categories.find((c) => c.id === categoryId)?.name ?? current.categoryName,
        deviceType,
        status,
        tags: cleanTags,
        altText: altText.trim(),
        primaryKeyword: primaryKeyword.trim(),
      } : current);
      setMessage("Saved successfully.");
    } catch {
      setMessage("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function imageDataUrl(): Promise<string> {
    if (!wallpaper?.thumbnailUrl) throw new Error("No image is available for analysis.");
    const response = await fetch(wallpaper.thumbnailUrl);
    if (!response.ok) throw new Error("The wallpaper image could not be loaded.");
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function generateSeo(field: SeoField = "all") {
    if (!wallpaper) return;
    setGeneratingSeo(true);
    setMessage("");
    try {
      const result = await generateWallpaperSeo({ data: {
        imageDataUrl: await imageDataUrl(), title, description, tags, altText, primaryKeyword,
        categoryId, deviceType, width: wallpaper.width, height: wallpaper.height, field,
      } });
      if (!result.ok) { setMessage(result.error); return; }
      if (field === "all" || field === "title") setTitle(result.seo.title);
      if (field === "all" || field === "description") setDescription(result.seo.description);
      if (field === "all" || field === "tags") setTags(result.seo.tags.join(", "));
      if (field === "all" || field === "altText") setAltText(result.seo.altText);
      if (field === "all" || field === "primaryKeyword") setPrimaryKeyword(result.seo.primaryKeyword);
      if (field === "all") setCategoryId(result.seo.categoryId);
      setConflicts([]);
      setConfirmedConflicts(false);
      setMessage(field === "all" ? "SEO fields generated. Review and save when ready." : "Field regenerated. Review and save when ready.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "SEO generation failed. Please try again.");
    } finally { setGeneratingSeo(false); }
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
              alt={altText || title || wallpaper.title}
              className="aspect-[9/16] w-full rounded-xl object-cover"
            />
          ) : (
            <div className="aspect-[9/16] w-full rounded-xl bg-surface" />
          )}
          <p className="mt-2 break-all text-xs text-subtle">ID: {wallpaper.id}</p>
        </div>

        <div className="space-y-4">
          <Button type="button" className="w-full" disabled={generatingSeo || !wallpaper.thumbnailUrl} onClick={() => void generateSeo("all")}><Sparkles className="size-4" />{generatingSeo ? "Analyzing wallpaper…" : "Generate SEO"}</Button>
          <label className="block text-sm text-muted">
            <span className="flex items-center justify-between">Title <button type="button" disabled={generatingSeo} onClick={() => void generateSeo("title")} className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg"><RotateCcw className="size-3" /> Regenerate</button></span>
            <Input
              className="mt-1 bg-surface"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setConfirmedConflicts(false); setConflicts([]); }}
              maxLength={60}
              required
            />
            <span className="mt-1 block text-xs text-subtle">{title.length}/60</span>
          </label>

          <label className="block text-sm text-muted">
            <span className="flex items-center justify-between">Description <button type="button" disabled={generatingSeo} onClick={() => void generateSeo("description")} className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg"><RotateCcw className="size-3" /> Regenerate</button></span>
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

          <label className="block text-sm text-muted">
            <span className="flex items-center justify-between">Alt Text <button type="button" disabled={generatingSeo} onClick={() => void generateSeo("altText")} className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg"><RotateCcw className="size-3" /> Regenerate</button></span>
            <textarea
              className="mt-1 min-h-20 w-full resize-y rounded-[12px] bg-surface px-4 py-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              maxLength={180}
              placeholder="Describe only what is visible in the wallpaper"
            />
            <span className="mt-1 block text-xs text-subtle">{altText.length}/180</span>
          </label>

          <label className="block text-sm text-muted">
            <span className="flex items-center justify-between">Primary Keyword <button type="button" disabled={generatingSeo} onClick={() => void generateSeo("primaryKeyword")} className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg"><RotateCcw className="size-3" /> Regenerate</button></span>
            <Input
              className="mt-1 bg-surface"
              value={primaryKeyword}
              onChange={(e) => { setPrimaryKeyword(e.target.value); setConfirmedConflicts(false); setConflicts([]); }}
              maxLength={80}
              placeholder="e.g. minimalist mountain wallpaper"
            />
            <span className="mt-1 block text-xs text-subtle">{primaryKeyword.length}/80</span>
          </label>

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
              <span className="flex items-center justify-between">Tags <button type="button" disabled={generatingSeo} onClick={() => void generateSeo("tags")} className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg"><RotateCcw className="size-3" /> Regenerate</button></span>
              <Input
                className="mt-1 bg-surface"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="minimal, blue, quote"
              />
              <span className="mt-1 block text-xs text-subtle">Up to 18 tags, separated by commas.</span>
            </label>
          </div>

          <div className="rounded-xl bg-surface p-4 text-sm"><p className="font-medium text-fg">SEO quality: {title.trim() && description.trim() && altText.trim() && primaryKeyword.trim() && tags.split(",").filter(Boolean).length >= 8 ? "Good" : "Needs Review"}</p><p className="mt-1 text-muted">Use accurate, complete metadata; keyword repetition is not required.</p></div>
          {conflicts.length ? <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4" role="alert"><p className="flex items-center gap-2 font-medium text-fg"><AlertTriangle className="size-4" /> Possible duplicate SEO</p>{conflicts.map((conflict) => <p key={`${conflict.kind}-${conflict.wallpaperId}`} className="mt-2 text-sm text-muted">{conflict.message}</p>)}</div> : null}

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

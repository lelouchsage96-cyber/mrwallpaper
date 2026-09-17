import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { wallpaperMeta } from "@/lib/seo";
import {
  getOpsWallpaperEdit,
  updateOpsWallpaperMetadata,
  type OpsWallpaperEditData,
} from "@/lib/server/ops-wallpaper-edit";
import type { Category } from "@/lib/types";

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
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [robots, setRobots] = useState<"index" | "noindex">("index");

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
          setSlug(result.wallpaper.slug);
          setSeoTitle(result.wallpaper.seoTitle);
          setSeoDescription(result.wallpaper.seoDescription);
          setAltText(result.wallpaper.altText);
          setRobots(result.wallpaper.robots);
        }
      })
      .catch(() => setMessage("Could not load this wallpaper."))
      .finally(() => setLoading(false));
  }, [id]);

  const categoryName = useMemo(
    () => categories.find((category) => category.id === categoryId)?.name || wallpaper?.categoryName || "Wallpaper",
    [categories, categoryId, wallpaper?.categoryName],
  );

  const searchPreview = useMemo(
    () => wallpaperMeta({
      title,
      categoryName,
      deviceType,
      description,
      seoTitle,
      seoDescription,
    }),
    [title, categoryName, deviceType, description, seoTitle, seoDescription],
  );

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
          slug,
          seoTitle,
          seoDescription,
          altText,
          robots,
        },
      });
      if (!result.ok) {
        const errors: Record<string, string> = {
          category: "Please choose a valid category.",
          slug: "That SEO slug is invalid or already used by another wallpaper.",
          title: "Please enter a valid wallpaper title.",
          missing: "This wallpaper no longer exists.",
        };
        setMessage(errors[result.error] || "Could not save these changes.");
        return;
      }
      const savedSlug = result.slug;
      setSlug(savedSlug);
      setWallpaper((current) => current ? {
        ...current,
        title: title.trim().replace(/^title\s*:\s*/i, ""),
        description: description.trim(),
        categoryId,
        categoryName,
        deviceType,
        status,
        tags: cleanTags,
        slug: savedSlug,
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        altText: altText.trim() || title.trim().replace(/^title\s*:\s*/i, ""),
        robots,
      } : current);
      setMessage("Saved successfully. Slug changes automatically keep a 301 redirect from the old URL.");
    } catch {
      setMessage("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-subtle">Wallpaper</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Edit wallpaper</h1>
          <p className="mt-2 text-sm text-muted">Edit content, search metadata, image text and the canonical wallpaper slug.</p>
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
          <label className="block text-sm text-muted">
            Title
            <Input
              className="mt-1 bg-surface"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              required
            />
            <span className="mt-1 block text-xs text-subtle">{title.length}/60 · Do not add “TITLE:” or keyword stuffing.</span>
          </label>

          <label className="block text-sm text-muted">
            Description
            <textarea
              className="mt-1 min-h-28 w-full resize-y rounded-[12px] bg-surface px-4 py-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={280}
              placeholder="Describe the subject, style, colors and intended screen naturally."
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
                placeholder="minimalist wallpaper, blue aesthetic, motivation"
              />
              <span className="mt-1 block text-xs text-subtle">Up to 8 natural phrases. Tags are no longer cut off at 24 characters.</span>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-elevated p-5">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-widest text-subtle">Search SEO</p>
          <h2 className="mt-1 font-display text-2xl text-fg">Google & image metadata</h2>
          <p className="mt-2 text-sm text-muted">Leave SEO title or description blank to use the site’s optimized automatic fallback.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm text-muted sm:col-span-2">
            SEO slug
            <div className="mt-1 flex items-center rounded-[12px] bg-surface shadow-[var(--shadow-border)] focus-within:ring-2 focus-within:ring-ring">
              <span className="pl-4 text-xs text-subtle">/wallpaper/</span>
              <input
                className="h-11 min-w-0 flex-1 bg-transparent px-2 pr-4 text-sm text-fg outline-none"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                maxLength={96}
                spellCheck={false}
              />
            </div>
            <span className="mt-1 block text-xs text-subtle">Changing this creates a permanent 301 redirect from the old URL.</span>
          </label>

          <label className="block text-sm text-muted sm:col-span-2">
            SEO title override
            <Input
              className="mt-1 bg-surface"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={75}
              placeholder="Optional — automatic title is usually best"
            />
            <span className="mt-1 block text-xs text-subtle">{seoTitle.length}/75</span>
          </label>

          <label className="block text-sm text-muted sm:col-span-2">
            Meta description override
            <textarea
              className="mt-1 min-h-24 w-full resize-y rounded-[12px] bg-surface px-4 py-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={180}
              placeholder="Optional — use only when a custom search description is stronger than the wallpaper description"
            />
            <span className="mt-1 block text-xs text-subtle">{seoDescription.length}/180</span>
          </label>

          <label className="block text-sm text-muted sm:col-span-2">
            Image alt text
            <Input
              className="mt-1 bg-surface"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              maxLength={180}
              placeholder="Concise description of what is actually visible in the wallpaper"
            />
            <span className="mt-1 block text-xs text-subtle">Describe the image; don’t repeat a list of keywords.</span>
          </label>

          <label className="block text-sm text-muted">
            Search visibility
            <select
              className="mt-1 h-11 w-full rounded-[12px] bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
              value={robots}
              onChange={(e) => setRobots(e.target.value as "index" | "noindex")}
            >
              <option value="index">Index in search</option>
              <option value="noindex">Noindex</option>
            </select>
          </label>
        </div>

        <div className="mt-6 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs font-medium uppercase tracking-widest text-subtle">Search preview</p>
          <p className="mt-3 break-words text-lg text-fg">{searchPreview.title}</p>
          <p className="mt-1 break-all text-xs text-subtle">https://mrwallpaper.org/wallpaper/{slug || "wallpaper"}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{searchPreview.description}</p>
          {robots === "noindex" ? (
            <p className="mt-3 text-xs text-subtle">This wallpaper is currently set to noindex and should not appear in search results.</p>
          ) : null}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void save()} disabled={saving || title.trim().length < 2 || !categoryId || slug.trim().length < 2}>
          {saving ? "Saving…" : "Save all changes"}
        </Button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
    </div>
  );
}
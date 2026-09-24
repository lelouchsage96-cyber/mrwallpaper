import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, ImageUp, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getOpsWallpaperEdit,
  replaceOpsWallpaperImage,
  updateOpsWallpaperMetadata,
  type OpsWallpaperEditData,
} from "@/lib/server/ops-wallpaper-edit";
import type { Category } from "@/lib/types";
import { encodePlate } from "@/lib/encode-plate";
import { getBearerToken } from "@/lib/auth/client";
import { sha256Blob } from "@/lib/hash";
import { checkWallpaperSeoConflicts, generateWallpaperSeo, type SeoConflict, type SeoField } from "@/lib/server/ops-upload";

export const Route = createFileRoute("/ops/wallpaper-edit/$id")({ component: EditWallpaperPage });

const statuses = ["draft", "pending", "approved", "rejected", "removed"] as const;

type EncodedReplacement = Awaited<ReturnType<typeof encodePlate>>;

async function putReplacementOriginal(file: File): Promise<string | null> {
  const token = getBearerToken();
  const uploadId = crypto.randomUUID();
  const chunkSize = 2 * 1024 * 1024;
  const count = Math.max(1, Math.ceil(file.size / chunkSize));
  let key: string | null = null;

  for (let i = 0; i < count; i += 1) {
    const blob = file.slice(i * chunkSize, Math.min(file.size, (i + 1) * chunkSize));
    const headers: Record<string, string> = {
      "content-type": "application/octet-stream",
      "x-file-type": file.type || "image/jpeg",
      "x-file-name": encodeURIComponent(file.name || "wallpaper.jpg"),
      "x-upload-id": uploadId,
      "x-chunk-index": String(i),
      "x-chunk-count": String(count),
    };
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch("/api/ops-original", { method: "POST", headers, body: blob });
    if (!response.ok) return null;
    const json = (await response.json()) as { key?: string };
    if (typeof json.key === "string") key = json.key;
  }
  return key;
}

function EditWallpaperPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const replacementFileRef = useRef<HTMLInputElement>(null);
  const seoGenerationPasses = useRef<Record<SeoField, number>>({
    all: 0,
    title: 0,
    description: 0,
    tags: 0,
    altText: 0,
    primaryKeyword: 0,
  });
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
  const [seoFeedback, setSeoFeedback] = useState("");
  const [seoPreview, setSeoPreview] = useState<{ title: string; description: string; tags: string } | null>(null);
  const [conflicts, setConflicts] = useState<SeoConflict[]>([]);
  const [confirmedConflicts, setConfirmedConflicts] = useState(false);
  const [replacement, setReplacement] = useState<EncodedReplacement | null>(null);
  const [replacementSource, setReplacementSource] = useState<File | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [replacingImage, setReplacingImage] = useState(false);

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

  function openReplacementPicker() {
    if (!replacementFileRef.current) return;
    replacementFileRef.current.value = "";
    replacementFileRef.current.click();
  }

  function cancelReplacement() {
    setReplacement(null);
    setReplacementSource(null);
    if (replacementFileRef.current) replacementFileRef.current.value = "";
  }

  async function chooseReplacement(file?: File) {
    if (!file) return;
    setProcessingImage(true);
    setMessage("");
    try {
      const result = await encodePlate(file);
      if (!result.ok) {
        setReplacement(null);
        setReplacementSource(null);
        setMessage("Please use a JPG, PNG or WebP wallpaper within the upload limit.");
        return;
      }
      setReplacement(result);
      setReplacementSource(file);
      setMessage("Replacement ready. Review the preview, then use the new image.");
    } catch (error) {
      console.error("[ops-wallpaper-edit] encode replacement", error);
      setReplacement(null);
      setReplacementSource(null);
      setMessage("Could not process this replacement image.");
    } finally {
      setProcessingImage(false);
    }
  }

  async function replaceImage() {
    if (!replacement?.ok || !replacementSource) {
      setMessage("Choose a replacement image first.");
      return;
    }

    setReplacingImage(true);
    setMessage("Uploading replacement…");
    try {
      const plate = replacement.plate;
      const originalKey = await putReplacementOriginal(plate.file);
      if (!originalKey) {
        setMessage("Original upload failed. Check your R2 configuration and try again.");
        return;
      }

      const attemptId = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
      const form = new FormData();
      form.set("attemptId", attemptId);
      form.set("wallpaperId", id);
      form.set("originalKey", originalKey);
      form.set("preview", plate.previewBlob, "preview.jpg");
      form.set("thumb", plate.thumbBlob, "thumb.jpg");
      form.set("width", String(plate.width));
      form.set("height", String(plate.height));
      form.set("bytes", String(plate.bytes));
      form.set("mime", plate.mime || "image/jpeg");
      form.set("format", plate.mime.includes("png") ? "png" : plate.mime.includes("webp") ? "webp" : "jpg");
      form.set("fileSha256", await sha256Blob(plate.file));
      form.set("sourceSha256", await sha256Blob(replacementSource));

      const result = await replaceOpsWallpaperImage({ data: form });
      if (!result.ok) {
        if (result.error === "duplicate") {
          setMessage("That image is already used by another wallpaper.");
        } else if (result.error === "assets") {
          setMessage("This wallpaper is missing one of its stored image assets, so it was left unchanged.");
        } else if (result.error === "image") {
          setMessage("The replacement image failed validation before it could be saved. Please choose the file again.");
        } else if (result.error === "replace_failed") {
          const label = result.stage === "storage" ? "media storage" : "database update";
          setMessage(`Replacement failed during ${label}. The current wallpaper was left unchanged. Ref: ${attemptId}`);
        } else {
          setMessage(`Could not replace the image. The current wallpaper was left unchanged. Ref: ${attemptId}`);
        }
        return;
      }

      setWallpaper((current) =>
        current
          ? {
              ...current,
              thumbnailUrl: result.thumbnailUrl,
              width: result.width,
              height: result.height,
            }
          : current,
      );
      cancelReplacement();
      setMessage("Image replaced successfully. The wallpaper URL and metadata were preserved.");

      // The replacement has already committed at this point. Refreshing the
      // editor is best-effort only, so a transient follow-up request must never
      // turn a successful replacement into an error message.
      void getOpsWallpaperEdit({ data: { wallpaperId: id } })
        .then((refreshed) => {
          if (refreshed.wallpaper) {
            setWallpaper(refreshed.wallpaper);
            setCategories(refreshed.categories);
          }
        })
        .catch((error) => {
          console.warn("[ops-wallpaper-edit] refresh after replacement", error);
        });
    } catch (error) {
      console.error("[ops-wallpaper-edit] replace image", error);
      setMessage("The replacement request could not be completed. The current wallpaper was left unchanged.");
    } finally {
      setReplacingImage(false);
    }
  }

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
    if (replacement?.ok) return replacement.plate.previewDataUrl;
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
    const variationIndex = seoGenerationPasses.current[field] + 1;
    const regenerate = true;
    seoGenerationPasses.current[field] = variationIndex;
    setGeneratingSeo(true);
    setSeoFeedback("Analyzing wallpaper…");
    setSeoPreview(null);
    setMessage("");
    try {
      const result = await generateWallpaperSeo({ data: {
        imageDataUrl: await imageDataUrl(), title, description, tags, altText, primaryKeyword,
        categoryId, deviceType, width: wallpaper.width, height: wallpaper.height, field,
        regenerate, variationIndex,
      } });
      if (!result.ok) {
        setSeoFeedback(result.error);
        setMessage(result.error);
        return;
      }
      if (field === "all" || field === "title") setTitle(result.seo.title);
      if (field === "all" || field === "description") setDescription(result.seo.description);
      if (field === "all" || field === "tags") setTags(result.seo.tags.join(", "));
      if (field === "all" || field === "altText") setAltText(result.seo.altText);
      if (field === "all" || field === "primaryKeyword") setPrimaryKeyword(result.seo.primaryKeyword);
      if (field === "all") setCategoryId(result.seo.categoryId);
      setConflicts([]);
      setConfirmedConflicts(false);
      if (field === "all") {
        setSeoPreview({
          title: result.seo.title,
          description: result.seo.description,
          tags: result.seo.tags.join(", "),
        });
      }
      const successMessage =
        field === "all"
          ? "SEO regenerated and applied below. Review and save when ready."
          : "Field regenerated and applied below. Review and save when ready.";
      setSeoFeedback(successMessage);
      setMessage(successMessage);
    } catch (error) {
      const failureMessage = error instanceof Error ? error.message : "SEO generation failed. Please try again.";
      setSeoFeedback(failureMessage);
      setMessage(failureMessage);
    } finally { setGeneratingSeo(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-subtle">Wallpaper</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Edit wallpaper</h1>
          <p className="mt-2 text-sm text-muted">Update metadata or safely replace the uploaded image without changing this wallpaper’s URL.</p>
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
          <input
            ref={replacementFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(event) => void chooseReplacement(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full"
            disabled={processingImage || replacingImage}
            onClick={openReplacementPicker}
          >
            <ImageUp className="size-4" />
            {processingImage ? "Preparing…" : replacement?.ok ? "Choose another" : "Replace image"}
          </Button>
          {replacement?.ok ? (
            <div className="mt-4 rounded-xl bg-surface p-3">
              <p className="text-xs font-medium uppercase tracking-widest text-subtle">New image</p>
              <img
                src={replacement.plate.previewDataUrl}
                alt="Replacement wallpaper preview"
                className="mt-2 aspect-[9/16] w-full rounded-lg object-cover"
              />
              <p className="mt-2 text-xs text-subtle">
                {replacement.plate.width} × {replacement.plate.height}
              </p>
              <Button
                type="button"
                className="mt-3 w-full"
                disabled={replacingImage}
                onClick={() => void replaceImage()}
              >
                {replacingImage ? "Replacing…" : "Use this image"}
              </Button>
              <button
                type="button"
                className="mt-2 min-h-11 w-full text-sm text-muted hover:text-fg"
                disabled={replacingImage}
                onClick={cancelReplacement}
              >
                Cancel replacement
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-5 text-subtle">
              JPG, PNG or WebP. Replacing the image keeps the same post, URL, views, likes and SEO metadata.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Button type="button" className="w-full" disabled={generatingSeo || processingImage || replacingImage || (!wallpaper.thumbnailUrl && !replacement?.ok)} onClick={() => void generateSeo("all")}><Sparkles className="size-4" />{generatingSeo ? "Analyzing wallpaper…" : "Generate SEO"}</Button>
          {seoFeedback ? <p className="text-sm text-muted" aria-live="polite">{seoFeedback}</p> : null}
          {seoPreview ? (
            <div className="rounded-xl bg-surface p-4" aria-live="polite">
              <p className="flex items-center gap-2 text-sm font-medium text-fg">
                <Check className="size-4 text-success" aria-hidden="true" />
                Generated SEO applied
              </p>
              <p className="mt-2 text-base font-medium text-fg">{seoPreview.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{seoPreview.description}</p>
              <p className="mt-3 text-xs text-subtle">{seoPreview.tags}</p>
            </div>
          ) : null}
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
            <Button onClick={() => void save()} disabled={saving || replacingImage || title.trim().length < 2 || !categoryId}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {message ? <p className="text-sm text-muted">{message}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

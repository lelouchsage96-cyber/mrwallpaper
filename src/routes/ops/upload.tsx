import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, Cloud, RotateCcw, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encodePlate } from "@/lib/encode-plate";
import { getBearerToken } from "@/lib/auth/client";
import { sha256Blob } from "@/lib/hash";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import { checkWallpaperSeoConflicts, generateWallpaperSeo, getOpsUploadMeta, uploadOpsWallpaper, type SeoConflict, type SeoField } from "@/lib/server/ops-upload";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/ops/upload")({ component: OpsUploadPage });

type Encoded = Awaited<ReturnType<typeof encodePlate>>;

async function putOriginal(file: File): Promise<string | null> {
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
    const res = await fetch("/api/ops-original", { method: "POST", headers, body: blob });
    if (!res.ok) return null;
    const json = (await res.json()) as { key?: string };
    if (typeof json.key === "string") key = json.key;
  }
  return key;
}

function OpsUploadPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const seoGenerationPasses = useRef<Record<SeoField, number>>({
    all: 0,
    title: 0,
    description: 0,
    tags: 0,
    altText: 0,
    primaryKeyword: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [encoded, setEncoded] = useState<Encoded | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [altText, setAltText] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType>("phone");
  const [busy, setBusy] = useState(false);
  const [generatingSeo, setGeneratingSeo] = useState(false);
  const [seoPreview, setSeoPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<SeoConflict[]>([]);
  const [confirmedConflicts, setConfirmedConflicts] = useState(false);

  useEffect(() => {
    void getOpsUploadMeta()
      .then((r) => {
        setCategories(r.categories);
        setCategoryId(r.categories[0]?.id ?? "");
      })
      .catch(() => setMessage("Could not load categories."));
  }, []);

  async function choose(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await encodePlate(file);
      setEncoded(result);
      if (!result.ok) {
        setSourceFile(null);
        setPreview(null);
        setMessage("Please use a JPG, PNG or WebP wallpaper within the upload limit.");
        return;
      }
      setSourceFile(file);
      setPreview(result.plate.previewDataUrl);
      setDeviceType(inferDeviceType(result.plate.width, result.plate.height));
      if (!title.trim()) {
        const stem = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        if (stem) setTitle(stem.slice(0, 60));
      }
    } catch (err) {
      console.error("[ops-upload] encode", err);
      setMessage("Could not process this image.");
    } finally {
      setBusy(false);
    }
  }

  async function generateSeo(field: SeoField = "all") {
    if (!encoded?.ok) {
      setMessage("Choose a wallpaper before generating SEO.");
      return;
    }
    setGeneratingSeo(true);
    setSeoPreview(false);
    setMessage(null);
    try {
      const result = await generateWallpaperSeo({
        data: {
          imageDataUrl: encoded.plate.previewDataUrl,
          title,
          description,
          tags,
          altText,
          primaryKeyword,
          categoryId,
          deviceType,
          width: encoded.plate.width,
          height: encoded.plate.height,
          field,
          regenerate,
          variationIndex,
        },
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (field === "all" || field === "title") setTitle(result.seo.title);
      if (field === "all" || field === "description") setDescription(result.seo.description);
      if (field === "all" || field === "tags") setTags(result.seo.tags.join(", "));
      if (field === "all" || field === "altText") setAltText(result.seo.altText);
      if (field === "all" || field === "primaryKeyword") setPrimaryKeyword(result.seo.primaryKeyword);
      if (field === "all") setCategoryId(result.seo.categoryId);
      setSeoPreview(true);
      setConflicts([]);
      setConfirmedConflicts(false);
    } catch (err) {
      console.error("[ops-upload] generate SEO", err);
      setMessage("SEO generation failed. Please try again.");
    } finally {
      setGeneratingSeo(false);
    }
  }

  async function submit() {
    if (!encoded?.ok || !sourceFile) {
      setMessage("Choose a wallpaper first.");
      return;
    }
    if (title.trim().length < 2 || !categoryId) {
      setMessage("Add a title and category.");
      return;
    }

    if (!confirmedConflicts) {
      const check = await checkWallpaperSeoConflicts({ data: { title, primaryKeyword } });
      setConflicts(check.conflicts);
      if (check.conflicts.length) {
        setMessage("Review the possible duplicate SEO below, then publish again if it is intentional.");
        setConfirmedConflicts(true);
        return;
      }
    }

    setBusy(true);
    setMessage("Uploading…");
    try {
      const plate = encoded.plate;
      const originalKey = await putOriginal(plate.file);
      if (!originalKey) {
        setMessage("Original upload failed. Check your R2 configuration and try again.");
        return;
      }

      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("categoryId", categoryId);
      fd.set("tags", tags);
      fd.set("altText", altText.trim());
      fd.set("primaryKeyword", primaryKeyword.trim());
      fd.set("deviceType", deviceType);
      fd.set("originalKey", originalKey);
      fd.set("preview", plate.previewBlob, "preview.jpg");
      fd.set("thumb", plate.thumbBlob, "thumb.jpg");
      fd.set("width", String(plate.width));
      fd.set("height", String(plate.height));
      fd.set("bytes", String(plate.bytes));
      fd.set("mime", plate.mime || "image/jpeg");
      fd.set("format", plate.mime.includes("png") ? "png" : plate.mime.includes("webp") ? "webp" : "jpg");
      fd.set("fileSha256", await sha256Blob(plate.file));
      fd.set("sourceSha256", await sha256Blob(sourceFile));

      const result = await uploadOpsWallpaper({ data: fd });
      if (!result.ok) {
        setMessage(result.error === "duplicate" ? "This wallpaper is already in the catalog." : "Upload failed. Please try again.");
        return;
      }
      setMessage("Published successfully.");
      void navigate({ to: "/ops/wallpapers" });
    } catch (err) {
      console.error("[ops-upload] submit", err);
      setMessage("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">Admin</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Add wallpaper</h1>
          <p className="mt-2 text-sm text-muted">Upload once. The original goes to R2 and the wallpaper is published as free.</p>
        </div>
        <Link
          to="/ops/import-r2"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-elevated px-4 text-sm text-fg hover:opacity-90"
        >
          <Cloud className="size-4" />
          Import existing from R2
        </Link>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(e) => void choose(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex min-h-64 w-full items-center justify-center overflow-hidden rounded-2xl bg-elevated"
      >
        {preview ? (
          <img src={preview} alt="Selected wallpaper preview" className="max-h-[32rem] w-full object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-sm text-muted">
            <Upload className="size-7" />
            Choose JPG, PNG or WebP
          </span>
        )}
      </button>

      <section className="rounded-2xl bg-elevated p-4 shadow-[var(--shadow-border)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-medium text-fg">
              <Sparkles className="size-4" aria-hidden="true" />
              Generate SEO
            </h2>
            <p className="mt-1 text-sm text-muted">Analyze the wallpaper and fill the practical publishing fields below.</p>
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!encoded?.ok || busy || generatingSeo}
            onClick={() => void generateSeo("all")}
          >
            <Sparkles className="size-4" />
            {generatingSeo ? "Analyzing wallpaper…" : "Generate SEO"}
          </Button>
        </div>

        {seoPreview ? (
          <div className="mt-4 rounded-xl bg-surface p-4" aria-live="polite">
            <p className="flex items-center gap-2 text-sm font-medium text-fg">
              <Check className="size-4 text-success" aria-hidden="true" />
              SEO Preview
            </p>
            <p className="mt-2 text-base font-medium text-fg">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
            <p className="mt-3 text-xs text-subtle">{tags}</p>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-muted sm:col-span-2">
          <span className="flex items-center justify-between">Title <button type="button" className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg" disabled={generatingSeo || !encoded?.ok} onClick={() => void generateSeo("title")}><RotateCcw className="size-3" /> Regenerate</button></span>
          <Input className="mt-1" value={title} onChange={(e) => { setTitle(e.target.value); setConfirmedConflicts(false); setConflicts([]); }} maxLength={60} />
          <span className="mt-1 block text-xs text-subtle">{title.length}/60 · Aim for 4–10 descriptive words.</span>
        </label>

        <label className="text-sm text-muted">
          Category
          <select
            className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>

        <label className="text-sm text-muted">
          Device
          <select
            className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value as DeviceType)}
          >
            <option value="phone">Phone</option>
            <option value="tablet">Tablet</option>
            <option value="both">Phone + tablet</option>
          </select>
        </label>

        <label className="text-sm text-muted sm:col-span-2">
          <span className="flex items-center justify-between">Tags <button type="button" className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg" disabled={generatingSeo || !encoded?.ok} onClick={() => void generateSeo("tags")}><RotateCcw className="size-3" /> Regenerate</button></span>
          <Input className="mt-1" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="minimal, dark, motivational" />
        </label>

        <label className="text-sm text-muted sm:col-span-2">
          <span className="flex items-center justify-between">Description <button type="button" className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg" disabled={generatingSeo || !encoded?.ok} onClick={() => void generateSeo("description")}><RotateCcw className="size-3" /> Regenerate</button></span>
          <textarea
            className="mt-1 min-h-24 w-full rounded-md bg-surface p-3 text-sm text-fg shadow-[var(--shadow-border)]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
          />
          <span className="mt-1 block text-xs text-subtle">{description.length}/280 · One or two natural sentences.</span>
        </label>

        <label className="text-sm text-muted sm:col-span-2">
          <span className="flex items-center justify-between">Alt Text <button type="button" className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg" disabled={generatingSeo || !encoded?.ok} onClick={() => void generateSeo("altText")}><RotateCcw className="size-3" /> Regenerate</button></span>
          <textarea
            className="mt-1 min-h-20 w-full rounded-md bg-surface p-3 text-sm text-fg shadow-[var(--shadow-border)]"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            maxLength={180}
            placeholder="Describe only what is visible in the wallpaper"
          />
        </label>

        <label className="text-sm text-muted sm:col-span-2">
          <span className="flex items-center justify-between">Primary Keyword <button type="button" className="inline-flex items-center gap-1 text-xs text-subtle hover:text-fg" disabled={generatingSeo || !encoded?.ok} onClick={() => void generateSeo("primaryKeyword")}><RotateCcw className="size-3" /> Regenerate</button></span>
          <Input
            className="mt-1"
            value={primaryKeyword}
            onChange={(e) => { setPrimaryKeyword(e.target.value); setConfirmedConflicts(false); setConflicts([]); }}
            maxLength={80}
            placeholder="e.g. minimalist mountain wallpaper"
          />
        </label>
      </div>

      <div className="rounded-xl bg-elevated p-4 text-sm">
        <p className="font-medium text-fg">SEO quality: {title.trim() && description.trim() && altText.trim() && primaryKeyword.trim() && tags.split(",").filter(Boolean).length >= 8 ? "Good" : "Needs Review"}</p>
        <p className="mt-1 text-muted">Complete, relevant metadata is enough—no artificial word count or keyword repetition is required.</p>
      </div>

      {conflicts.length ? <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4" role="alert"><p className="flex items-center gap-2 font-medium text-fg"><AlertTriangle className="size-4" /> Possible duplicate SEO</p>{conflicts.map((conflict) => <p key={`${conflict.kind}-${conflict.wallpaperId}`} className="mt-2 text-sm text-muted">{conflict.message}</p>)}</div> : null}

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={busy || !encoded?.ok || title.trim().length < 2 || !categoryId} onClick={() => void submit()}>
          {busy ? "Working…" : "Publish free wallpaper"}
        </Button>
        <Button variant="secondary" onClick={() => void navigate({ to: "/ops/wallpapers" })}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

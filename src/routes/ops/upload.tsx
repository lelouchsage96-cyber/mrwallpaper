import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encodePlate } from "@/lib/encode-plate";
import { getBearerToken } from "@/lib/auth/client";
import { sha256Blob } from "@/lib/hash";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import { getOpsUploadMeta, uploadOpsWallpaper } from "@/lib/server/ops-upload";
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [encoded, setEncoded] = useState<Encoded | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType>("phone");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  async function submit() {
    if (!encoded?.ok || !sourceFile) {
      setMessage("Choose a wallpaper first.");
      return;
    }
    if (title.trim().length < 2 || !categoryId) {
      setMessage("Add a title and category.");
      return;
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
      <div>
        <p className="text-xs font-medium tracking-widest text-subtle uppercase">Admin</p>
        <h1 className="mt-1 font-display text-4xl text-fg">Add wallpaper</h1>
        <p className="mt-2 text-sm text-muted">Upload once. The original goes to R2 and the wallpaper is published as free.</p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-muted sm:col-span-2">
          Title
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
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
          Tags <span className="text-subtle">(comma separated)</span>
          <Input className="mt-1" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="minimal, dark, motivational" />
        </label>

        <label className="text-sm text-muted sm:col-span-2">
          Description
          <textarea
            className="mt-1 min-h-24 w-full rounded-md bg-surface p-3 text-sm text-fg shadow-[var(--shadow-border)]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
          />
        </label>
      </div>

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

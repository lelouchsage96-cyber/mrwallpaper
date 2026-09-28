import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  Images,
  LoaderCircle,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBearerToken } from "@/lib/auth/client";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import { encodePlate } from "@/lib/encode-plate";
import { sha256Blob } from "@/lib/hash";
import {
  checkWallpaperSeoConflicts,
  generateWallpaperSeo,
  getOpsUploadMeta,
  uploadOpsWallpaper,
  type CatalogContentType,
} from "@/lib/server/ops-upload";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/ops/bulk-upload")({ component: OpsBulkUploadPage });

const MAX_BATCH = 20;

type Encoded = Awaited<ReturnType<typeof encodePlate>>;
type ItemStatus = "processing" | "ready" | "seo" | "publishing" | "published" | "error";

type BatchItem = {
  id: string;
  file: File;
  encoded: Encoded | null;
  selected: boolean;
  title: string;
  description: string;
  categoryId: string;
  tags: string;
  altText: string;
  primaryKeyword: string;
  deviceType: DeviceType;
  contentType: CatalogContentType;
  status: ItemStatus;
  message: string | null;
  allowSeoConflict: boolean;
  slug: string | null;
};

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
    const response = await fetch("/api/ops-original", { method: "POST", headers, body: blob });
    if (!response.ok) return null;
    const json = (await response.json()) as { key?: string };
    if (typeof json.key === "string") key = json.key;
  }

  return key;
}

function filenameTitle(file: File): string {
  return file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function OpsBulkUploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [batchCategoryId, setBatchCategoryId] = useState("");
  const [batchDevice, setBatchDevice] = useState<"auto" | DeviceType>("auto");
  const [batchContentType, setBatchContentType] = useState<CatalogContentType>("wallpaper");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void getOpsUploadMeta()
      .then((result) => {
        const firstCategoryId = result.categories[0]?.id ?? "";
        setCategories(result.categories);
        setBatchCategoryId(firstCategoryId);
        if (firstCategoryId) {
          setItems((current) =>
            current.map((item) => (item.categoryId ? item : { ...item, categoryId: firstCategoryId })),
          );
        }
      })
      .catch(() => setMessage("Could not load upload settings."));
  }, []);

  function updateItem(id: string, patch: Partial<BatchItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files).slice(0, Math.max(0, MAX_BATCH - items.length));
    if (!incoming.length) return;

    setWorking(true);
    setMessage(null);

    for (const file of incoming) {
      const id = crypto.randomUUID();
      const initial: BatchItem = {
        id,
        file,
        encoded: null,
        selected: true,
        title: filenameTitle(file),
        description: "",
        categoryId: batchCategoryId || categories[0]?.id || "",
        tags: "",
        altText: "",
        primaryKeyword: "",
        deviceType: "phone",
        contentType: batchContentType,
        status: "processing",
        message: null,
        allowSeoConflict: false,
        slug: null,
      };

      setItems((current) => [...current, initial]);

      try {
        const encoded = await encodePlate(file);
        if (!encoded.ok) {
          updateItem(id, {
            encoded,
            status: "error",
            selected: false,
            message: "Use a JPG, PNG or WebP wallpaper within the upload limit.",
          });
          continue;
        }
        updateItem(id, {
          encoded,
          status: "ready",
          deviceType:
            batchDevice === "auto"
              ? inferDeviceType(encoded.plate.width, encoded.plate.height)
              : batchDevice,
          ...(batchContentType === "pfp" &&
          (encoded.plate.width / encoded.plate.height < 0.98 ||
            encoded.plate.width / encoded.plate.height > 1.02)
            ? {
                status: "error" as const,
                selected: false,
                message: "PFPs should be square (1:1). Choose a square image or mark this item as Wallpaper.",
              }
            : {}),
        });
      } catch {
        updateItem(id, {
          status: "error",
          selected: false,
          message: "Could not process this image.",
        });
      }
    }

    setWorking(false);
    if (incoming.length < Array.from(files).length) {
      setMessage(`A batch can contain up to ${MAX_BATCH} wallpapers. Extra files were not added.`);
    }
  }

  async function generateSeoFor(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item?.encoded?.ok || item.status === "published") return false;

    updateItem(id, { status: "seo", message: null });
    try {
      const result = await generateWallpaperSeo({
        data: {
          imageDataUrl: item.encoded.plate.previewDataUrl,
          title: item.title,
          description: item.description,
          tags: item.tags,
          altText: item.altText,
          primaryKeyword: item.primaryKeyword,
          categoryId: item.categoryId,
          deviceType: item.deviceType,
          width: item.encoded.plate.width,
          height: item.encoded.plate.height,
          field: "all",
          regenerate: false,
          variationIndex: 1,
          contentType: item.contentType,
        },
      });

      if (!result.ok) {
        updateItem(id, { status: "error", message: result.error });
        return false;
      }

      updateItem(id, {
        title: result.seo.title,
        description: result.seo.description,
        tags: result.seo.tags.join(", "),
        altText: result.seo.altText,
        primaryKeyword: result.seo.primaryKeyword,
        categoryId: result.seo.categoryId,
        status: "ready",
        message: "SEO generated",
        allowSeoConflict: false,
      });
      return true;
    } catch {
      updateItem(id, { status: "error", message: "SEO generation failed." });
      return false;
    }
  }

  async function generateSelectedSeo() {
    const targets = items.filter(
      (item) => item.selected && item.encoded?.ok && item.status !== "published",
    );
    if (!targets.length) {
      setMessage("Select at least one ready wallpaper.");
      return;
    }

    setWorking(true);
    setMessage(`Generating SEO for ${targets.length} wallpaper${targets.length === 1 ? "" : "s"}…`);
    let completed = 0;
    for (const item of targets) {
      if (await generateSeoFor(item.id)) completed += 1;
    }
    setWorking(false);
    setMessage(`SEO generated for ${completed} of ${targets.length} selected wallpapers.`);
  }

  async function publishOne(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item?.encoded?.ok || item.status === "published") return false;
    if (item.title.trim().length < 2 || !item.categoryId) {
      updateItem(id, { status: "error", message: "Add a title and category before publishing." });
      return false;
    }

    if (!item.allowSeoConflict) {
      const check = await checkWallpaperSeoConflicts({
        data: {
          title: item.title,
          primaryKeyword: item.primaryKeyword,
          contentType: item.contentType,
        },
      });
      if (check.conflicts.length) {
        updateItem(id, {
          status: "error",
          message: `${check.conflicts[0].message} Review it or allow this SEO conflict.`,
        });
        return false;
      }
    }

    updateItem(id, { status: "publishing", message: "Uploading…" });

    try {
      const plate = item.encoded.plate;
      const originalKey = await putOriginal(plate.file);
      if (!originalKey) {
        updateItem(id, { status: "error", message: "Original upload failed." });
        return false;
      }

      const form = new FormData();
      form.set("title", item.title.trim());
      form.set("description", item.description.trim());
      form.set("categoryId", item.categoryId);
      form.set("tags", item.tags);
      form.set("altText", item.altText.trim());
      form.set("primaryKeyword", item.primaryKeyword.trim());
      form.set("deviceType", item.deviceType);
      form.set("contentType", item.contentType);
      form.set("originalKey", originalKey);
      form.set("preview", plate.previewBlob, "preview.jpg");
      form.set("thumb", plate.thumbBlob, "thumb.jpg");
      form.set("width", String(plate.width));
      form.set("height", String(plate.height));
      form.set("bytes", String(plate.bytes));
      form.set("mime", plate.mime || "image/jpeg");
      form.set(
        "format",
        plate.mime.includes("png") ? "png" : plate.mime.includes("webp") ? "webp" : "jpg",
      );
      form.set("fileSha256", await sha256Blob(plate.file));
      form.set("sourceSha256", await sha256Blob(item.file));

      const result = await uploadOpsWallpaper({ data: form });
      if (!result.ok) {
        updateItem(id, {
          status: "error",
          message:
            result.error === "duplicate"
              ? "This image is already in the catalog."
              : result.error === "pfp_shape"
                ? "PFPs should be square (1:1)."
                : "Upload failed. Review this item and try again.",
        });
        return false;
      }

      updateItem(id, {
        status: "published",
        selected: false,
        message: "Published",
        slug: result.slug,
      });
      return true;
    } catch {
      updateItem(id, { status: "error", message: "Upload failed. Please try again." });
      return false;
    }
  }

  async function publishSelected() {
    const targets = items.filter(
      (item) => item.selected && item.encoded?.ok && item.status !== "published",
    );
    if (!targets.length) {
      setMessage("Select at least one ready wallpaper.");
      return;
    }

    setWorking(true);
    setMessage(`Publishing ${targets.length} wallpaper${targets.length === 1 ? "" : "s"}…`);
    let published = 0;
    for (const item of targets) {
      if (await publishOne(item.id)) published += 1;
    }
    setWorking(false);
    setMessage(
      published === targets.length
        ? `Published all ${published} selected wallpapers.`
        : `Published ${published} of ${targets.length}. Review the items that need attention.`,
    );
  }

  function applyCategory() {
    if (!batchCategoryId) return;
    setItems((current) =>
      current.map((item) =>
        item.selected && item.status !== "published"
          ? { ...item, categoryId: batchCategoryId, allowSeoConflict: false }
          : item,
      ),
    );
  }

  function applyContentType() {
    setItems((current) =>
      current.map((item) => {
        if (!item.selected || item.status === "published") return item;
        if (batchContentType === "pfp" && item.encoded?.ok) {
          const ratio = item.encoded.plate.width / item.encoded.plate.height;
          if (ratio < 0.98 || ratio > 1.02) {
            return {
              ...item,
              contentType: "pfp" as const,
              status: "error" as const,
              selected: false,
              message: "PFPs should be square (1:1). Choose a square image or mark this item as Wallpaper.",
            };
          }
        }
        return {
          ...item,
          contentType: batchContentType,
          status: item.status === "error" ? "ready" as const : item.status,
          message: null,
          allowSeoConflict: false,
        };
      }),
    );
  }

  function applyDevice() {
    setItems((current) =>
      current.map((item) => {
        if (!item.selected || item.status === "published" || !item.encoded?.ok) return item;
        return {
          ...item,
          deviceType:
            batchDevice === "auto"
              ? inferDeviceType(item.encoded.plate.width, item.encoded.plate.height)
              : batchDevice,
        };
      }),
    );
  }

  const selectedCount = items.filter((item) => item.selected).length;
  const publishedCount = items.filter((item) => item.status === "published").length;
  const readyCount = items.filter((item) => item.encoded?.ok && item.status !== "published").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-subtle uppercase">Admin</p>
          <h1 className="mt-1 font-display text-4xl text-fg">Bulk upload</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Prepare, review and publish up to {MAX_BATCH} wallpapers or PFPs in one batch. Nothing publishes
            until you choose Publish selected.
          </p>
        </div>
        <Link
          to="/ops/upload"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-elevated px-4 text-sm text-fg hover:opacity-90"
        >
          Single upload
        </Link>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files;
          if (files) void addFiles(files);
          event.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        disabled={working || items.length >= MAX_BATCH}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-44 w-full items-center justify-center rounded-2xl border border-dashed border-border bg-elevated/60 px-6 text-center transition hover:bg-elevated disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex flex-col items-center gap-2 text-sm text-muted">
          <Images className="size-8" />
          <span className="font-medium text-fg">Choose multiple images</span>
          <span>JPG, PNG or WebP · {items.length}/{MAX_BATCH} added</span>
        </span>
      </button>

      {items.length ? (
        <>
          <section className="rounded-2xl bg-elevated p-4 shadow-[var(--shadow-border)] sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
              <label className="text-sm text-muted">
                Category for selected
                <select
                  className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                  value={batchCategoryId}
                  onChange={(event) => setBatchCategoryId(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-muted">
                Content type for selected
                <select
                  className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                  value={batchContentType}
                  onChange={(event) => setBatchContentType(event.target.value as CatalogContentType)}
                >
                  <option value="wallpaper">Wallpaper</option>
                  <option value="pfp">PFP / profile picture</option>
                </select>
              </label>

              <label className="text-sm text-muted">
                Device for selected
                <select
                  className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                  value={batchDevice}
                  onChange={(event) => setBatchDevice(event.target.value as "auto" | DeviceType)}
                >
                  <option value="auto">Auto detect</option>
                  <option value="phone">Phone</option>
                  <option value="tablet">Tablet</option>
                  <option value="both">Phone + tablet</option>
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={working || !selectedCount} onClick={applyCategory}>
                  Apply category
                </Button>
                <Button variant="secondary" disabled={working || !selectedCount} onClick={applyContentType}>
                  Apply type
                </Button>
                <Button variant="secondary" disabled={working || !selectedCount} onClick={applyDevice}>
                  Apply device
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Button
                variant="secondary"
                disabled={working}
                onClick={() =>
                  setItems((current) =>
                    current.map((item) =>
                      item.status === "published" ? item : { ...item, selected: true },
                    ),
                  )
                }
              >
                Select all
              </Button>
              <Button
                variant="ghost"
                disabled={working}
                onClick={() =>
                  setItems((current) => current.map((item) => ({ ...item, selected: false })))
                }
              >
                Clear selection
              </Button>
              <Button
                variant="secondary"
                disabled={working || !selectedCount}
                onClick={() => void generateSelectedSeo()}
              >
                <Sparkles className="size-4" />
                Generate SEO for selected
              </Button>
              <Button
                disabled={working || !selectedCount}
                onClick={() => void publishSelected()}
              >
                <Upload className="size-4" />
                Publish selected
              </Button>
              <p className="ml-auto text-xs text-subtle">
                {selectedCount} selected · {readyCount} ready · {publishedCount} published
              </p>
            </div>
          </section>

          {message ? (
            <div className="rounded-xl bg-elevated px-4 py-3 text-sm text-muted" aria-live="polite">
              {message}
            </div>
          ) : null}

          <div className="space-y-4">
            {items.map((item, index) => {
              const plate = item.encoded?.ok ? item.encoded.plate : null;
              const busyItem = item.status === "processing" || item.status === "seo" || item.status === "publishing";
              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-elevated p-4 shadow-[var(--shadow-border)] sm:p-5"
                >
                  <div className="grid gap-5 lg:grid-cols-[150px_minmax(0,1fr)]">
                    <div>
                      <label className="flex items-center gap-2 text-sm text-fg">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          disabled={item.status === "published" || working}
                          onChange={(event) => updateItem(item.id, { selected: event.target.checked })}
                        />
                        Wallpaper {index + 1}
                      </label>
                      <div className="mt-3 overflow-hidden rounded-xl bg-surface">
                        {plate ? (
                          <img
                            src={plate.previewDataUrl}
                            alt=""
                            className={item.contentType === "pfp" ? "aspect-square w-full object-cover" : "aspect-[9/16] w-full object-cover"}
                          />
                        ) : (
                          <div className="grid aspect-[9/16] place-items-center text-xs text-subtle">
                            {item.status === "processing" ? "Processing…" : "No preview"}
                          </div>
                        )}
                      </div>
                      {plate ? (
                        <p className="mt-2 text-xs text-subtle">
                          {plate.width} × {plate.height}
                        </p>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          {item.status === "published" ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <Check className="size-3.5" /> Published
                            </span>
                          ) : busyItem ? (
                            <span className="inline-flex items-center gap-1 text-muted">
                              <LoaderCircle className="size-3.5 animate-spin" />
                              {item.status === "seo"
                                ? "Generating SEO"
                                : item.status === "publishing"
                                  ? "Publishing"
                                  : "Processing"}
                            </span>
                          ) : item.status === "error" ? (
                            <span className="inline-flex items-center gap-1 text-danger">
                              <AlertTriangle className="size-3.5" /> Needs attention
                            </span>
                          ) : (
                            <span className="text-muted">Ready for review</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.slug ? (
                            <a
                              href={item.contentType === "pfp" ? `/pfp/${item.slug}` : `/wallpaper/${item.slug}`}
                              className="text-xs text-muted hover:text-fg"
                            >
                              View
                            </a>
                          ) : null}
                          <button
                            type="button"
                            aria-label="Remove wallpaper from batch"
                            disabled={working || item.status === "published"}
                            className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-fg disabled:opacity-40"
                            onClick={() =>
                              setItems((current) => current.filter((entry) => entry.id !== item.id))
                            }
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm text-muted sm:col-span-2">
                          Title
                          <Input
                            className="mt-1"
                            value={item.title}
                            maxLength={60}
                            disabled={item.status === "published"}
                            onChange={(event) =>
                              updateItem(item.id, {
                                title: event.target.value,
                                allowSeoConflict: false,
                                status: item.status === "error" ? "ready" : item.status,
                                message: null,
                              })
                            }
                          />
                        </label>

                        <label className="text-sm text-muted">
                          Category
                          <select
                            className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                            value={item.categoryId}
                            disabled={item.status === "published"}
                            onChange={(event) =>
                              updateItem(item.id, {
                                categoryId: event.target.value,
                                status: item.status === "error" ? "ready" : item.status,
                                message: null,
                              })
                            }
                          >
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="text-sm text-muted">
                          Content type
                          <select
                            className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                            value={item.contentType}
                            disabled={item.status === "published"}
                            onChange={(event) => {
                              const contentType = event.target.value as CatalogContentType;
                              if (contentType === "pfp" && item.encoded?.ok) {
                                const ratio = item.encoded.plate.width / item.encoded.plate.height;
                                if (ratio < 0.98 || ratio > 1.02) {
                                  updateItem(item.id, {
                                    contentType,
                                    status: "error",
                                    selected: false,
                                    message: "PFPs should be square (1:1).",
                                  });
                                  return;
                                }
                              }
                              updateItem(item.id, {
                                contentType,
                                status: item.status === "error" ? "ready" : item.status,
                                message: null,
                                allowSeoConflict: false,
                              });
                            }}
                          >
                            <option value="wallpaper">Wallpaper</option>
                            <option value="pfp">PFP / profile picture</option>
                          </select>
                        </label>

                        <label className="text-sm text-muted">
                          Device
                          <select
                            className="mt-1 h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)]"
                            value={item.deviceType}
                            disabled={item.status === "published"}
                            onChange={(event) =>
                              updateItem(item.id, { deviceType: event.target.value as DeviceType })
                            }
                          >
                            <option value="phone">Phone</option>
                            <option value="tablet">Tablet</option>
                            <option value="both">Phone + tablet</option>
                          </select>
                        </label>

                        <label className="text-sm text-muted sm:col-span-2">
                          Description
                          <textarea
                            className="mt-1 min-h-20 w-full rounded-md bg-surface p-3 text-sm text-fg shadow-[var(--shadow-border)]"
                            value={item.description}
                            maxLength={280}
                            disabled={item.status === "published"}
                            onChange={(event) =>
                              updateItem(item.id, { description: event.target.value })
                            }
                          />
                        </label>

                        <label className="text-sm text-muted sm:col-span-2">
                          Tags
                          <Input
                            className="mt-1"
                            value={item.tags}
                            disabled={item.status === "published"}
                            onChange={(event) => updateItem(item.id, { tags: event.target.value })}
                            placeholder="minimal, dark, motivational"
                          />
                        </label>

                        <label className="text-sm text-muted">
                          Primary keyword
                          <Input
                            className="mt-1"
                            value={item.primaryKeyword}
                            maxLength={80}
                            disabled={item.status === "published"}
                            onChange={(event) =>
                              updateItem(item.id, {
                                primaryKeyword: event.target.value,
                                allowSeoConflict: false,
                                status: item.status === "error" ? "ready" : item.status,
                                message: null,
                              })
                            }
                          />
                        </label>

                        <label className="text-sm text-muted">
                          Alt text
                          <Input
                            className="mt-1"
                            value={item.altText}
                            maxLength={180}
                            disabled={item.status === "published"}
                            onChange={(event) => updateItem(item.id, { altText: event.target.value })}
                          />
                        </label>
                      </div>

                      {item.message ? (
                        <div
                          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                            item.status === "error"
                              ? "bg-danger/10 text-danger"
                              : "bg-surface text-muted"
                          }`}
                        >
                          {item.message}
                        </div>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          disabled={working || busyItem || !plate || item.status === "published"}
                          onClick={() => void generateSeoFor(item.id)}
                        >
                          <Sparkles className="size-4" />
                          Generate SEO
                        </Button>
                        <Button
                          disabled={working || busyItem || !plate || item.status === "published"}
                          onClick={() => void (async () => {
                            setWorking(true);
                            await publishOne(item.id);
                            setWorking(false);
                          })()}
                        >
                          <Upload className="size-4" />
                          Publish
                        </Button>
                        {item.status === "error" && item.message?.includes("allow this SEO conflict") ? (
                          <Button
                            variant="ghost"
                            disabled={working}
                            onClick={() =>
                              updateItem(item.id, {
                                allowSeoConflict: true,
                                status: "ready",
                                message: "SEO conflict allowed for this wallpaper.",
                              })
                            }
                          >
                            Allow SEO conflict
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-elevated p-6 text-sm text-muted">
          Add a batch to begin. Choose Wallpaper or PFP before generating SEO or publishing.
        </div>
      )}
    </div>
  );
}

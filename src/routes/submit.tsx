import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  CircleX,
  Clock3,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encodePlate } from "@/lib/encode-plate";
import { getBearerToken } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import { sha256Blob } from "@/lib/hash";
import { noindexHead } from "@/lib/seo";
import {
  checkCommunityWallpaperDuplicate,
  generateWallpaperSeo,
  getCommunityUploadMeta,
  listMyWallpaperSubmissions,
  uploadCommunityWallpaperSubmission,
} from "@/lib/server/ops-upload";
import type { Category } from "@/lib/types";

export const Route = createFileRoute("/submit")({
  head: () => noindexHead("Submit a Wallpaper | Mr Wallpapers", "/submit"),
  component: SubmitWallpaperPage,
});

type Encoded = Awaited<ReturnType<typeof encodePlate>>;
type Submission = Awaited<ReturnType<typeof listMyWallpaperSubmissions>>["items"][number];

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
    const response = await fetch("/api/studio-original", {
      method: "POST",
      headers,
      body: blob,
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { key?: string };
    if (typeof json.key === "string") key = json.key;
  }

  return key;
}

function statusMeta(status: string) {
  if (status === "approved") {
    return {
      label: "Approved",
      className: "bg-success/15 text-success",
      icon: CheckCircle2,
    };
  }
  if (status === "rejected") {
    return {
      label: "Not approved",
      className: "bg-danger/15 text-danger",
      icon: CircleX,
    };
  }
  return {
    label: "Pending review",
    className: "bg-warn/15 text-warn",
    icon: Clock3,
  };
}

function SubmitWallpaperPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const fileRef = useRef<HTMLInputElement>(null);

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
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [aiDailyLimit, setAiDailyLimit] = useState(8);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function loadAccountData() {
    if (!user) return;
    void Promise.all([getCommunityUploadMeta(), listMyWallpaperSubmissions()])
      .then(([meta, mine]) => {
        setCategories(meta.categories);
        setAiDailyLimit(meta.aiDailyLimit);
        setCategoryId((current) => current || meta.categories[0]?.id || "");
        setSubmissions(mine.items);
      })
      .catch(() => setMessage("Could not load submission tools. Please refresh and try again."));
  }

  useEffect(() => {
    if (!isPending && user) loadAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, user?.id]);

  async function choose(file?: File) {
    if (!file) return;
    setLoading(true);
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
      setAiGenerated(false);
      const stem = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      if (!title.trim() && stem) setTitle(stem.slice(0, 60));
    } catch {
      setMessage("Could not process this image.");
    } finally {
      setLoading(false);
    }
  }

  async function generateMetadata() {
    if (!encoded?.ok) {
      setMessage("Choose a wallpaper first.");
      return;
    }
    setGenerating(true);
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
          field: "all",
        },
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setTitle(result.seo.title);
      setDescription(result.seo.description);
      setTags(result.seo.tags.join(", "));
      setAltText(result.seo.altText);
      setPrimaryKeyword(result.seo.primaryKeyword);
      setCategoryId(result.seo.categoryId);
      setAiGenerated(true);
      setMessage("OpenAI generated the metadata. You can edit anything before submitting.");
    } catch {
      setMessage("AI metadata generation failed. You can still fill the details manually.");
    } finally {
      setGenerating(false);
    }
  }

  function resetForm() {
    setEncoded(null);
    setSourceFile(null);
    setPreview(null);
    setTitle("");
    setDescription("");
    setTags("");
    setAltText("");
    setPrimaryKeyword("");
    setDeviceType("phone");
    setRightsConfirmed(false);
    setAiGenerated(false);
    if (fileRef.current) fileRef.current.value = "";
    setCategoryId(categories[0]?.id || "");
  }

  async function submit() {
    if (!user) {
      void navigate({ to: "/login", search: { next: "/submit" } });
      return;
    }
    if (!encoded?.ok || !sourceFile) {
      setMessage("Choose a wallpaper first.");
      return;
    }
    if (title.trim().length < 2 || !categoryId) {
      setMessage("Add a title and category before submitting.");
      return;
    }
    if (!rightsConfirmed) {
      setMessage("Please confirm that you own this image or have permission to share it.");
      return;
    }

    setLoading(true);
    setMessage("Checking your wallpaper…");
    try {
      const plate = encoded.plate;
      const fileSha256 = await sha256Blob(plate.file);
      const sourceSha256 = await sha256Blob(sourceFile);
      const duplicate = await checkCommunityWallpaperDuplicate({
        data: { fileSha256, sourceSha256 },
      });
      if (duplicate.duplicate) {
        setMessage("This wallpaper is already in the catalog or is already waiting for review.");
        return;
      }

      setMessage("Uploading your wallpaper…");
      const originalKey = await putOriginal(plate.file);
      if (!originalKey) {
        setMessage("The original image could not be uploaded. Please try again.");
        return;
      }

      const form = new FormData();
      form.set("title", title.trim());
      form.set("description", description.trim());
      form.set("categoryId", categoryId);
      form.set("tags", tags);
      form.set("altText", altText.trim());
      form.set("primaryKeyword", primaryKeyword.trim());
      form.set("deviceType", deviceType);
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
      form.set("fileSha256", fileSha256);
      form.set("sourceSha256", sourceSha256);
      form.set("rightsConfirmed", "true");
      form.set("aiGenerated", aiGenerated ? "true" : "false");

      const result = await uploadCommunityWallpaperSubmission({ data: form });
      if (!result.ok) {
        setMessage(
          result.error === "duplicate"
            ? "This wallpaper is already in the catalog or review queue."
            : result.error === "rights"
              ? "Please confirm that you have the right to share this wallpaper."
              : "Submission failed. Please review the details and try again.",
        );
        return;
      }

      resetForm();
      setMessage("Submitted successfully. It will stay private until Mr Wallpapers approves it.");
      const mine = await listMyWallpaperSubmissions();
      setSubmissions(mine.items);
    } catch {
      setMessage("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (isPending) {
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 lg:pb-16">
        <div className="h-44 animate-pulse rounded-2xl bg-elevated" />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" search={{ next: "/submit" }} replace />;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-medium tracking-[0.2em] text-muted uppercase">Community</p>
        <h1 className="mt-2 font-display text-4xl text-fg sm:text-5xl">Submit a wallpaper</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Help Mr Wallpapers grow. Every approved community wallpaper is published free for
          everyone, and every submission is reviewed manually before it can appear on the site.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-elevated p-4">
            <ShieldCheck className="size-5 text-fg" />
            <p className="mt-3 text-sm font-medium text-fg">Rights first</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Submit only images you created or have permission to distribute.
            </p>
          </div>
          <div className="rounded-2xl bg-elevated p-4">
            <Sparkles className="size-5 text-fg" />
            <p className="mt-3 text-sm font-medium text-fg">OpenAI metadata</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Generate SEO-ready title, description, tags, alt text and keyword, then edit them.
            </p>
          </div>
          <div className="rounded-2xl bg-elevated p-4">
            <CheckCircle2 className="size-5 text-fg" />
            <p className="mt-3 text-sm font-medium text-fg">Manually approved</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Nothing goes live automatically. Mr Wallpapers reviews each submission first.
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="mt-8 h-44 animate-pulse rounded-2xl bg-elevated" />
        ) : !user ? (
          <section className="mt-8 rounded-2xl bg-elevated p-6 text-center sm:p-8">
            <Upload className="mx-auto size-8 text-fg" />
            <h2 className="mt-4 font-display text-2xl text-fg">Sign in to submit</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              An account is only required for submissions so we can prevent abuse and show you the
              review status. Wallpaper downloads stay free without an account.
            </p>
            <Button
              className="mt-5"
              onClick={() => navigate({ to: "/login", search: { next: "/submit" } })}
            >
              Sign in to continue
            </Button>
          </section>
        ) : (
          <>
            <section className="mt-8 space-y-5 rounded-2xl bg-elevated p-4 sm:p-6">
              <div>
                <h2 className="font-display text-2xl text-fg">Your wallpaper</h2>
                <p className="mt-1 text-sm text-muted">
                  JPG, PNG or WebP. The original file is kept for the final free download.
                </p>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                className="sr-only"
                onChange={(event) => void choose(event.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex min-h-72 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-surface transition hover:border-fg/40"
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Selected wallpaper preview"
                    className="max-h-[38rem] w-full object-contain"
                  />
                ) : (
                  <span className="flex flex-col items-center gap-3 px-6 text-center text-sm text-muted">
                    <span className="grid size-12 place-items-center rounded-full bg-elevated text-fg">
                      <Upload className="size-5" />
                    </span>
                    <span>
                      <span className="block font-medium text-fg">Choose a wallpaper</span>
                      <span className="mt-1 block text-xs text-muted">
                        Tap or click to select an image
                      </span>
                    </span>
                  </span>
                )}
              </button>

              {encoded?.ok ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-3">
                  <p className="text-xs text-muted">
                    {encoded.plate.width} × {encoded.plate.height} ·{" "}
                    {(encoded.plate.bytes / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={generating}
                    onClick={() => void generateMetadata()}
                  >
                    <Sparkles className="size-4" />
                    {generating ? "Generating…" : "Generate metadata with OpenAI"}
                  </Button>
                </div>
              ) : null}

              <p className="text-xs text-subtle">
                OpenAI metadata is optional and limited to {aiDailyLimit} generations per account
                per 24 hours to keep the feature sustainable.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-fg">Title</span>
                  <Input
                    value={title}
                    maxLength={60}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      setAiGenerated(false);
                    }}
                    placeholder="A clear wallpaper title"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-fg">Description</span>
                  <textarea
                    value={description}
                    maxLength={280}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      setAiGenerated(false);
                    }}
                    placeholder="Describe what is actually visible in the wallpaper"
                    className="min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-fg outline-none placeholder:text-subtle focus:border-fg/30"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fg">Category</span>
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fg">Designed for</span>
                  <select
                    value={deviceType}
                    onChange={(event) => setDeviceType(event.target.value as DeviceType)}
                    className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg"
                  >
                    <option value="phone">Phone</option>
                    <option value="tablet">Tablet</option>
                    <option value="both">Phone & tablet</option>
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-fg">Tags</span>
                  <Input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="blue sky, minimal, nature, sunset"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fg">
                    Primary search keyword
                  </span>
                  <Input
                    value={primaryKeyword}
                    maxLength={80}
                    onChange={(event) => setPrimaryKeyword(event.target.value)}
                    placeholder="blue mountain phone wallpaper"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-fg">Alt text</span>
                  <Input
                    value={altText}
                    maxLength={180}
                    onChange={(event) => setAltText(event.target.value)}
                    placeholder="Describe the image naturally"
                  />
                </label>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-4">
                <input
                  type="checkbox"
                  checked={rightsConfirmed}
                  onChange={(event) => setRightsConfirmed(event.target.checked)}
                  className="mt-0.5 size-4 rounded"
                />
                <span className="text-sm leading-relaxed text-muted">
                  I created this image or I have permission to share and distribute it. I understand
                  that, if approved, it will be available as a free wallpaper on Mr Wallpapers.{" "}
                  <Link to="/legal/guidelines" className="font-medium text-fg underline underline-offset-2">
                    Submission guidelines
                  </Link>
                </span>
              </label>

              {message ? (
                <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">{message}</p>
              ) : null}

              <Button
                className="w-full sm:w-auto sm:min-w-48"
                disabled={loading || !encoded?.ok || !rightsConfirmed}
                onClick={() => void submit()}
              >
                {loading ? "Submitting…" : "Submit for review"}
              </Button>
            </section>

            <section className="mt-10">
              <div>
                <h2 className="font-display text-2xl text-fg">Your submissions</h2>
                <p className="mt-1 text-sm text-muted">
                  Approved wallpapers become part of the free Mr Wallpapers catalog.
                </p>
              </div>

              {submissions.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-elevated px-5 py-8 text-center text-sm text-muted">
                  You have not submitted a wallpaper yet.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-elevated">
                  {submissions.map((submission) => {
                    const meta = statusMeta(submission.status);
                    const StatusIcon = meta.icon;
                    return (
                      <li key={submission.id} className="flex items-center gap-3 p-3 sm:p-4">
                        <img
                          src={submission.thumbnailUrl}
                          alt=""
                          className="h-16 w-12 shrink-0 rounded-lg bg-surface object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-fg">
                            {submission.title}
                          </span>
                          <span
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${meta.className}`}
                          >
                            <StatusIcon className="size-3" />
                            {meta.label}
                          </span>
                          {submission.reviewNote ? (
                            <span className="mt-1 block text-xs text-muted">
                              {submission.reviewNote}
                            </span>
                          ) : null}
                        </span>
                        {submission.status === "approved" && submission.publishedWallpaperId ? (
                          <Link
                            to="/wallpaper/$id"
                            params={{ id: submission.publishedWallpaperId }}
                            aria-label="View published wallpaper"
                            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-fg"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

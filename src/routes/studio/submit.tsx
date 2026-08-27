import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EmptyState, ErrorState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  capToMax,
  encodePlate,
  enhanceLocalFile,
  fileFromB64,
  prepareEnhanceSource,
} from "@/lib/encode-plate";
import { sha256Blob } from "@/lib/hash";
import { getBearerToken } from "@/lib/auth/client";
import { t } from "@/lib/i18n/en";
import { enhanceStudioPlate, suggestStudioCopy } from "@/lib/server/enhance";
import {
  checkStudioDuplicate,
  getStudioDashboard,
  getStudioPiece,
  listStudioPlates,
  updateStudioPlate,
  uploadStudioPlate,
  type StudioTagOption,
} from "@/lib/server/studio";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import type { Category } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";

type SubmitSearch = { piece?: string };

export const Route = createFileRoute("/studio/submit")({
  validateSearch: (s: Record<string, unknown>): SubmitSearch => ({
    piece: typeof s.piece === "string" && s.piece.length > 0 ? s.piece : undefined,
  }),
  component: StudioSubmit,
});

const MAX_TAGS = 8;

type Encoded = Awaited<ReturnType<typeof encodePlate>>;

function normalizeTag(raw: string): string | null {
  const name = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 24) return null;
  if (!/[a-z0-9]/.test(name)) return null;
  return name;
}

function withTag(tags: string[], raw: string): string[] {
  const name = normalizeTag(raw);
  if (!name || tags.includes(name) || tags.length >= MAX_TAGS) return tags;
  return [...tags, name];
}

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
      "x-file-name": encodeURIComponent(file.name || "plate.jpg"),
      "x-upload-id": uploadId,
      "x-chunk-index": String(i),
      "x-chunk-count": String(count),
    };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch("/api/studio-original", { method: "POST", headers, body: blob });
    if (!res.ok) return null;
    const json = (await res.json()) as { key?: string; pending?: boolean };
    if (typeof json.key === "string") key = json.key;
  }
  return key;
}

function StudioSubmit() {
  const navigate = useNavigate();
  const { piece: pieceId } = Route.useSearch();
  const fileRef = useRef<HTMLInputElement>(null);
  const genRef = useRef(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogTags, setCatalogTags] = useState<StudioTagOption[]>([]);
  const [original, setOriginal] = useState<Encoded | null>(null);
  const [enhanced, setEnhanced] = useState<Encoded | null>(null);
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFallback, setPreviewFallback] = useState<string | null>(null);
  const [sourceSha, setSourceSha] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [deviceType, setDeviceType] = useState<DeviceType>("phone");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [writing, setWriting] = useState(false);
  const titleTouched = useRef(false);
  const bodyTouched = useRef(false);
  const editing = Boolean(pieceId);

  const encoded = useEnhanced && enhanced?.ok ? enhanced : original;

  useEffect(() => {
    void getStudioDashboard()
      .then((d) => {
        if (d.status !== "approved") {
          void navigate({ to: "/studio" });
          return;
        }
        return listStudioPlates();
      })
      .then(async (r) => {
        if (!r) return;
        setCategories(r.categories);
        setCatalogTags(r.tags);
        if (pieceId) {
          const loaded = await getStudioPiece({ data: { id: pieceId } });
          if (!loaded.piece) {
            void navigate({ to: "/studio" });
            return;
          }
          const p = loaded.piece;
          setTitle(p.title);
          setDescription(p.description);
          titleTouched.current = true;
          bodyTouched.current = true;
          setCategoryId(p.categoryId);
          setTags(p.tags);
          setDeviceType(p.deviceType);
          setPreviewUrl(p.previewUrl);
          setPreviewFallback(p.thumbnailUrl !== p.previewUrl ? p.thumbnailUrl : null);
          return;
        }
        setCategoryId(r.categories[0]?.id ?? "");
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [navigate, pieceId]);

  function addTag(raw: string) {
    const next = withTag(tags, raw);
    if (next === tags) {
      if (tags.length >= MAX_TAGS && normalizeTag(raw)) setMsg(t.studio.tagsMax);
      return false;
    }
    setTags(next);
    setTagDraft("");
    setMsg(null);
    return true;
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagDraft);
      return;
    }
    if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  function showPlate(result: Encoded) {
    if (!result.ok) {
      setPreviewUrl(null);
      return;
    }
    setPreviewFallback(null);
    setPreviewUrl(result.plate.previewDataUrl);
  }

  async function applyCopy(blob: Blob, gen: number, force = false) {
    setWriting(true);
    try {
      const fd = new FormData();
      fd.set("image", blob, "source.jpg");
      const res = await suggestStudioCopy({ data: fd });
      if (gen !== genRef.current) return;
      if (!res.ok) return;
      if (res.title && (force || !titleTouched.current)) {
        setTitle(res.title);
        titleTouched.current = false;
      }
      if (res.description && (force || !bodyTouched.current)) {
        setDescription(res.description);
        bodyTouched.current = false;
      }
      if (res.tags.length) {
        setTags((prev) => {
          const next = [...prev];
          for (const tag of res.tags) {
            if (!next.includes(tag) && next.length < MAX_TAGS) next.push(tag);
          }
          return next;
        });
      }
    } catch {
      // keep typed copy
    } finally {
      if (gen === genRef.current) setWriting(false);
    }
  }

  async function polishFile(file: File): Promise<File> {
    try {
      const source = await prepareEnhanceSource(file);
      const fd = new FormData();
      fd.set("image", source.blob, "source.jpg");
      fd.set("aspectRatio", source.aspect);
      const res = await enhanceStudioPlate({ data: fd });
      if (res.ok) {
        const ext = res.mime === "image/png" ? "png" : res.mime === "image/webp" ? "webp" : "jpg";
        return capToMax(fileFromB64(res.b64, res.mime, `enhanced.${ext}`));
      }
    } catch {
      // local polish below
    }
    return enhanceLocalFile(file);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const gen = ++genRef.current;
    setMsg(null);
    setBusy(true);
    setEnhanced(null);
    setUseEnhanced(true);
    setEnhancing(false);
    try {
      const hash = await sha256Blob(file);
      if (gen !== genRef.current) return;
      setSourceSha(hash);
      const dup = await checkStudioDuplicate({
        data: pieceId ? { hashes: [hash], excludeId: pieceId } : { hashes: [hash] },
      });
      if (gen !== genRef.current) return;
      if (dup.hit) {
        if (!editing) {
          setOriginal(null);
          setEnhanced(null);
          setPreviewUrl(null);
          setSourceSha(null);
        }
        setMsg(dup.own ? t.studio.duplicateOwn : t.studio.duplicate);
        return;
      }

      const result = await encodePlate(file);
      if (gen !== genRef.current) return;
      setOriginal(result);
      if (!result.ok) {
        showPlate(result);
        setMsg(
          result.error === "size"
            ? t.studio.tooBig
            : result.error === "type"
              ? t.studio.badType
              : t.studio.badRatio,
        );
        return;
      }
      showPlate(result);
      if (!editing) setDeviceType(inferDeviceType(result.plate.width, result.plate.height));
      if (!title.trim()) {
        const stem = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
        if (stem) setTitle(stem.slice(0, 60));
      }
      void applyCopy(result.plate.previewBlob, gen);
      setBusy(false);
      setEnhancing(true);
      try {
        const polished = await polishFile(file);
        if (gen !== genRef.current) return;
        const next = await encodePlate(polished);
        if (gen !== genRef.current) return;
        if (next.ok) {
          setEnhanced(next);
          setUseEnhanced(true);
          showPlate(next);
        }
      } catch {
        if (gen !== genRef.current) return;
      } finally {
        if (gen === genRef.current) setEnhancing(false);
      }
    } catch (err) {
      if (gen !== genRef.current) return;
      console.error("[studio] plate pick failed", err);
      setOriginal(null);
      setPreviewUrl((prev) => (editing ? prev : null));
      setMsg(t.errors.generic);
    } finally {
      if (gen === genRef.current) setBusy(false);
    }
  }

  async function submit() {
    if (title.trim().length < 2) {
      setMsg(t.studio.needTitle);
      return;
    }
    if (!encoded?.ok && !editing) {
      setMsg(t.studio.needFile);
      return;
    }
    const readyTags = withTag(tags, tagDraft);
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      fd.set("categoryId", categoryId);
      fd.set("accessType", "free");
      fd.set("deviceType", deviceType);
      fd.set("tags", JSON.stringify(readyTags));
      if (sourceSha) fd.set("sourceSha256", sourceSha);
      if (editing && pieceId) fd.set("pieceId", pieceId);
      if (encoded?.ok) {
        const plate = encoded.plate;
        const fileSha = await sha256Blob(plate.file);
        fd.set("preview", plate.previewBlob, "preview.jpg");
        fd.set("thumb", plate.thumbBlob, "thumb.jpg");
        fd.set("width", String(plate.width));
        fd.set("height", String(plate.height));
        fd.set("bytes", String(plate.bytes));
        fd.set("mime", plate.mime || "image/jpeg");
        fd.set("format", plate.mime.includes("png") ? "png" : plate.mime.includes("webp") ? "webp" : "jpg");
        fd.set("fileSha256", fileSha);
        const key = await putOriginal(plate.file);
        if (!key) {
          setMsg(t.studio.uploadFailed);
          return;
        }
        fd.set("originalKey", key);
      }
      const res = editing
        ? await updateStudioPlate({ data: fd })
        : await uploadStudioPlate({ data: fd });
      if (!res.ok) {
        setMsg(res.error === "duplicate" ? t.studio.duplicate : t.errors.generic);
        return;
      }
      void navigate({ to: "/studio" });
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (loading) return <div className="h-48 rounded-xl bg-elevated" />;

  const canSubmit = Boolean(
    title.trim().length >= 2 && categoryId && !enhancing && (encoded?.ok || editing),
  );
  const draftNorm = tagDraft.trim().toLowerCase();
  const suggestions = catalogTags
    .filter((item) => !tags.includes(item.name) && (!draftNorm || item.name.includes(draftNorm)))
    .slice(0, 12);
  const shown = encoded?.ok ? encoded.plate : null;

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-muted uppercase">{t.studio.brand}</p>
      <h1 className="mt-2 font-display text-4xl text-fg">
        {editing ? t.studio.editPlate : t.studio.submit}
      </h1>

      <p className="mt-6 text-sm text-muted">{editing ? t.studio.changePhoto : t.studio.upload}</p>
      <p className="mt-1 text-sm text-muted">{t.studio.uploadHint}</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      <button
        type="button"
        aria-label={previewUrl ? t.studio.changePhoto : t.studio.uploadCta}
        onClick={() => fileRef.current?.click()}
        className="relative mt-4 flex w-full flex-col items-center justify-center overflow-hidden rounded-[20px] bg-elevated text-sm text-muted"
      >
        {previewUrl ? (
          <span className="relative mx-auto block w-full max-w-[18rem] px-4 py-4">
            <img
              src={previewUrl}
              alt=""
              className="wallpaper-img mx-auto max-h-80 w-full object-contain"
              onError={(e) => {
                if (previewFallback && e.currentTarget.src !== previewFallback) {
                  e.currentTarget.src = previewFallback;
                }
              }}
            />
            {enhancing ? (
              <span
                aria-hidden
                className="absolute inset-4 flex items-center justify-center rounded-xl bg-bg/70 text-sm text-fg"
              >
                {t.studio.enhancing}
              </span>
            ) : useEnhanced && enhanced?.ok ? (
              <span
                aria-hidden
                className="absolute top-6 right-6 inline-flex items-center gap-1 rounded-full bg-fg px-2.5 py-1 text-xs text-bg"
              >
                <Sparkles className="size-3.5" />
                {t.studio.enhanced}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="flex min-h-44 items-center px-4 py-8 text-center">{t.studio.uploadCta}</span>
        )}
      </button>
      {shown ? (
        <p className="mt-2 text-sm tabular-nums text-muted">
          {shown.width}×{shown.height} · {formatBytes(shown.bytes)}
        </p>
      ) : null}
      {original?.ok && enhanced?.ok ? (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setUseEnhanced(true);
                showPlate(enhanced);
              }}
              className={cn(
                "inline-flex h-11 items-center justify-center gap-1.5 rounded-[12px] text-sm",
                useEnhanced ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              <Sparkles className="size-4" />
              {t.studio.enhanced}
            </button>
            <button
              type="button"
              onClick={() => {
                setUseEnhanced(false);
                showPlate(original);
              }}
              className={cn(
                "h-11 rounded-[12px] text-sm",
                !useEnhanced ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              {t.studio.original}
            </button>
          </div>
          <p className="mt-2 text-xs text-subtle">{t.studio.enhanceHint}</p>
        </div>
      ) : previewUrl ? (
        <button
          type="button"
          className="mt-2 text-sm text-muted hover:text-fg"
          onClick={() => fileRef.current?.click()}
        >
          {t.studio.changePhoto}
        </button>
      ) : null}
      {original?.ok && enhanced?.ok ? (
        <button
          type="button"
          className="mt-2 text-sm text-muted hover:text-fg"
          onClick={() => fileRef.current?.click()}
        >
          {t.studio.changePhoto}
        </button>
      ) : null}

      <div className="mt-8 flex items-end justify-between gap-3">
        <label className="block min-w-0 flex-1 text-sm text-muted">
          {t.studio.plateTitle}
          <Input
            className="mt-2"
            value={title}
            onChange={(e) => {
              titleTouched.current = true;
              setTitle(e.target.value);
            }}
            maxLength={60}
          />
        </label>
        <button
          type="button"
          disabled={!encoded?.ok || writing}
          onClick={() => {
            if (!encoded?.ok) return;
            void applyCopy(encoded.plate.previewBlob, genRef.current, true);
          }}
          className="mb-0.5 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] bg-elevated px-3 text-sm text-muted disabled:opacity-50"
        >
          <Sparkles className="size-4" />
          {writing ? t.studio.writingCopy : t.studio.writeCopy}
        </button>
      </div>
      <label className="mt-4 block text-sm text-muted">
        {t.studio.plateBody}
        <textarea
          value={description}
          onChange={(e) => {
            bodyTouched.current = true;
            setDescription(e.target.value);
          }}
          maxLength={280}
          rows={3}
          className="mt-2 w-full rounded-[12px] bg-elevated px-4 py-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      {categories.length > 0 ? (
        <label className="mt-4 block text-sm text-muted">
          {t.studio.category}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-2 h-11 w-full rounded-[12px] bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <EmptyState title={t.errors.empty} />
      )}

      <div className="mt-4">
        <p className="text-sm text-muted">{t.studio.device}</p>
        <p className="mt-1 text-xs text-subtle">{t.studio.deviceHint}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {([
            ["phone", t.studio.devicePhone],
            ["tablet", t.studio.deviceTablet],
            ["both", t.studio.deviceBoth],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setDeviceType(id)}
              className={cn(
                "h-11 rounded-[12px] px-2 text-sm",
                deviceType === id ? "bg-fg text-bg" : "bg-elevated text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted">{t.studio.tags}</p>
        <p className="mt-1 text-xs text-subtle">{t.studio.tagsHint}</p>
        <div className="mt-2 flex min-h-11 flex-wrap items-center gap-2 rounded-[12px] bg-elevated px-3 py-2 shadow-[var(--shadow-border)] focus-within:ring-2 focus-within:ring-ring">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTags(tags.filter((x) => x !== tag))}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-fg pl-3 pr-2 text-xs text-bg"
              aria-label={`Remove ${tag}`}
            >
              {tag}
              <X className="size-3.5" />
            </button>
          ))}
          {tags.length < MAX_TAGS ? (
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={onTagKey}
              onBlur={() => {
                if (tagDraft.trim()) addTag(tagDraft);
              }}
              placeholder={tags.length === 0 ? t.studio.tagsPlaceholder : ""}
              maxLength={24}
              className="min-w-24 flex-1 bg-transparent py-1 text-sm text-fg outline-none placeholder:text-subtle"
            />
          ) : null}
        </div>
        {suggestions.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item.slug}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(item.name)}
                className="h-8 rounded-full bg-elevated px-3 text-xs text-muted hover:text-fg"
              >
                {item.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {editing && encoded?.ok ? (
        <p className="mt-3 text-sm text-muted">{t.studio.photoReReview}</p>
      ) : null}
      {msg ? <p className="mt-3 text-sm text-danger">{msg}</p> : null}
      <Button className="mt-6 w-full" disabled={busy || !canSubmit} onClick={() => void submit()}>
        {enhancing ? t.studio.enhancing : busy ? t.studio.encoding : editing ? t.studio.saveChanges : t.studio.publish}
      </Button>
    </div>
  );
}
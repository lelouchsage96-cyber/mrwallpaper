import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { inferDeviceType, type DeviceType } from "@/lib/device";
import { SHA256 } from "@/lib/hash";
import { sniffImage } from "@/lib/media";
import { slugify } from "@/lib/seo";
import type { Category } from "@/lib/types";
import { sha256Buffer } from "./dupes";
import { fetchCategories, uniqueWallpaperSlug } from "./queries";
import { persistPlateMedia } from "./storage";
import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";
import { buildWallpaperSeoFields, normalizeTag, trimAtWord } from "@/lib/wallpaper-seo";
import { notifyTasteSubscribersForWallpaper } from "./web-push-delivery";

const MAX_PREVIEW = MAX_ORIGINAL_BYTES;
const MAX_THUMB = 800_000;
const MAX_TAGS = 18;
const MAX_SEO_IMAGE_DATA_URL = 2_750_000;

export type GeneratedWallpaperSeo = {
  title: string;
  description: string;
  tags: string[];
  altText: string;
  primaryKeyword: string;
  categoryId: string;
};

export type SeoField = "all" | "title" | "description" | "tags" | "altText" | "primaryKeyword";

export type SeoConflict = { kind: "keyword" | "title"; message: string; wallpaperId: string };

class ForbiddenError extends Error {
  readonly status = 403;
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenError";
  }
}

async function requireAdmin(userId: string): Promise<Sql> {
  const sql = await getSql();
  const rows = await sql.query<{ role: string; status: string }>(
    `select role, status from profiles where user_id = $1 limit 1`,
    [userId],
  );
  const row = rows[0];
  if (!row || row.role !== "admin" || row.status !== "active") throw new ForbiddenError();
  return sql;
}

function formString(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function formBuffer(form: FormData, key: string, max: number): Promise<Buffer | null> {
  const v = form.get(key);
  if (!(v instanceof Blob)) return null;
  if (v.size < 32 || v.size > max) return null;
  return Buffer.from(await v.arrayBuffer());
}

function formHex(form: FormData, key: string): string | null {
  const v = formString(form, key).toLowerCase();
  return SHA256.test(v) ? v : null;
}

function formDevice(form: FormData, width: number, height: number): DeviceType {
  const raw = formString(form, "deviceType");
  if (raw === "phone" || raw === "tablet" || raw === "both") return raw;
  return inferDeviceType(width, height);
}

function aspectLabel(w: number, h: number): string {
  if (!w || !h) return "1:1";
  const r = w / h;
  const presets: [number, string][] = [
    [9 / 16, "9:16"], [16 / 9, "16:9"], [1, "1:1"], [4 / 3, "4:3"],
    [3 / 4, "3:4"], [3 / 2, "3:2"], [2 / 3, "2:3"], [21 / 9, "21:9"], [9 / 21, "9:21"],
  ];
  const hit = presets.find(([v]) => Math.abs(r - v) < 0.045);
  return hit ? hit[1] : `${w}:${h}`;
}

function slugifyTag(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function parseTags(form: FormData): string[] {
  const raw = formString(form, "tags");
  const values = raw.split(",");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const name = normalizeTag(value);
    if (name.length < 2) continue;
    const slug = slugifyTag(name);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(name);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

async function attachTags(sql: Sql, wallpaperId: string, names: string[]) {
  for (const name of names) {
    const slug = slugifyTag(name);
    if (!slug) continue;
    const id = `tag-${slug}`.slice(0, 40);
    await sql.query(
      `insert into tags (id, slug, name) values ($1, $2, $3)
       on conflict (slug) do nothing`,
      [id, slug, name],
    );
    const rows = await sql.query<{ id: string }>(`select id from tags where slug = $1 limit 1`, [slug]);
    const tagId = rows[0]?.id;
    if (!tagId) continue;
    await sql.query(
      `insert into wallpaper_tags (wallpaper_id, tag_id) values ($1, $2) on conflict do nothing`,
      [wallpaperId, tagId],
    );
  }
}

export const getOpsUploadMeta = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ categories: Category[] }> => {
    await requireAdmin(context.userId);
    return { categories: await fetchCategories() };
  });

export const generateWallpaperSeo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    imageDataUrl: string;
    title?: string;
    description?: string;
    tags?: string;
    altText?: string;
    primaryKeyword?: string;
    categoryId?: string;
    deviceType?: DeviceType;
    width: number;
    height: number;
    field?: SeoField;
  }) => input)
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return { ok: false as const, code: "missing_key" as const, error: "Add OPENAI_API_KEY in Vercel to enable SEO generation." };
    if (!data.imageDataUrl.startsWith("data:image/") || data.imageDataUrl.length > MAX_SEO_IMAGE_DATA_URL) {
      return { ok: false as const, error: "This image preview could not be analyzed." };
    }

    const categories = await fetchCategories();
    if (categories.length === 0) return { ok: false as const, error: "No categories are available." };
    const categoryOptions = categories.map((category) => `${category.id}: ${category.name}`).join("\n");
    const supports4k = Math.max(data.width, data.height) >= 3840 && Math.min(data.width, data.height) >= 2160;
    const field = data.field || "all";

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.6-luna",
          reasoning: { effort: "none" },
          max_output_tokens: field === "all" ? 700 : 300,
          store: false,
          input: [
            {
              role: "developer",
              content: [{ type: "input_text", text: `Create accurate SEO metadata for MrWallpaper.org. Analyze only what is actually visible. Never invent people, characters, brands, locations, objects, meanings, quotes, or Bible references. Preserve visible wording exactly when legible; otherwise do not guess. Use natural long-tail phrasing without stuffing. Title: 4-10 words, human-readable, and closely aligned with the primary keyword so the visible page heading and search title describe the same main subject. If an important visible Bible reference, quote, person, or named subject is central to the search intent, keep it consistent across the title and primary keyword. Description: exactly one complete natural sentence, target 120-160 characters and never exceed 170 characters; it must finish with sentence punctuation and must never end as a fragment. Avoid filler such as "visible" unless it improves clarity. Tags: 12-18 distinct useful lowercase phrases without hashtags; every tag must be a complete phrase of 40 characters or fewer. Alt text: one natural sentence about the actual image and useful visible text. Primary keyword: one realistic specific search phrase that matches the title's main subject. Never repeat wallpaper wording, such as \"wallpaper phone wallpaper\". Category must be one supplied ID. ${supports4k ? "Mention 4K only if useful and accurate." : "Never claim or imply 4K."} Generate ${field === "all" ? "all fields" : `only the ${field} field; copy the supplied values for all other fields`}.` }],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: `Resolution: ${data.width} × ${data.height}.\nDevice: ${data.deviceType || "unknown"}\nTitle: ${data.title?.trim() || ""}\nDescription: ${data.description?.trim() || ""}\nTags: ${data.tags?.trim() || ""}\nAlt text: ${data.altText?.trim() || ""}\nPrimary keyword: ${data.primaryKeyword?.trim() || ""}\nCategory ID: ${data.categoryId || ""}\n\nAllowed categories:\n${categoryOptions}`,
                },
                { type: "input_image", image_url: data.imageDataUrl, detail: "high" },
              ],
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "wallpaper_seo",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  primaryKeyword: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                  tags: { type: "array", items: { type: "string" }, minItems: 12, maxItems: 18 },
                  altText: { type: "string" },
                  categoryId: { type: "string", enum: categories.map((category) => category.id) },
                },
                required: ["primaryKeyword", "title", "description", "tags", "altText", "categoryId"],
                additionalProperties: false,
              },
            },
          },
        }),
      });
      if (!response.ok) {
        const detail = await response.text();
        console.error("[ops-upload] OpenAI SEO", response.status, detail.slice(0, 500));
        if (response.status === 429) return { ok: false as const, code: "rate_limit" as const, error: "OpenAI quota or rate limit reached. Try again shortly or check API billing." };
        return { ok: false as const, code: "api_error" as const, error: "OpenAI could not generate SEO. Please try again." };
      }
      const body = (await response.json()) as { output?: unknown; usage?: { input_tokens?: number; output_tokens?: number } };
      // Raw Responses API text lives in message content, not the SDK's output_text helper.
      const outputText = (Array.isArray(body.output) ? body.output : [])
        .flatMap((item) => item?.type === "message" && Array.isArray(item.content) ? item.content : [])
        .filter((part) => part?.type === "output_text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("");
      const parsed = JSON.parse(outputText || "{}") as GeneratedWallpaperSeo;
      const categoryId = categories.some((category) => category.id === parsed.categoryId)
        ? parsed.categoryId
        : categories[0].id;
      const cleanTags = Array.from(
        new Set((parsed.tags || []).map(normalizeTag).filter((tag) => tag.length >= 2)),
      ).slice(0, MAX_TAGS);
      if (
        typeof parsed.title !== "string" ||
        typeof parsed.description !== "string" ||
        typeof parsed.altText !== "string" ||
        typeof parsed.primaryKeyword !== "string" ||
        cleanTags.length < 12
      ) {
        return { ok: false as const, code: "malformed_output" as const, error: "OpenAI returned incomplete details. Please try again." };
      }
      console.info("[ops-upload] OpenAI SEO usage", { model: "gpt-5.6-luna", field, ...body.usage });
      return {
        ok: true as const,
        seo: {
          title: trimAtWord(parsed.title, 60),
          description: buildWallpaperSeoFields({
            title: parsed.title,
            description: parsed.description,
            primaryKeyword: parsed.primaryKeyword,
          }).seoDescription,
          tags: cleanTags,
          altText: trimAtWord(parsed.altText, 180),
          primaryKeyword: buildWallpaperSeoFields({ title: parsed.title, description: parsed.description, primaryKeyword: parsed.primaryKeyword }).primaryKeyword,
          categoryId,
        } satisfies GeneratedWallpaperSeo,
      };
    } catch (error) {
      console.error("[ops-upload] SEO generation", error);
      return { ok: false as const, code: "malformed_output" as const, error: "SEO generation failed. Please try again." };
    }
  });

function normalizedWords(value: string): Set<string> {
  return new Set(value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 2));
}

function wordSimilarity(a: string, b: string): number {
  const left = normalizedWords(a);
  const right = normalizedWords(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return (2 * shared) / (left.size + right.size);
}

export const checkWallpaperSeoConflicts = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; primaryKeyword: string; excludeWallpaperId?: string }) => input)
  .handler(async ({ context, data }): Promise<{ conflicts: SeoConflict[] }> => {
    const sql = await requireAdmin(context.userId);
    const rows = await sql.query<{ id: string; title: string; primary_keyword: string | null }>(
      `select id, title, primary_keyword from wallpapers where ($1 = '' or id <> $1)`,
      [data.excludeWallpaperId || ""],
    );
    const conflicts: SeoConflict[] = [];
    const keyword = data.primaryKeyword.trim();
    const keywordMatch = keyword ? rows.find((row) => row.primary_keyword && wordSimilarity(keyword, row.primary_keyword) >= 0.8) : undefined;
    if (keywordMatch) conflicts.push({ kind: "keyword", wallpaperId: keywordMatch.id, message: `Primary keyword is very similar to “${keywordMatch.primary_keyword}”.` });
    const titleMatch = data.title.trim() ? rows.find((row) => wordSimilarity(data.title, row.title) >= 0.8) : undefined;
    if (titleMatch) conflicts.push({ kind: "title", wallpaperId: titleMatch.id, message: `Title is very similar to “${titleMatch.title}”.` });
    return { conflicts };
  });

export const uploadOpsWallpaper = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    const sql = await requireAdmin(context.userId);
    const title = formString(data, "title");
    const description = formString(data, "description").slice(0, 280);
    const altText = formString(data, "altText").slice(0, 180) || title;
    const seo = buildWallpaperSeoFields({ title, description, primaryKeyword: formString(data, "primaryKeyword") });
    const categoryId = formString(data, "categoryId");
    const tagNames = parseTags(data);
    if (title.length < 2 || title.length > 60) return { ok: false as const, error: "title" };

    const cats = await fetchCategories();
    if (!cats.some((c) => c.id === categoryId)) return { ok: false as const, error: "category" };

    const originalKey = formString(data, "originalKey");
    if (!originalKey) return { ok: false as const, error: "image" };
    const preview = await formBuffer(data, "preview", MAX_PREVIEW);
    const thumb = await formBuffer(data, "thumb", MAX_THUMB);
    if (!preview || !thumb) return { ok: false as const, error: "image" };

    const width = Number(formString(data, "width")) || 0;
    const height = Number(formString(data, "height")) || 0;
    const originalBytes = Number(formString(data, "bytes")) || 0;
    const mime = formString(data, "mime") || "image/jpeg";
    const format = (formString(data, "format") || "jpg") as "jpg" | "png" | "webp";
    const previewMeta = sniffImage(preview);
    const thumbMeta = sniffImage(thumb);
    if (width < 8 || height < 8 || !previewMeta || !thumbMeta) {
      return { ok: false as const, error: "image" };
    }

    const fileSha = formHex(data, "fileSha256") ?? sha256Buffer(preview);
    const sourceSha = formHex(data, "sourceSha256") ?? fileSha;
    const existing = await sql.query<{ id: string }>(
      `select id from wallpapers where sha256 = $1 or source_sha256 = $2 limit 1`,
      [fileSha, sourceSha],
    );
    if (existing[0]) return { ok: false as const, error: "duplicate" };

    const wallpaperId = `w${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const slug = await uniqueWallpaperSlug(slugify(title));
    const stored = await persistPlateMedia(sql, {
      wallpaperId,
      original: Buffer.alloc(0),
      originalKey,
      originalBytes,
      preview,
      thumb,
      mime,
      format,
      width,
      height,
      previewWidth: previewMeta.width,
      previewHeight: previewMeta.height,
      thumbWidth: thumbMeta.width,
      thumbHeight: thumbMeta.height,
    });

    await sql.query(
      `insert into wallpapers
         (id, title, description, category_id, creator_id, access_type, status,
          width, height, file_size_bytes, format, aspect_ratio, device_type,
          sha256, source_sha256, published_at, slug, alt_text, primary_keyword, seo_title, seo_description, robots)
       values
         ($1, $2, $3, $4, null, 'free', 'approved', $5, $6, $7, $8, $9, $10,
          $11, $12, now(), $13, $14, $15, $16, $17, 'index')`,
      [
        wallpaperId, title, description, categoryId, width, height, originalBytes,
        format, aspectLabel(width, height), formDevice(data, width, height), fileSha,
        sourceSha, slug, altText, seo.primaryKeyword, seo.seoTitle, seo.seoDescription,
      ],
    );

    await sql.query(
      `insert into wallpaper_assets
         (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
       values
         ($1, $2, 'thumbnail', 'public', $3, $4, $5, $6, 'image/jpeg', true),
         ($7, $2, 'preview', 'public', $8, $9, $10, $11, 'image/jpeg', true),
         ($12, $2, 'original', 'protected', $13, $14, $15, $16, $17, false)`,
      [
        `${wallpaperId}-athumb`, wallpaperId, stored.thumbPath, thumbMeta.width,
        thumbMeta.height, thumb.length, `${wallpaperId}-aprev`, stored.previewPath,
        previewMeta.width, previewMeta.height, preview.length, `${wallpaperId}-aorig`,
        stored.originalPath, width, height, originalBytes, mime,
      ],
    );

    await attachTags(sql, wallpaperId, tagNames);
    const category = cats.find((item) => item.id === categoryId);
    if (category) {
      await notifyTasteSubscribersForWallpaper({
        wallpaperId,
        categoryId,
        categoryName: category.name,
        categorySlug: category.slug,
      }).catch((error) => console.error("[push] new wallpaper", error));
    }
    return { ok: true as const, id: wallpaperId, slug };
  });


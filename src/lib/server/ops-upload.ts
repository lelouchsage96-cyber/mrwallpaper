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
import { buildWallpaperSeoCatalogContext, buildWallpaperSeoDeveloperPrompt, MRWALLPAPER_AI_CONTEXT_VERSION } from "@/lib/mrwallpaper-ai";
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

async function requireActiveUser(userId: string): Promise<{ sql: Sql; role: string }> {
  const sql = await getSql();
  await sql.query(`insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`, [userId]);
  const rows = await sql.query<{ role: string; status: string }>(
    `select role, status from profiles where user_id = $1 limit 1`,
    [userId],
  );
  const row = rows[0];
  if (!row || row.status !== "active") throw new ForbiddenError();
  return { sql, role: row.role || "user" };
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

export const getCommunityUploadMeta = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ categories: Category[]; aiDailyLimit: number }> => {
    await requireActiveUser(context.userId);
    return { categories: await fetchCategories(), aiDailyLimit: 8 };
  });


function seoTagOverlap(current: string | undefined, generated: string[]): number {
  const left = new Set(
    (current || "")
      .split(",")
      .map((tag) => normalizeTag(tag))
      .filter((tag) => tag.length >= 2),
  );
  const right = new Set(generated.map((tag) => normalizeTag(tag)).filter((tag) => tag.length >= 2));
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const tag of left) if (right.has(tag)) shared += 1;
  return shared / Math.min(left.size, right.size);
}

function seoRegenerationTooSimilar(
  data: {
    title?: string;
    description?: string;
    tags?: string;
    altText?: string;
    primaryKeyword?: string;
  },
  generated: GeneratedWallpaperSeo,
  field: SeoField,
): boolean {
  const titleSimilarity = wordSimilarity(data.title || "", generated.title || "");
  const descriptionSimilarity = wordSimilarity(data.description || "", generated.description || "");
  const altSimilarity = wordSimilarity(data.altText || "", generated.altText || "");
  const keywordSimilarity = wordSimilarity(data.primaryKeyword || "", generated.primaryKeyword || "");
  const tagsSimilarity = seoTagOverlap(data.tags, generated.tags || []);

  if (field === "title") return titleSimilarity >= 0.72;
  if (field === "description") return descriptionSimilarity >= 0.82;
  if (field === "altText") return altSimilarity >= 0.82;
  if (field === "primaryKeyword") return keywordSimilarity >= 0.72;
  if (field === "tags") return tagsSimilarity >= 0.65;

  const tooClose = [
    titleSimilarity >= 0.78,
    descriptionSimilarity >= 0.86,
    altSimilarity >= 0.86,
    keywordSimilarity >= 0.78,
    tagsSimilarity >= 0.7,
  ].filter(Boolean).length;
  return (titleSimilarity >= 0.82 && keywordSimilarity >= 0.82) || tooClose >= 3;
}

type SeoModelCall =
  | { ok: true; parsed: GeneratedWallpaperSeo; usage?: { input_tokens?: number; output_tokens?: number } }
  | { ok: false; status: number; detail: string };

async function requestWallpaperSeoCandidate(input: {
  apiKey: string;
  developerPrompt: string;
  userText: string;
  imageDataUrl: string;
  field: SeoField;
  categories: Category[];
}): Promise<SeoModelCall> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      reasoning: { effort: "none" },
      max_output_tokens: input.field === "all" ? 700 : 300,
      store: false,
      input: [
        {
          role: "developer",
          content: [{ type: "input_text", text: input.developerPrompt }],
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: input.userText },
            { type: "input_image", image_url: input.imageDataUrl, detail: "high" },
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
              categoryId: { type: "string", enum: input.categories.map((category) => category.id) },
            },
            required: ["primaryKeyword", "title", "description", "tags", "altText", "categoryId"],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    return { ok: false, status: response.status, detail: (await response.text()).slice(0, 500) };
  }

  const body = (await response.json()) as {
    output?: unknown;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const outputText = (Array.isArray(body.output) ? body.output : [])
    .flatMap((item) => item?.type === "message" && Array.isArray(item.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("");

  return {
    ok: true,
    parsed: JSON.parse(outputText || "{}") as GeneratedWallpaperSeo,
    usage: body.usage,
  };
}

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
    regenerate?: boolean;
    variationIndex?: number;
  }) => input)
  .handler(async ({ context, data }) => {
    const { sql, role } = await requireActiveUser(context.userId);
    if (role !== "admin") {
      const recent = await sql.query<{ n: number }>(
        `select count(*)::int as n from ai_generation_events
         where user_id = $1 and kind = 'wallpaper_seo'
           and created_at > now() - interval '1 day'`,
        [context.userId],
      );
      if ((recent[0]?.n ?? 0) >= 8) {
        return {
          ok: false as const,
          code: "rate_limit" as const,
          error: "You have used today’s AI metadata allowance. You can still submit by filling the details manually.",
        };
      }
    }
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
    const catalogRows = await sql.query<{ title: string; primary_keyword: string | null }>(
      `select title, primary_keyword
       from wallpapers
       where status = 'approved'
       order by published_at desc nulls last
       limit 120`,
    );
    const catalogContext = buildWallpaperSeoCatalogContext(
      catalogRows.map((row) => ({ title: row.title, primaryKeyword: row.primary_keyword })),
      80,
    );
    const variationIndex = Math.max(1, Math.min(20, Number(data.variationIndex) || 1));
    const developerPrompt = buildWallpaperSeoDeveloperPrompt({
      supports4k,
      field,
      catalogContext,
      regenerate: Boolean(data.regenerate),
      variationIndex,
    });
    const userText = `Resolution: ${data.width} × ${data.height}.\nDevice: ${data.deviceType || "unknown"}\n${data.regenerate ? "The current requested field value below was rejected. Treat it as an example to avoid repeating, not as the desired answer.\n" : ""}Title: ${data.title?.trim() || ""}\nDescription: ${data.description?.trim() || ""}\nTags: ${data.tags?.trim() || ""}\nAlt text: ${data.altText?.trim() || ""}\nPrimary keyword: ${data.primaryKeyword?.trim() || ""}\nCategory ID: ${data.categoryId || ""}\n\nAllowed categories:\n${categoryOptions}`;

    try {
      let modelCall = await requestWallpaperSeoCandidate({
        apiKey,
        developerPrompt,
        userText,
        imageDataUrl: data.imageDataUrl,
        field,
        categories,
      });
      if (!modelCall.ok) {
        console.error("[ops-upload] OpenAI SEO", modelCall.status, modelCall.detail);
        if (modelCall.status === 429) {
          return { ok: false as const, code: "rate_limit" as const, error: "OpenAI quota or rate limit reached. Try again shortly or check API billing." };
        }
        return { ok: false as const, code: "api_error" as const, error: "OpenAI could not generate SEO. Please try again." };
      }

      let parsed = modelCall.parsed;
      let usage = modelCall.usage;
      let diversityRetry = false;

      if (data.regenerate && seoRegenerationTooSimilar(data, parsed, field)) {
        diversityRetry = true;
        const retryPrompt =
          buildWallpaperSeoDeveloperPrompt({
            supports4k,
            field,
            catalogContext,
            regenerate: true,
            variationIndex: Math.min(20, variationIndex + 1),
          }) +
          "\n\nAUTOMATIC DIVERSITY RETRY\n- The previous regeneration candidate was still too similar to the rejected value. Produce a clearly different alternative now.\n- Change the phrasing, structure, and search angle more substantially while remaining faithful to the image.\n- Do not merely swap one adjective, reorder words, or repeat most of the same tags.";

        modelCall = await requestWallpaperSeoCandidate({
          apiKey,
          developerPrompt: retryPrompt,
          userText,
          imageDataUrl: data.imageDataUrl,
          field,
          categories,
        });
        if (!modelCall.ok) {
          console.error("[ops-upload] OpenAI SEO diversity retry", modelCall.status, modelCall.detail);
          if (modelCall.status === 429) {
            return { ok: false as const, code: "rate_limit" as const, error: "OpenAI quota or rate limit reached. Try again shortly or check API billing." };
          }
          return { ok: false as const, code: "api_error" as const, error: "OpenAI could not generate a different alternative. Please try again." };
        }
        parsed = modelCall.parsed;
        usage = modelCall.usage;
      }

      if (data.regenerate && seoRegenerationTooSimilar(data, parsed, field)) {
        return {
          ok: false as const,
          code: "too_similar" as const,
          error: "The AI alternative was still too similar, so it was not applied. Press Regenerate again for another version.",
        };
      }

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
      console.info("[ops-upload] OpenAI SEO usage", {
        model: "gpt-5.6-luna",
        field,
        regenerate: Boolean(data.regenerate),
        variationIndex,
        diversityRetry,
        contextVersion: MRWALLPAPER_AI_CONTEXT_VERSION,
        ...usage,
      });
      if (role !== "admin") {
        await sql.query(
          `insert into ai_generation_events (id, user_id, kind) values ($1, $2, 'wallpaper_seo')`,
          [crypto.randomUUID(), context.userId],
        );
      }
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
          primaryKeyword: buildWallpaperSeoFields({
            title: parsed.title,
            description: parsed.description,
            primaryKeyword: parsed.primaryKeyword,
          }).primaryKeyword,
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


export const listMyWallpaperSubmissions = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { sql } = await requireActiveUser(context.userId);
    const rows = await sql.query<{
      id: string;
      title: string;
      status: string;
      thumbnail_path: string;
      published_wallpaper_id: string | null;
      review_note: string | null;
      created_at: string;
    }>(
      `select id, title, status, thumbnail_path, published_wallpaper_id, review_note,
              created_at::text as created_at
       from wallpaper_submissions
       where user_id = $1
       order by created_at desc
       limit 30`,
      [context.userId],
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        thumbnailUrl: row.thumbnail_path,
        publishedWallpaperId: row.published_wallpaper_id,
        reviewNote: row.review_note,
        createdAt: row.created_at,
      })),
    };
  });

export const checkCommunityWallpaperDuplicate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { fileSha256: string; sourceSha256: string }) => input)
  .handler(async ({ context, data }) => {
    const { sql } = await requireActiveUser(context.userId);
    if (!SHA256.test(data.fileSha256) || !SHA256.test(data.sourceSha256)) {
      return { duplicate: false as const };
    }
    const existing = await sql.query<{ id: string }>(
      `select id from wallpapers
       where sha256 = $1 or source_sha256 = $2
       limit 1`,
      [data.fileSha256, data.sourceSha256],
    );
    if (existing[0]) return { duplicate: true as const };
    const pending = await sql.query<{ id: string }>(
      `select id from wallpaper_submissions
       where (sha256 = $1 or source_sha256 = $2)
         and status in ('pending', 'approved')
       limit 1`,
      [data.fileSha256, data.sourceSha256],
    );
    return { duplicate: Boolean(pending[0]) };
  });

export const uploadCommunityWallpaperSubmission = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    const { sql } = await requireActiveUser(context.userId);
    const rightsConfirmed = formString(data, "rightsConfirmed") === "true";
    if (!rightsConfirmed) return { ok: false as const, error: "rights" as const };

    const title = formString(data, "title");
    const description = formString(data, "description").slice(0, 280);
    const altText = formString(data, "altText").slice(0, 180) || title;
    const primaryKeyword = formString(data, "primaryKeyword").slice(0, 80);
    const categoryId = formString(data, "categoryId");
    const tagNames = parseTags(data);
    if (title.length < 2 || title.length > 60) return { ok: false as const, error: "title" as const };

    const categories = await fetchCategories();
    if (!categories.some((category) => category.id === categoryId)) {
      return { ok: false as const, error: "category" as const };
    }

    const originalKey = formString(data, "originalKey");
    if (!originalKey) return { ok: false as const, error: "image" as const };
    const preview = await formBuffer(data, "preview", MAX_PREVIEW);
    const thumb = await formBuffer(data, "thumb", MAX_THUMB);
    if (!preview || !thumb) return { ok: false as const, error: "image" as const };

    const width = Number(formString(data, "width")) || 0;
    const height = Number(formString(data, "height")) || 0;
    const originalBytes = Number(formString(data, "bytes")) || 0;
    const mime = formString(data, "mime") || "image/jpeg";
    const format = (formString(data, "format") || "jpg") as "jpg" | "png" | "webp";
    const previewMeta = sniffImage(preview);
    const thumbMeta = sniffImage(thumb);
    if (width < 8 || height < 8 || !previewMeta || !thumbMeta) {
      return { ok: false as const, error: "image" as const };
    }

    const fileSha = formHex(data, "fileSha256") ?? sha256Buffer(preview);
    const sourceSha = formHex(data, "sourceSha256") ?? fileSha;
    const existing = await sql.query<{ id: string }>(
      `select id from wallpapers where sha256 = $1 or source_sha256 = $2 limit 1`,
      [fileSha, sourceSha],
    );
    const existingSubmission = await sql.query<{ id: string }>(
      `select id from wallpaper_submissions
       where (sha256 = $1 or source_sha256 = $2)
         and status in ('pending', 'approved')
       limit 1`,
      [fileSha, sourceSha],
    );
    if (existing[0] || existingSubmission[0]) {
      return { ok: false as const, error: "duplicate" as const };
    }

    const submissionId = "s" + crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const stored = await persistPlateMedia(sql, {
      wallpaperId: submissionId,
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
      `insert into wallpaper_submissions
         (id, user_id, title, description, category_id, tags, alt_text, primary_keyword,
          device_type, width, height, file_size_bytes, format, mime, sha256, source_sha256,
          original_path, preview_path, thumbnail_path, preview_width, preview_height,
          preview_bytes, thumbnail_width, thumbnail_height, thumbnail_bytes,
          rights_confirmed, ai_generated, status, created_at, updated_at)
       values
         ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27,
          'pending', now(), now())`,
      [
        submissionId,
        context.userId,
        title,
        description,
        categoryId,
        JSON.stringify(tagNames),
        altText,
        primaryKeyword,
        formDevice(data, width, height),
        width,
        height,
        originalBytes,
        format,
        mime,
        fileSha,
        sourceSha,
        stored.originalPath,
        stored.previewPath,
        stored.thumbPath,
        previewMeta.width,
        previewMeta.height,
        preview.length,
        thumbMeta.width,
        thumbMeta.height,
        thumb.length,
        true,
        formString(data, "aiGenerated") === "true",
      ],
    );

    return { ok: true as const, id: submissionId, status: "pending" as const };
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


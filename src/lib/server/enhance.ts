import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { sniffImage } from "@/lib/media";
import { authMiddleware } from "@/lib/auth/middleware";
import { marketplaceEnabled } from "./queries";

const MAX_SOURCE = 2.5 * 1024 * 1024;
const ENHANCE_PROMPT =
  "Photorealistic phone wallpaper enhancement of this exact photograph. Sharpen fine detail, lift micro-contrast, enrich natural color, reduce noise, and make it crisp and OLED-ready. Keep the identical composition, subject, crop, lighting, and aspect ratio. Do not add objects, people, text, logos, frames, or watermarks. Do not restyle or change the scene.";

function formBlob(form: FormData, key: string, max: number): Promise<Buffer | null> {
  const v = form.get(key);
  if (!(v instanceof Blob)) return Promise.resolve(null);
  if (v.size < 32 || v.size > max) return Promise.resolve(null);
  return v.arrayBuffer().then((buf) => Buffer.from(buf));
}

type ImagineBody = {
  data?: { url?: string; b64_json?: string }[];
  url?: string;
};

async function imagineEdit(
  apiKey: string,
  dataUri: string,
  extra: Record<string, unknown>,
): Promise<{ ok: true; bytes: Buffer; mime: string } | { ok: false }> {
  const res = await fetch("https://api.x.ai/v1/images/edits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image-2.0",
      prompt: ENHANCE_PROMPT,
      image: { url: dataUri, type: "image_url" },
      ...extra,
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) return { ok: false };
  const body = (await res.json()) as ImagineBody;
  const url = body.data?.[0]?.url ?? body.url;
  const b64 = body.data?.[0]?.b64_json;
  if (b64) {
    const bytes = Buffer.from(b64, "base64");
    const meta = sniffImage(bytes);
    return { ok: true, bytes, mime: meta?.mime ?? "image/jpeg" };
  }
  if (!url || typeof url !== "string") return { ok: false };
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    const raw = comma >= 0 ? url.slice(comma + 1) : url;
    const bytes = Buffer.from(raw, "base64");
    const meta = sniffImage(bytes);
    return { ok: true, bytes, mime: meta?.mime ?? "image/jpeg" };
  }
  const img = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!img.ok) return { ok: false };
  const bytes = Buffer.from(await img.arrayBuffer());
  if (bytes.length < 32 || bytes.length > 8 * 1024 * 1024) return { ok: false };
  const meta = sniffImage(bytes);
  return { ok: true, bytes, mime: meta?.mime ?? "image/jpeg" };
}

export const enhanceStudioPlate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "unavailable" };
    if (!(await marketplaceEnabled())) return { ok: false as const, error: "off" };

    const sql = await getSql();
    const profile = await sql.query<{ status: string }>(
      `select status from creator_profiles where user_id = $1 limit 1`,
      [context.userId],
    );
    if (profile[0]?.status !== "approved") return { ok: false as const, error: "forbidden" };

    const image = await formBlob(data, "image", MAX_SOURCE);
    if (!image) return { ok: false as const, error: "image" };
    const meta = sniffImage(image);
    if (!meta) return { ok: false as const, error: "image" };

    const aspect = (() => {
      const v = data.get("aspectRatio");
      return typeof v === "string" && /^\d+:\d+$/.test(v) ? v : "9:16";
    })();
    const dataUri = `data:${meta.mime};base64,${image.toString("base64")}`;

    let result = await imagineEdit(apiKey, dataUri, { resolution: "2k", aspect_ratio: aspect });
    if (!result.ok) {
      result = await imagineEdit(apiKey, dataUri, {});
    }
    if (!result.ok) return { ok: false as const, error: "failed" };

    return {
      ok: true as const,
      mime: result.mime,
      b64: result.bytes.toString("base64"),
    };
  });

const COPY_PROMPT =
  "You name phone wallpapers. Look at this photograph. Reply with JSON only, no markdown: {\"title\":\"...\",\"description\":\"...\",\"tags\":[\"...\",\"...\"]}. Title: 2–5 words, max 48 characters, poetic and specific to what is in the photo, no quotes. Description: one quiet sentence, max 160 characters, matching the scene, light, and mood. Tags: 3–6 lowercase single words from the photo (place, color, time, weather, subject). No brand names.";

type CopyJson = { title?: string; description?: string; tags?: unknown };

async function visionCopy(apiKey: string, dataUri: string): Promise<CopyJson | null> {
  const models = ["grok-2-vision-1212", "grok-4"];
  for (const model of models) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.35,
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: dataUri } },
                { type: "text", text: COPY_PROMPT },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const raw = body.choices?.[0]?.message?.content?.trim();
      if (!raw) continue;
      const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(jsonText) as CopyJson;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // try next model
    }
  }
  return null;
}

function cleanTitle(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/["“”]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}

function cleanBody(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.replace(/\s+/g, " ").trim().slice(0, 280);
}

function cleanTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const name = item.trim().toLowerCase().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 24) continue;
    if (!/[a-z0-9]/.test(name)) continue;
    if (!out.includes(name)) out.push(name);
    if (out.length >= 8) break;
  }
  return out;
}

export const suggestStudioCopy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    if (typeof FormData !== "undefined" && input instanceof FormData) return input;
    throw new Error("Expected FormData");
  })
  .handler(async ({ context, data }) => {
    if (!(await marketplaceEnabled())) return { ok: false as const, error: "off" };
    const sql = await getSql();
    const profile = await sql.query<{ status: string }>(
      `select status from creator_profiles where user_id = $1 limit 1`,
      [context.userId],
    );
    if (profile[0]?.status !== "approved") return { ok: false as const, error: "forbidden" };

    const image = await formBlob(data, "image", MAX_SOURCE);
    if (!image) return { ok: false as const, error: "image" };
    const meta = sniffImage(image);
    if (!meta) return { ok: false as const, error: "image" };

    const apiKey = process.env.XAI_API_KEY;
    const dataUri = `data:${meta.mime};base64,${image.toString("base64")}`;
    const parsed = apiKey ? await visionCopy(apiKey, dataUri) : null;
    const title = cleanTitle(parsed?.title);
    const description = cleanBody(parsed?.description);
    const tags = cleanTags(parsed?.tags);
    if (!title && !description) return { ok: false as const, error: "failed" };
    return { ok: true as const, title, description, tags };
  });


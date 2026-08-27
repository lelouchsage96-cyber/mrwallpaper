import { r as createServerFn } from "./ssr.mjs";
import { $ as sniffImage, I as marketplaceEnabled, k as getSql, o as authMiddleware } from "./queries-bIh47-yB.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/enhance-B3bZEMmt.js
var MAX_SOURCE = 2621440;
var ENHANCE_PROMPT = "Photorealistic phone wallpaper enhancement of this exact photograph. Sharpen fine detail, lift micro-contrast, enrich natural color, reduce noise, and make it crisp and OLED-ready. Keep the identical composition, subject, crop, lighting, and aspect ratio. Do not add objects, people, text, logos, frames, or watermarks. Do not restyle or change the scene.";
function formBlob(form, key, max) {
	const v = form.get(key);
	if (!(v instanceof Blob)) return Promise.resolve(null);
	if (v.size < 32 || v.size > max) return Promise.resolve(null);
	return v.arrayBuffer().then((buf) => Buffer.from(buf));
}
async function imagineEdit(apiKey, dataUri, extra) {
	const res = await fetch("https://api.x.ai/v1/images/edits", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-imagine-image-2.0",
			prompt: ENHANCE_PROMPT,
			image: {
				url: dataUri,
				type: "image_url"
			},
			...extra
		}),
		signal: AbortSignal.timeout(45e3)
	});
	if (!res.ok) return { ok: false };
	const body = await res.json();
	const url = body.data?.[0]?.url ?? body.url;
	const b64 = body.data?.[0]?.b64_json;
	if (b64) {
		const bytes = Buffer.from(b64, "base64");
		return {
			ok: true,
			bytes,
			mime: sniffImage(bytes)?.mime ?? "image/jpeg"
		};
	}
	if (!url || typeof url !== "string") return { ok: false };
	if (url.startsWith("data:")) {
		const comma = url.indexOf(",");
		const raw = comma >= 0 ? url.slice(comma + 1) : url;
		const bytes = Buffer.from(raw, "base64");
		return {
			ok: true,
			bytes,
			mime: sniffImage(bytes)?.mime ?? "image/jpeg"
		};
	}
	const img = await fetch(url, { signal: AbortSignal.timeout(2e4) });
	if (!img.ok) return { ok: false };
	const bytes = Buffer.from(await img.arrayBuffer());
	if (bytes.length < 32 || bytes.length > 8388608) return { ok: false };
	return {
		ok: true,
		bytes,
		mime: sniffImage(bytes)?.mime ?? "image/jpeg"
	};
}
var enhanceStudioPlate_createServerFn_handler = createServerRpc({
	id: "433352f1ff88364d43e3d7de47decbb7d50a34d00ecf088830aa131922a775fe",
	name: "enhanceStudioPlate",
	filename: "src/lib/server/enhance.ts"
}, (opts) => enhanceStudioPlate.__executeServer(opts));
var enhanceStudioPlate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(enhanceStudioPlate_createServerFn_handler, async ({ context, data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "unavailable"
	};
	if (!await marketplaceEnabled()) return {
		ok: false,
		error: "off"
	};
	if ((await (await getSql()).query(`select status from creator_profiles where user_id = $1 limit 1`, [context.userId]))[0]?.status !== "approved") return {
		ok: false,
		error: "forbidden"
	};
	const image = await formBlob(data, "image", MAX_SOURCE);
	if (!image) return {
		ok: false,
		error: "image"
	};
	const meta = sniffImage(image);
	if (!meta) return {
		ok: false,
		error: "image"
	};
	const aspect = (() => {
		const v = data.get("aspectRatio");
		return typeof v === "string" && /^\d+:\d+$/.test(v) ? v : "9:16";
	})();
	const dataUri = `data:${meta.mime};base64,${image.toString("base64")}`;
	let result = await imagineEdit(apiKey, dataUri, {
		resolution: "2k",
		aspect_ratio: aspect
	});
	if (!result.ok) result = await imagineEdit(apiKey, dataUri, {});
	if (!result.ok) return {
		ok: false,
		error: "failed"
	};
	return {
		ok: true,
		mime: result.mime,
		b64: result.bytes.toString("base64")
	};
});
var COPY_PROMPT = "You name phone wallpapers. Look at this photograph. Reply with JSON only, no markdown: {\"title\":\"...\",\"description\":\"...\",\"tags\":[\"...\",\"...\"]}. Title: 2–5 words, max 48 characters, poetic and specific to what is in the photo, no quotes. Description: one quiet sentence, max 160 characters, matching the scene, light, and mood. Tags: 3–6 lowercase single words from the photo (place, color, time, weather, subject). No brand names.";
async function visionCopy(apiKey, dataUri) {
	for (const model of ["grok-2-vision-1212", "grok-4"]) try {
		const res = await fetch("https://api.x.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				temperature: .35,
				messages: [{
					role: "user",
					content: [{
						type: "image_url",
						image_url: { url: dataUri }
					}, {
						type: "text",
						text: COPY_PROMPT
					}]
				}]
			}),
			signal: AbortSignal.timeout(25e3)
		});
		if (!res.ok) continue;
		const raw = (await res.json()).choices?.[0]?.message?.content?.trim();
		if (!raw) continue;
		const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
		const parsed = JSON.parse(jsonText);
		if (parsed && typeof parsed === "object") return parsed;
	} catch {}
	return null;
}
function cleanTitle(v) {
	if (typeof v !== "string") return "";
	return v.replace(/["“”]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}
function cleanBody(v) {
	if (typeof v !== "string") return "";
	return v.replace(/\s+/g, " ").trim().slice(0, 280);
}
function cleanTags(v) {
	if (!Array.isArray(v)) return [];
	const out = [];
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
var suggestStudioCopy_createServerFn_handler = createServerRpc({
	id: "19d493312422d96094bcc5a80b6d3cf0241bcfed8419044d366c15d62d71dd7b",
	name: "suggestStudioCopy",
	filename: "src/lib/server/enhance.ts"
}, (opts) => suggestStudioCopy.__executeServer(opts));
var suggestStudioCopy = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(suggestStudioCopy_createServerFn_handler, async ({ context, data }) => {
	if (!await marketplaceEnabled()) return {
		ok: false,
		error: "off"
	};
	if ((await (await getSql()).query(`select status from creator_profiles where user_id = $1 limit 1`, [context.userId]))[0]?.status !== "approved") return {
		ok: false,
		error: "forbidden"
	};
	const image = await formBlob(data, "image", MAX_SOURCE);
	if (!image) return {
		ok: false,
		error: "image"
	};
	const meta = sniffImage(image);
	if (!meta) return {
		ok: false,
		error: "image"
	};
	const apiKey = process.env.XAI_API_KEY;
	const dataUri = `data:${meta.mime};base64,${image.toString("base64")}`;
	const parsed = apiKey ? await visionCopy(apiKey, dataUri) : null;
	const title = cleanTitle(parsed?.title);
	const description = cleanBody(parsed?.description);
	const tags = cleanTags(parsed?.tags);
	if (!title && !description) return {
		ok: false,
		error: "failed"
	};
	return {
		ok: true,
		title,
		description,
		tags
	};
});
//#endregion
export { enhanceStudioPlate_createServerFn_handler, suggestStudioCopy_createServerFn_handler };

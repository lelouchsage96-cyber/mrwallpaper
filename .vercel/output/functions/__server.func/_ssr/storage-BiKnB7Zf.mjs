import { c as __exportAll } from "./ssr.mjs";
import { L as mediaUrl, k as getSql } from "./queries-bIh47-yB.mjs";
import { createHash, createHmac } from "node:crypto";
//#region node_modules/.nitro/vite/services/ssr/assets/storage-BiKnB7Zf.js
/** Creator original and enhanced upload cap. */
var MAX_ORIGINAL_BYTES = 15728640;
var cached;
var hydrated = false;
function strip(value) {
	return value.trim().replace(/\/$/, "");
}
function envConfig() {
	return {
		accountId: strip(process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? ""),
		accessKeyId: strip(process.env.R2_ACCESS_KEY_ID ?? ""),
		secretAccessKey: strip(process.env.R2_SECRET_ACCESS_KEY ?? ""),
		bucket: strip(process.env.R2_BUCKET ?? "mrwallpaper"),
		publicUrl: strip(process.env.R2_PUBLIC_URL ?? "")
	};
}
function parseSetting(value) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) try {
			return String(JSON.parse(trimmed));
		} catch {
			return trimmed.slice(1, -1);
		}
		return trimmed;
	}
	if (value == null) return "";
	return String(value).trim();
}
function configureR2(next) {
	const cur = cached ?? emptyConfig();
	cached = {
		accountId: strip(next.accountId ?? cur.accountId),
		accessKeyId: strip(next.accessKeyId ?? cur.accessKeyId),
		secretAccessKey: strip(next.secretAccessKey ?? cur.secretAccessKey),
		bucket: strip(next.bucket ?? cur.bucket) || "mrwallpaper",
		publicUrl: strip(next.publicUrl ?? cur.publicUrl)
	};
}
function emptyConfig() {
	return {
		accountId: "",
		accessKeyId: "",
		secretAccessKey: "",
		bucket: "mrwallpaper",
		publicUrl: ""
	};
}
async function hydrateR2() {
	if (hydrated) return;
	hydrated = true;
	const fromEnv = envConfig();
	if (fromEnv.accountId && fromEnv.accessKeyId && fromEnv.secretAccessKey) {
		configureR2({
			...emptyConfig(),
			...fromEnv
		});
		return;
	}
	try {
		const rows = await (await getSql()).query(`select key, value from app_settings
       where key in ('r2_account_id','r2_access_key_id','r2_secret_access_key','r2_bucket','r2_public_url')`);
		const map = new Map(rows.map((r) => [r.key, r.value]));
		configureR2({
			accountId: parseSetting(map.get("r2_account_id")) || fromEnv.accountId || "",
			accessKeyId: parseSetting(map.get("r2_access_key_id")) || fromEnv.accessKeyId || "",
			secretAccessKey: parseSetting(map.get("r2_secret_access_key")) || fromEnv.secretAccessKey || "",
			bucket: parseSetting(map.get("r2_bucket")) || fromEnv.bucket || "mrwallpaper",
			publicUrl: parseSetting(map.get("r2_public_url")) || fromEnv.publicUrl || ""
		});
	} catch {
		configureR2({
			...emptyConfig(),
			...fromEnv
		});
	}
}
async function r2Config() {
	await hydrateR2();
	return cached ?? emptyConfig();
}
async function r2Configured() {
	const c = await r2Config();
	return Boolean(c.accountId && c.accessKeyId && c.secretAccessKey && c.bucket);
}
function r2PublicUrlFor(key, cfg) {
	if (!cfg.publicUrl) return null;
	return `${strip(cfg.publicUrl)}/${key.replace(/^\//, "")}`;
}
function sha256Hex(data) {
	return createHash("sha256").update(data).digest("hex");
}
function hmac(key, data) {
	return createHmac("sha256", key).update(data, "utf8").digest();
}
function encodePath(path) {
	return path.split("/").map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");
}
function amzDate(d = /* @__PURE__ */ new Date()) {
	const iso = d.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
	return {
		amz: iso,
		day: iso.slice(0, 8)
	};
}
async function signedFetch(cfg, method, key, body, contentType) {
	const url = new URL(`https://${cfg.accountId}.r2.cloudflarestorage.com/${cfg.bucket}/${key}`);
	const { amz, day } = amzDate();
	const payloadHash = sha256Hex(body ?? Buffer.alloc(0));
	const headers = {
		host: url.host,
		"x-amz-content-sha256": payloadHash,
		"x-amz-date": amz
	};
	if (contentType) headers["content-type"] = contentType;
	const signedHeaderNames = Object.keys(headers).sort();
	const canonicalHeaders = signedHeaderNames.map((n) => `${n}:${headers[n]}\n`).join("");
	const signedHeaders = signedHeaderNames.join(";");
	const canonical = [
		method,
		encodePath(url.pathname),
		"",
		canonicalHeaders,
		signedHeaders,
		payloadHash
	].join("\n");
	const scope = `${day}/auto/s3/aws4_request`;
	const stringToSign = [
		"AWS4-HMAC-SHA256",
		amz,
		scope,
		sha256Hex(canonical)
	].join("\n");
	const kSigning = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, day), "auto"), "s3"), "aws4_request");
	const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
	headers.authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
	const { host: _host, ...rest } = headers;
	return fetch(url, {
		method,
		headers: rest,
		body: body && (method === "PUT" || method === "POST") ? new Uint8Array(body) : void 0
	});
}
async function r2Put(key, body, mime) {
	const res = await signedFetch(await r2Config(), "PUT", key, body, mime || "application/octet-stream");
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`R2 put failed (${res.status}) ${text.slice(0, 180)}`);
	}
}
async function r2Get(key) {
	const res = await signedFetch(await r2Config(), "GET", key);
	if (res.status === 404) return null;
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`R2 get failed (${res.status}) ${text.slice(0, 180)}`);
	}
	return {
		bytes: Buffer.from(await res.arrayBuffer()),
		mime: res.headers.get("content-type") || "application/octet-stream"
	};
}
async function r2Delete(key) {
	const res = await signedFetch(await r2Config(), "DELETE", key);
	if (!res.ok && res.status !== 404) {
		const text = await res.text().catch(() => "");
		throw new Error(`R2 delete failed (${res.status}) ${text.slice(0, 180)}`);
	}
}
async function pingR2() {
	if (!await r2Configured()) return {
		ok: false,
		error: "missing credentials"
	};
	const key = `health/${crypto.randomUUID()}.txt`;
	const body = Buffer.from("ok", "utf8");
	try {
		await r2Put(key, body, "text/plain");
		const got = await r2Get(key);
		await r2Delete(key);
		if (!got || got.bytes.toString("utf8") !== "ok") return {
			ok: false,
			error: "round-trip mismatch"
		};
		return { ok: true };
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "r2 error"
		};
	}
}
function supabaseProjectUrl() {
	return "";
}
function supabaseProjectRef() {
	return "";
}
function supabaseHasKey() {
	return false;
}
var storage_exports = /* @__PURE__ */ __exportAll({
	downloadStored: () => downloadStored,
	loadMediaFile: () => loadMediaFile,
	persistPlateMedia: () => persistPlateMedia,
	removePlateMedia: () => removePlateMedia,
	storageBackend: () => storageBackend,
	storeStudioOriginal: () => storeStudioOriginal,
	storeStudioPart: () => storeStudioPart
});
async function storageBackend() {
	if (await r2Configured()) return "r2";
	return "database";
}
async function downloadStored(storage, storageKey, data) {
	if (storage === "r2" && storageKey) try {
		const obj = await r2Get(storageKey);
		if (obj) return obj;
	} catch (err) {
		console.error("[storage] r2 get", storageKey, err);
	}
	if (data == null) return null;
	const { bytesFromUnknown } = await import("./queries-bIh47-yB.mjs").then((n) => n.G).then((n) => n.X);
	try {
		const bytes = Buffer.from(bytesFromUnknown(data));
		if (!bytes.length) return null;
		return { bytes };
	} catch (err) {
		console.error("[storage] decode", err);
		return null;
	}
}
async function insertPointer(sql, id, mime, bytes, width, height, data, storage, storageKey) {
	await sql.query(`insert into media_files (id, mime, bytes, width, height, data, storage, storage_key)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`, [
		id,
		mime,
		bytes,
		width,
		height,
		data ?? Buffer.alloc(0),
		storage,
		storageKey
	]);
}
async function storeStudioOriginal(opts) {
	if (opts.bytes.length > 15728640) throw new Error("size");
	const stamp = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
	const ext = opts.ext.replace(/^\./, "") || "jpg";
	const key = `originals/inbox/${opts.userId}-${stamp}.${ext}`;
	if (await r2Configured()) {
		await r2Put(key, opts.bytes, opts.mime);
		return {
			key,
			bytes: opts.bytes.length
		};
	}
	const sql = await getSql();
	const id = `inbox-${stamp}`;
	await insertPointer(sql, id, opts.mime, opts.bytes.length, 0, 0, opts.bytes, "db", null);
	return {
		key: `media:${id}`,
		bytes: opts.bytes.length
	};
}
var g = globalThis;
function partMap() {
	g.__mwUploadParts ??= /* @__PURE__ */ new Map();
	return g.__mwUploadParts;
}
async function storeStudioPart(opts) {
	if (opts.count < 1 || opts.count > 8 || opts.index < 0 || opts.index >= opts.count) throw new Error("chunk");
	const id = `${opts.userId}:${opts.uploadId}`;
	if (await r2Configured()) {
		await r2Put(`tmp/${id}/${opts.index}`, opts.bytes, "application/octet-stream");
		if (opts.index < opts.count - 1) return { pending: true };
		const parts = [];
		for (let i = 0; i < opts.count; i += 1) {
			const got = await r2Get(`tmp/${id}/${i}`);
			if (!got) throw new Error("chunk");
			parts.push(got.bytes);
			await r2Delete(`tmp/${id}/${i}`).catch(() => void 0);
		}
		return storeStudioOriginal({
			userId: opts.userId,
			bytes: Buffer.concat(parts),
			mime: opts.mime,
			ext: opts.ext
		});
	}
	const map = partMap();
	const slot = map.get(id) ?? {
		userId: opts.userId,
		mime: opts.mime,
		count: opts.count,
		parts: Array(opts.count).fill(null)
	};
	if (slot.userId !== opts.userId || slot.count !== opts.count) throw new Error("chunk");
	slot.parts[opts.index] = opts.bytes;
	map.set(id, slot);
	if (slot.parts.some((p) => !p)) return { pending: true };
	const bytes = Buffer.concat(slot.parts);
	map.delete(id);
	return storeStudioOriginal({
		userId: opts.userId,
		bytes,
		mime: opts.mime,
		ext: opts.ext
	});
}
async function persistPlateMedia(sql, opts) {
	const stamp = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
	const originalId = `${opts.wallpaperId}-orig-${stamp}`;
	const previewId = `${opts.wallpaperId}-prev-${stamp}`;
	const thumbId = `${opts.wallpaperId}-thumb-${stamp}`;
	const ext = opts.format === "png" ? "png" : opts.format === "webp" ? "webp" : "jpg";
	const inboxKey = opts.originalKey?.startsWith("originals/") ? opts.originalKey : null;
	const mediaKey = opts.originalKey?.startsWith("media:") ? opts.originalKey.slice(6) : null;
	const originalKey = inboxKey ?? `originals/${opts.wallpaperId}-${stamp}.${ext}`;
	const previewKey = `previews/${opts.wallpaperId}-${stamp}.jpg`;
	const thumbKey = `thumbs/${opts.wallpaperId}-${stamp}.jpg`;
	const originalBytes = opts.originalBytes || opts.original.length || 0;
	if (await r2Configured() && !mediaKey) try {
		if (!inboxKey) await r2Put(originalKey, opts.original, opts.mime);
		await r2Put(previewKey, opts.preview, "image/jpeg");
		await r2Put(thumbKey, opts.thumb, "image/jpeg");
		const cfg = await r2Config();
		await insertPointer(sql, originalId, opts.mime, originalBytes, opts.width, opts.height, null, "r2", originalKey);
		await insertPointer(sql, previewId, "image/jpeg", opts.preview.length, opts.previewWidth, opts.previewHeight, null, "r2", previewKey);
		await insertPointer(sql, thumbId, "image/jpeg", opts.thumb.length, opts.thumbWidth, opts.thumbHeight, null, "r2", thumbKey);
		return {
			originalId,
			previewId,
			thumbId,
			originalPath: mediaUrl(originalId),
			previewPath: r2PublicUrlFor(previewKey, cfg) ?? mediaUrl(previewId),
			thumbPath: r2PublicUrlFor(thumbKey, cfg) ?? mediaUrl(thumbId)
		};
	} catch (err) {
		console.error("[storage] r2 persist failed, using database", err);
	}
	if (mediaKey) await sql.query(`update media_files set id = $1, width = $2, height = $3 where id = $4`, [
		originalId,
		opts.width,
		opts.height,
		mediaKey
	]);
	else await insertPointer(sql, originalId, opts.mime, opts.original.length, opts.width, opts.height, opts.original, "db", null);
	await insertPointer(sql, previewId, "image/jpeg", opts.preview.length, opts.previewWidth, opts.previewHeight, opts.preview, "db", null);
	await insertPointer(sql, thumbId, "image/jpeg", opts.thumb.length, opts.thumbWidth, opts.thumbHeight, opts.thumb, "db", null);
	return {
		originalId,
		previewId,
		thumbId,
		originalPath: mediaUrl(originalId),
		previewPath: mediaUrl(previewId),
		thumbPath: mediaUrl(thumbId)
	};
}
async function removePlateMedia(sql, wallpaperId) {
	const files = await sql.query(`select id, storage, storage_key from media_files where id like $1`, [`${wallpaperId}-%`]);
	for (const file of files) if (file.storage === "r2" && file.storage_key) try {
		await r2Delete(file.storage_key);
	} catch (err) {
		console.error("[storage] r2 delete", file.storage_key, err);
	}
	if (files.length) await sql.query(`delete from media_files where id like $1`, [`${wallpaperId}-%`]);
}
async function loadMediaFile(id) {
	const sql = await getSql();
	try {
		const row = (await sql.query(`select mime, data, storage, storage_key from media_files where id = $1 limit 1`, [id]))[0];
		if (!row) return null;
		const stored = await downloadStored(row.storage, row.storage_key, row.data);
		if (!stored) return null;
		return {
			mime: stored.mime || row.mime,
			bytes: stored.bytes
		};
	} catch {
		const row = (await sql.query(`select mime, data from media_files where id = $1 limit 1`, [id]))[0];
		if (!row || row.data == null) return null;
		const { bytesFromUnknown } = await import("./queries-bIh47-yB.mjs").then((n) => n.G).then((n) => n.X);
		try {
			return {
				mime: row.mime,
				bytes: Buffer.from(bytesFromUnknown(row.data))
			};
		} catch (err) {
			console.error("[storage] load", id, err);
			return null;
		}
	}
}
//#endregion
export { storage_exports as a, supabaseHasKey as c, configureR2 as d, pingR2 as f, MAX_ORIGINAL_BYTES as h, storageBackend as i, supabaseProjectRef as l, r2Configured as m, persistPlateMedia as n, storeStudioOriginal as o, r2Config as p, removePlateMedia as r, storeStudioPart as s, loadMediaFile as t, supabaseProjectUrl as u };

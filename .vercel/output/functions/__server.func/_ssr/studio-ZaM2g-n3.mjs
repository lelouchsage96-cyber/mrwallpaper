import { r as createServerFn } from "./ssr.mjs";
import { $ as sniffImage, H as parseDeviceType, I as marketplaceEnabled, Q as slugify, W as premiumEnabled, X as resolvePreview, Z as resolveThumb, c as bytesFromUnknown, d as daySeed, et as suggestDuos, j as inferDeviceType, k as getSql, o as authMiddleware, tt as uniqueWallpaperSlug, v as fetchCardsByIds, x as fetchCreators, y as fetchCategories } from "./queries-bIh47-yB.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { t as optionalAuthMiddleware } from "./optional-auth-yQgEKcq6.mjs";
import { gn as object, un as array, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { h as MAX_ORIGINAL_BYTES, n as persistPlateMedia, r as removePlateMedia } from "./storage-BiKnB7Zf.mjs";
import { t as SHA256 } from "./hash-DS_bR68I.mjs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
//#region node_modules/.nitro/vite/services/ssr/assets/studio-ZaM2g-n3.js
var catalogHashed = false;
function sha256Buffer(buf) {
	return createHash("sha256").update(buf).digest("hex");
}
async function ensureSourceColumn(sql) {
	await sql.query(`alter table wallpapers add column if not exists source_sha256 text`);
}
async function hashFromPath(sql, path) {
	if (!path) return null;
	try {
		if (path.startsWith("/api/media/")) {
			const mediaId = path.slice(11);
			if (!mediaId) return null;
			const row = (await sql.query(`select data, storage, storage_key from media_files where id = $1 limit 1`, [mediaId]))[0];
			if (!row) return null;
			if ((row.storage === "supabase" || row.storage === "r2") && row.storage_key) {
				const { downloadStored } = await import("./storage-BiKnB7Zf.mjs").then((n) => n.a);
				const stored = await downloadStored(row.storage, row.storage_key, row.data);
				if (!stored) return null;
				return sha256Buffer(stored.bytes);
			}
			if (row.data == null) return null;
			return sha256Buffer(bytesFromUnknown(row.data));
		}
		if (path.startsWith("https://") || path.startsWith("http://")) {
			const res = await fetch(path, { signal: AbortSignal.timeout(15e3) });
			if (!res.ok) return null;
			return sha256Buffer(Buffer.from(await res.arrayBuffer()));
		}
		if (path.startsWith("/wallpapers/")) return sha256Buffer(await readFile(join(process.cwd(), "public", path.slice(1))));
	} catch (err) {
		console.error("[dupes] hash failed", path, err);
	}
	return null;
}
async function ensureCatalogHashes(sql) {
	if (catalogHashed) return;
	catalogHashed = true;
	try {
		await ensureSourceColumn(sql);
		const missing = await sql.query(`select w.id,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'original' limit 1) as path
       from wallpapers w
       where w.sha256 is null`);
		for (const row of missing) {
			const hash = await hashFromPath(sql, row.path);
			if (!hash) continue;
			await sql.query(`update wallpapers
            set sha256 = $1, source_sha256 = coalesce(source_sha256, $1)
          where id = $2 and sha256 is null`, [hash, row.id]);
		}
		await sql.query(`update wallpapers w
          set status = 'removed', updated_at = now()
        where w.status in ('draft', 'pending', 'approved')
          and w.sha256 is not null
          and exists (
            select 1 from wallpapers o
            where o.status in ('draft', 'pending', 'approved')
              and o.id <> w.id
              and (
                o.sha256 = w.sha256
                or (w.source_sha256 is not null and o.source_sha256 = w.source_sha256)
                or o.source_sha256 = w.sha256
                or (w.source_sha256 is not null and o.sha256 = w.source_sha256)
              )
              and (o.created_at < w.created_at or (o.created_at = w.created_at and o.id < w.id))
          )`);
	} catch (err) {
		catalogHashed = false;
		console.error("[dupes] catalog hash failed", err);
		throw err;
	}
}
async function findDuplicate(sql, hashes, excludeId) {
	await ensureCatalogHashes(sql);
	const unique = [...new Set(hashes.filter((h) => /^[a-f0-9]{64}$/.test(h)))];
	if (unique.length === 0) return null;
	const a = unique[0];
	const b = unique[1] ?? unique[0];
	const skip = excludeId && excludeId.length > 0 ? excludeId : "";
	const row = (await sql.query(`select id, creator_id
     from wallpapers
     where status in ('draft', 'pending', 'approved')
       and (sha256 = $1 or sha256 = $2 or source_sha256 = $1 or source_sha256 = $2)
       and id <> $3
     order by created_at asc, id asc
     limit 1`, [
		a,
		b,
		skip
	]))[0];
	if (!row) return null;
	return {
		id: row.id,
		creatorId: row.creator_id
	};
}
var SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
var NOTIONAL_PER_DOWNLOAD = .04;
var MAX_TAGS = 8;
function parseJson(value, fallback) {
	if (value === null || value === void 0) return fallback;
	if (typeof value === "string") try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
	return value;
}
function slugifyTag(name) {
	return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}
function formString(form, key) {
	const v = form.get(key);
	return typeof v === "string" ? v.trim() : "";
}
function formDevice(form, width, height) {
	const raw = formString(form, "deviceType");
	if (raw === "phone" || raw === "tablet" || raw === "both") return raw;
	return inferDeviceType(width, height);
}
function formHex(form, key) {
	const v = formString(form, key).toLowerCase();
	return SHA256.test(v) ? v : null;
}
function parseTagNames(form) {
	const raw = formString(form, "tags");
	let items = [];
	if (raw) try {
		const parsed = JSON.parse(raw);
		items = Array.isArray(parsed) ? parsed : [parsed];
	} catch {
		items = raw.split(",");
	}
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const item of items) {
		const name = String(item ?? "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 24);
		if (name.length < 2) continue;
		const slug = slugifyTag(name);
		if (!slug || seen.has(slug)) continue;
		seen.add(slug);
		out.push(name);
		if (out.length >= MAX_TAGS) break;
	}
	return out;
}
async function attachTags(sql, wallpaperId, names) {
	await sql.query(`delete from wallpaper_tags where wallpaper_id = $1`, [wallpaperId]);
	for (const name of names) {
		const slug = slugifyTag(name);
		if (!slug) continue;
		const id = `tag-${slug}`.slice(0, 40);
		await sql.query(`insert into tags (id, slug, name) values ($1, $2, $3)
       on conflict (slug) do nothing`, [
			id,
			slug,
			name
		]);
		const tagId = (await sql.query(`select id from tags where slug = $1 limit 1`, [slug]))[0]?.id;
		if (!tagId) continue;
		await sql.query(`insert into wallpaper_tags (wallpaper_id, tag_id) values ($1, $2)
       on conflict do nothing`, [wallpaperId, tagId]);
	}
}
async function requireApprovedCreator(userId) {
	if (!await marketplaceEnabled()) return {
		ok: false,
		error: "off"
	};
	const sql = await getSql();
	if ((await sql.query(`select status from creator_profiles where user_id = $1 limit 1`, [userId]))[0]?.status !== "approved") return {
		ok: false,
		error: "forbidden"
	};
	return {
		ok: true,
		sql
	};
}
var listCreators_createServerFn_handler = createServerRpc({
	id: "44dbf2d375a90bc52d01f9258fa1be2bab28e7ae402e3f4638b3979e85014c5d",
	name: "listCreators",
	filename: "src/lib/server/studio.ts"
}, (opts) => listCreators.__executeServer(opts));
var listCreators = createServerFn({ method: "GET" }).handler(listCreators_createServerFn_handler, async () => {
	if (!await marketplaceEnabled()) return {
		items: [],
		marketplaceOn: false
	};
	return {
		items: await fetchCreators(24),
		marketplaceOn: true
	};
});
var getCreatorPage_createServerFn_handler = createServerRpc({
	id: "6f9cbaa11f2694f2073332a3ddb40877137464849f374546a7daec6341a8b98b",
	name: "getCreatorPage",
	filename: "src/lib/server/studio.ts"
}, (opts) => getCreatorPage.__executeServer(opts));
var getCreatorPage = createServerFn({ method: "GET" }).middleware([optionalAuthMiddleware]).validator(object({ slug: string() })).handler(getCreatorPage_createServerFn_handler, async ({ context, data }) => {
	try {
		const sql = await getSql();
		const row = (await sql.query(`select user_id, slug, display_name, bio
       from creator_profiles
       where slug = $1 and status = 'approved'
       limit 1`, [data.slug]))[0];
		if (!row) return { creator: null };
		const owned = await sql.query(`select id from wallpapers
       where creator_id = $1 and status = 'approved'
       order by download_count desc`, [row.user_id]);
		const items = await fetchCardsByIds(owned.map((r) => r.id), context.userId);
		let pairs = [];
		try {
			pairs = suggestDuos(items, {
				count: 3,
				seed: daySeed(row.slug)
			});
		} catch (err) {
			console.error("[creator] duos", err);
		}
		return { creator: {
			slug: row.slug,
			displayName: row.display_name,
			bio: row.bio,
			pieceCount: items.length,
			items,
			pairs
		} };
	} catch (err) {
		console.error("[creator]", err);
		return { creator: null };
	}
});
var getStudioDashboard_createServerFn_handler = createServerRpc({
	id: "53e7c756528605e719cc540d4691eb0ec489d177447ab478ec0b549da1ec816e",
	name: "getStudioDashboard",
	filename: "src/lib/server/studio.ts"
}, (opts) => getStudioDashboard.__executeServer(opts));
var getStudioDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getStudioDashboard_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const on = await marketplaceEnabled();
	const empty = {
		marketplaceOn: on,
		status: "none",
		slug: null,
		displayName: null,
		bio: "",
		liveCount: 0,
		pendingCount: 0,
		downloads: 0,
		estimatedShare: 0,
		creatorSharePercent: 80,
		minPayout: 50,
		pieces: [],
		platesLeft: 0
	};
	if (!on) return empty;
	const shareRows = await sql.query(`select value from app_settings where key = 'creator_share_percent' limit 1`);
	const minRows = await sql.query(`select value from app_settings where key = 'min_payout_amount' limit 1`);
	const share = Number(parseJson(shareRows[0]?.value, 80));
	const minPayout = Number(parseJson(minRows[0]?.value, 50));
	const profile = await sql.query(`select slug, display_name, bio, status from creator_profiles where user_id = $1 limit 1`, [context.userId]);
	const plates = await sql.query(`select count(*)::int as n from wallpapers
       where status = 'draft' and creator_id is null`);
	empty.platesLeft = plates[0]?.n ?? 0;
	empty.creatorSharePercent = share;
	empty.minPayout = minPayout;
	const row = profile[0];
	if (!row) return empty;
	const pieces = await sql.query(`select w.id, w.title, w.status, w.access_type, w.download_count,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url
       from wallpapers w
       where w.creator_id = $1 and w.status <> 'removed'
       order by w.created_at desc`, [context.userId]);
	const live = pieces.filter((p) => p.status === "approved");
	const pending = pieces.filter((p) => p.status === "pending");
	const downloads = live.reduce((sum, p) => sum + (Number(p.download_count) || 0), 0);
	return {
		marketplaceOn: on,
		status: row.status,
		slug: row.slug,
		displayName: row.display_name,
		bio: row.bio,
		liveCount: live.length,
		pendingCount: pending.length,
		downloads,
		estimatedShare: downloads * NOTIONAL_PER_DOWNLOAD * (share / 100),
		creatorSharePercent: share,
		minPayout,
		platesLeft: plates[0]?.n ?? 0,
		pieces: pieces.map((p) => ({
			id: p.id,
			title: p.title,
			status: p.status,
			accessType: p.access_type,
			thumbnailUrl: resolveThumb(p.id, p.thumbnail_url),
			downloadCount: Number(p.download_count) || 0
		}))
	};
});
var applyToStudio_createServerFn_handler = createServerRpc({
	id: "4bad9d66b6debb590e6fa38b25502c05546e9ffe63f7eee00b3a9a99279ec7d9",
	name: "applyToStudio",
	filename: "src/lib/server/studio.ts"
}, (opts) => applyToStudio.__executeServer(opts));
var applyToStudio = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	displayName: string().trim().min(2).max(40),
	slug: string().trim().min(3).max(32),
	bio: string().trim().max(280).optional()
})).handler(applyToStudio_createServerFn_handler, async ({ context, data }) => {
	if (!await marketplaceEnabled()) return {
		ok: false,
		error: "off"
	};
	const slug = data.slug.toLowerCase();
	if (!SLUG.test(slug)) return {
		ok: false,
		error: "slug"
	};
	const sql = await getSql();
	await sql.query(`insert into profiles (user_id) values ($1) on conflict (user_id) do nothing`, [context.userId]);
	if ((await sql.query(`select user_id from creator_profiles where slug = $1 and user_id <> $2 limit 1`, [slug, context.userId]))[0]) return {
		ok: false,
		error: "taken"
	};
	const existing = await sql.query(`select status from creator_profiles where user_id = $1 limit 1`, [context.userId]);
	if (existing[0]?.status === "approved" || existing[0]?.status === "pending") return { ok: true };
	await sql.query(`insert into creator_profiles (user_id, slug, display_name, bio, status, applied_at)
       values ($1, $2, $3, $4, 'pending', now())
       on conflict (user_id) do update
         set slug = $2, display_name = $3, bio = $4, status = 'pending',
             applied_at = now(), reviewed_at = null, review_note = null`, [
		context.userId,
		slug,
		data.displayName,
		data.bio ?? ""
	]);
	return { ok: true };
});
var listStudioPlates_createServerFn_handler = createServerRpc({
	id: "930e8c0fd7f8e6c7437827e257e9de8daa6e21cdf1d3f4b7db90f0e63ec4b97a",
	name: "listStudioPlates",
	filename: "src/lib/server/studio.ts"
}, (opts) => listStudioPlates.__executeServer(opts));
var listStudioPlates = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listStudioPlates_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	if ((await sql.query(`select status from creator_profiles where user_id = $1 limit 1`, [context.userId]))[0]?.status !== "approved") return {
		categories: [],
		tags: [],
		premiumOn: false
	};
	const tagRows = await sql.query(`select slug, name from tags order by name asc`);
	return {
		categories: await fetchCategories(),
		tags: tagRows.map((r) => ({
			slug: r.slug,
			name: r.name
		})),
		premiumOn: await premiumEnabled()
	};
});
var checkStudioDuplicate_createServerFn_handler = createServerRpc({
	id: "0362c0535c5c3ae998836e8cc123daa35ee102ac157f615f36e20eb593455c69",
	name: "checkStudioDuplicate",
	filename: "src/lib/server/studio.ts"
}, (opts) => checkStudioDuplicate.__executeServer(opts));
var checkStudioDuplicate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	hashes: array(string().regex(/^[a-f0-9]{64}$/)).min(1).max(4),
	excludeId: string().min(1).nullish()
})).handler(checkStudioDuplicate_createServerFn_handler, async ({ context, data }) => {
	try {
		const gate = await requireApprovedCreator(context.userId);
		if (!gate.ok) return { hit: false };
		const hit = await findDuplicate(gate.sql, data.hashes, data.excludeId);
		if (!hit) return { hit: false };
		return {
			hit: true,
			own: hit.creatorId === context.userId
		};
	} catch (err) {
		console.error("[studio] duplicate check failed", err);
		throw err;
	}
});
var getStudioPiece_createServerFn_handler = createServerRpc({
	id: "ec34752662581a89c192d07295104972ce1bac2af98770ddd70999b3d5a24203",
	name: "getStudioPiece",
	filename: "src/lib/server/studio.ts"
}, (opts) => getStudioPiece.__executeServer(opts));
var getStudioPiece = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ id: string().min(1) })).handler(getStudioPiece_createServerFn_handler, async ({ context, data }) => {
	const gate = await requireApprovedCreator(context.userId);
	if (!gate.ok) return { piece: null };
	const row = (await gate.sql.query(`select w.id, w.title, w.description, w.category_id, w.access_type, w.status, w.download_count, w.device_type,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'thumbnail' limit 1) as thumbnail_url,
              (select a.path from wallpaper_assets a
                where a.wallpaper_id = w.id and a.kind = 'preview' limit 1) as preview_url
       from wallpapers w
       where w.id = $1 and w.creator_id = $2 and w.status <> 'removed'
       limit 1`, [data.id, context.userId]))[0];
	if (!row) return { piece: null };
	const tagRows = await gate.sql.query(`select t.name from wallpaper_tags wt
       join tags t on t.id = wt.tag_id
       where wt.wallpaper_id = $1`, [row.id]);
	return { piece: {
		id: row.id,
		title: row.title,
		description: row.description,
		categoryId: row.category_id,
		accessType: row.access_type,
		status: row.status,
		thumbnailUrl: resolveThumb(row.id, row.thumbnail_url),
		previewUrl: resolvePreview(row.id, row.preview_url),
		downloadCount: Number(row.download_count) || 0,
		tags: tagRows.map((t) => t.name),
		deviceType: parseDeviceType(row.device_type)
	} };
});
var MAX_ORIGINAL = MAX_ORIGINAL_BYTES;
var MAX_PREVIEW = MAX_ORIGINAL_BYTES;
var MAX_THUMB = 8e5;
function aspectLabel(w, h) {
	if (!w || !h) return "1:1";
	const r = w / h;
	const hit = [
		[9 / 16, "9:16"],
		[16 / 9, "16:9"],
		[1, "1:1"],
		[4 / 3, "4:3"],
		[3 / 4, "3:4"],
		[3 / 2, "3:2"],
		[2 / 3, "2:3"],
		[21 / 9, "21:9"],
		[9 / 21, "9:21"]
	].find(([v]) => Math.abs(r - v) < .045);
	return hit ? hit[1] : `${w}:${h}`;
}
async function formBuffer(form, key, max) {
	const v = form.get(key);
	if (!(v instanceof Blob)) return null;
	if (v.size < 32 || v.size > max) return null;
	return Buffer.from(await v.arrayBuffer());
}
var uploadStudioPlate_createServerFn_handler = createServerRpc({
	id: "cdfe48d0bbccc4a8f284660a011fc44322c5109c09f830a9193575f8764567ab",
	name: "uploadStudioPlate",
	filename: "src/lib/server/studio.ts"
}, (opts) => uploadStudioPlate.__executeServer(opts));
var uploadStudioPlate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(uploadStudioPlate_createServerFn_handler, async ({ context, data }) => {
	const gate = await requireApprovedCreator(context.userId);
	if (!gate.ok) return {
		ok: false,
		error: gate.error
	};
	const sql = gate.sql;
	const title = formString(data, "title");
	const description = formString(data, "description").slice(0, 280);
	const categoryId = formString(data, "categoryId");
	const accessType = "free";
	const tagNames = parseTagNames(data);
	const sourceSha = formHex(data, "sourceSha256");
	if (title.length < 2 || title.length > 60) return {
		ok: false,
		error: "title"
	};
	if (!(await fetchCategories()).some((c) => c.id === categoryId)) return {
		ok: false,
		error: "category"
	};
	const originalKey = formString(data, "originalKey");
	const original = originalKey ? Buffer.alloc(0) : await formBuffer(data, "original", MAX_ORIGINAL) ?? Buffer.alloc(0);
	const preview = await formBuffer(data, "preview", MAX_PREVIEW);
	const thumb = await formBuffer(data, "thumb", MAX_THUMB);
	if (!original.length && !originalKey || !preview || !thumb) return {
		ok: false,
		error: "image"
	};
	const imageMeta = original.length ? sniffImage(original) : {
		mime: formString(data, "mime") || "image/jpeg",
		format: formString(data, "format") || "jpg",
		width: Number(formString(data, "width")) || 0,
		height: Number(formString(data, "height")) || 0
	};
	if (!imageMeta || imageMeta.width < 8 || imageMeta.height < 8) return {
		ok: false,
		error: "ratio"
	};
	const mime = imageMeta.mime;
	const format = imageMeta.format;
	const width = imageMeta.width;
	const height = imageMeta.height;
	const originalBytes = original.length || Number(formString(data, "bytes")) || 0;
	const previewMeta = sniffImage(preview);
	const thumbMeta = sniffImage(thumb);
	if (!previewMeta || previewMeta.format !== "jpg" || !thumbMeta || thumbMeta.format !== "jpg") return {
		ok: false,
		error: "image"
	};
	const fileSha = original.length ? sha256Buffer(original) : formHex(data, "fileSha256") ?? sourceSha ?? "";
	if (!fileSha) return {
		ok: false,
		error: "image"
	};
	if (await findDuplicate(sql, [fileSha, sourceSha ?? fileSha])) return {
		ok: false,
		error: "duplicate"
	};
	const wallpaperId = `p${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
	const slug = await uniqueWallpaperSlug(slugify(title));
	const stored = await persistPlateMedia(sql, {
		wallpaperId,
		original,
		originalKey: originalKey || null,
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
		thumbHeight: thumbMeta.height
	});
	await sql.query(`insert into wallpapers
         (id, title, description, category_id, creator_id, access_type, status,
          width, height, file_size_bytes, format, aspect_ratio, device_type, sha256, source_sha256, published_at, slug, alt_text)
       values
         ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, $14, null, $15, $16)`, [
		wallpaperId,
		title,
		description,
		categoryId,
		context.userId,
		accessType,
		width,
		height,
		originalBytes,
		format,
		aspectLabel(width, height),
		formDevice(data, width, height),
		fileSha,
		sourceSha ?? fileSha,
		slug,
		title
	]);
	await sql.query(`insert into wallpaper_assets
         (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
       values
         ($1, $2, 'thumbnail', 'public', $3, $4, $5, $6, 'image/jpeg', true),
         ($7, $2, 'preview', 'public', $8, $9, $10, $11, 'image/jpeg', true),
         ($12, $2, 'original', 'protected', $13, $14, $15, $16, $17, false)`, [
		`${wallpaperId}-athumb`,
		wallpaperId,
		stored.thumbPath,
		thumbMeta.width,
		thumbMeta.height,
		thumb.length,
		`${wallpaperId}-aprev`,
		stored.previewPath,
		previewMeta.width,
		previewMeta.height,
		preview.length,
		`${wallpaperId}-aorig`,
		stored.originalPath,
		width,
		height,
		originalBytes,
		mime
	]);
	await attachTags(sql, wallpaperId, tagNames);
	return {
		ok: true,
		id: wallpaperId
	};
});
var updateStudioPlate_createServerFn_handler = createServerRpc({
	id: "943ac75d56c4910f93e9fc01e57cb651f81a8c91dc99b7e08f2a986a2e91fcb9",
	name: "updateStudioPlate",
	filename: "src/lib/server/studio.ts"
}, (opts) => updateStudioPlate.__executeServer(opts));
var updateStudioPlate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(updateStudioPlate_createServerFn_handler, async ({ context, data }) => {
	const gate = await requireApprovedCreator(context.userId);
	if (!gate.ok) return {
		ok: false,
		error: gate.error
	};
	const sql = gate.sql;
	const pieceId = formString(data, "pieceId");
	const title = formString(data, "title");
	const description = formString(data, "description").slice(0, 280);
	const categoryId = formString(data, "categoryId");
	const accessType = "free";
	const tagNames = parseTagNames(data);
	const sourceSha = formHex(data, "sourceSha256");
	if (!pieceId) return {
		ok: false,
		error: "piece"
	};
	if (title.length < 2 || title.length > 60) return {
		ok: false,
		error: "title"
	};
	if (!(await fetchCategories()).some((c) => c.id === categoryId)) return {
		ok: false,
		error: "category"
	};
	const existing = await sql.query(`select id, status from wallpapers
       where id = $1 and creator_id = $2 and status <> 'removed'
       limit 1`, [pieceId, context.userId]);
	if (!existing[0]) return {
		ok: false,
		error: "piece"
	};
	const originalKey = formString(data, "originalKey");
	const original = originalKey ? Buffer.alloc(0) : await formBuffer(data, "original", MAX_ORIGINAL) ?? Buffer.alloc(0);
	const preview = await formBuffer(data, "preview", MAX_PREVIEW);
	const thumb = await formBuffer(data, "thumb", MAX_THUMB);
	if (Boolean((original.length || originalKey) && preview && thumb) && preview && thumb) {
		const imageMeta = original.length ? sniffImage(original) : {
			mime: formString(data, "mime") || "image/jpeg",
			format: formString(data, "format") || "jpg",
			width: Number(formString(data, "width")) || 0,
			height: Number(formString(data, "height")) || 0
		};
		const previewMeta = sniffImage(preview);
		const thumbMeta = sniffImage(thumb);
		if (!imageMeta || !previewMeta || previewMeta.format !== "jpg" || !thumbMeta || thumbMeta.format !== "jpg") return {
			ok: false,
			error: "image"
		};
		if (imageMeta.width < 8 || imageMeta.height < 8) return {
			ok: false,
			error: "ratio"
		};
		const originalBytes = original.length || Number(formString(data, "bytes")) || 0;
		const fileSha = original.length ? sha256Buffer(original) : formHex(data, "fileSha256") ?? sourceSha ?? "";
		if (!fileSha) return {
			ok: false,
			error: "image"
		};
		if (await findDuplicate(sql, [fileSha, sourceSha ?? fileSha], pieceId)) return {
			ok: false,
			error: "duplicate"
		};
		await removePlateMedia(sql, pieceId);
		const stored = await persistPlateMedia(sql, {
			wallpaperId: pieceId,
			original,
			originalKey: originalKey || null,
			originalBytes,
			preview,
			thumb,
			mime: imageMeta.mime,
			format: imageMeta.format,
			width: imageMeta.width,
			height: imageMeta.height,
			previewWidth: previewMeta.width,
			previewHeight: previewMeta.height,
			thumbWidth: thumbMeta.width,
			thumbHeight: thumbMeta.height
		});
		await sql.query(`delete from wallpaper_assets where wallpaper_id = $1`, [pieceId]);
		await sql.query(`insert into wallpaper_assets
           (id, wallpaper_id, kind, bucket, path, width, height, bytes, mime, is_public)
         values
           ($1, $2, 'thumbnail', 'public', $3, $4, $5, $6, 'image/jpeg', true),
           ($7, $2, 'preview', 'public', $8, $9, $10, $11, 'image/jpeg', true),
           ($12, $2, 'original', 'protected', $13, $14, $15, $16, $17, false)`, [
			`${pieceId}-athumb`,
			pieceId,
			stored.thumbPath,
			thumbMeta.width,
			thumbMeta.height,
			thumb.length,
			`${pieceId}-aprev`,
			stored.previewPath,
			previewMeta.width,
			previewMeta.height,
			preview.length,
			`${pieceId}-aorig`,
			stored.originalPath,
			imageMeta.width,
			imageMeta.height,
			originalBytes,
			imageMeta.mime
		]);
		const nextStatus = existing[0].status === "approved" ? "pending" : existing[0].status;
		await sql.query(`update wallpapers
            set title = $1, description = $2, category_id = $3, access_type = $4,
                width = $5, height = $6, file_size_bytes = $7, format = $8, aspect_ratio = $9,
                device_type = $14,
                sha256 = $10, source_sha256 = $11, status = $12,
                published_at = case when $12 = 'pending' then null else published_at end,
                updated_at = now()
          where id = $13`, [
			title,
			description,
			categoryId,
			accessType,
			imageMeta.width,
			imageMeta.height,
			originalBytes,
			imageMeta.format,
			aspectLabel(imageMeta.width, imageMeta.height),
			fileSha,
			sourceSha ?? fileSha,
			nextStatus,
			pieceId,
			formDevice(data, imageMeta.width, imageMeta.height)
		]);
	} else await sql.query(`update wallpapers
            set title = $1, description = $2, category_id = $3, access_type = $4,
                device_type = $5, updated_at = now()
          where id = $6`, [
		title,
		description,
		categoryId,
		accessType,
		formDevice(data, 1080, 1920),
		pieceId
	]);
	await attachTags(sql, pieceId, tagNames);
	return {
		ok: true,
		id: pieceId
	};
});
//#endregion
export { applyToStudio_createServerFn_handler, checkStudioDuplicate_createServerFn_handler, getCreatorPage_createServerFn_handler, getStudioDashboard_createServerFn_handler, getStudioPiece_createServerFn_handler, listCreators_createServerFn_handler, listStudioPlates_createServerFn_handler, updateStudioPlate_createServerFn_handler, uploadStudioPlate_createServerFn_handler };

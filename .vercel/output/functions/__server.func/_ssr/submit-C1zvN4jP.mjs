import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { j as inferDeviceType, o as authMiddleware } from "./queries-bIh47-yB.mjs";
import { a as getStudioDashboard, c as listStudioPlates, d as uploadStudioPlate, n as checkStudioDuplicate, o as getStudioPiece, r as createSsrRpc, u as updateStudioPlate } from "./studio-B5cbP66D.mjs";
import { h as MAX_ORIGINAL_BYTES } from "./storage-BiKnB7Zf.mjs";
import { s as Sparkles, t as X } from "../_libs/lucide-react.mjs";
import { B as formatBytes, K as t, a as Route$5, z as cn } from "./router-DQ8icHtZ.mjs";
import { r as getBearerToken } from "./client-BXBOTlUB.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { t as Input } from "./input-BCaChIGK.mjs";
import { n as sha256Blob } from "./hash-DS_bR68I.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/submit-C1zvN4jP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var IMAGE_TYPE = /^image\/(jpeg|png|webp)$/i;
var VIDEO_TYPE = /^video\/(mp4|quicktime|webm)$/i;
var IMAGE_NAME = /\.(jpe?g|png|webp)$/i;
var VIDEO_NAME = /\.(mp4|mov|m4v|webm)$/i;
async function encodePlate(file) {
	const isVideo = VIDEO_TYPE.test(file.type) || VIDEO_NAME.test(file.name);
	const isImage = IMAGE_TYPE.test(file.type) || IMAGE_NAME.test(file.name);
	if (isVideo || !isImage) return {
		ok: false,
		error: "type"
	};
	if (file.size > 15728640) return {
		ok: false,
		error: "size"
	};
	return encodeImage(file);
}
async function encodeImage(file) {
	const bmp = await createImageBitmap(file);
	const width = bmp.width;
	const height = bmp.height;
	if (width < 8 || height < 8) {
		bmp.close();
		return {
			ok: false,
			error: "ratio"
		};
	}
	const longEdge = Math.max(width, height);
	const preview = await drawJpeg(bmp, Math.min(1280, longEdge), .84);
	const thumb = await drawJpeg(bmp, Math.min(480, longEdge), .72);
	bmp.close();
	return {
		ok: true,
		plate: {
			file,
			previewBlob: preview.blob,
			thumbBlob: thumb.blob,
			previewDataUrl: preview.dataUrl,
			width,
			height,
			bytes: file.size,
			mime: file.type || "image/jpeg",
			live: false
		}
	};
}
async function drawJpeg(bmp, longEdge, quality) {
	const scale = longEdge / Math.max(bmp.width, bmp.height);
	const w = Math.max(1, Math.round(bmp.width * scale));
	const h = Math.max(1, Math.round(bmp.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("canvas");
	ctx.drawImage(bmp, 0, 0, w, h);
	const dataUrl = canvas.toDataURL("image/jpeg", quality);
	return {
		blob: await canvasToJpeg(canvas, quality),
		dataUrl,
		w,
		h
	};
}
async function capToMax(file, max = MAX_ORIGINAL_BYTES) {
	if (file.size <= max) return file;
	const bmp = await createImageBitmap(file);
	let quality = .88;
	let long = Math.min(2560, Math.max(bmp.width, bmp.height));
	let out = file;
	try {
		for (let i = 0; i < 6; i += 1) {
			const drawn = await drawJpeg(bmp, long, quality);
			out = new File([drawn.blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
			if (out.size <= max) break;
			quality = Math.max(.6, quality - .08);
			long = Math.max(1080, Math.round(long * .88));
		}
	} finally {
		bmp.close();
	}
	return out;
}
function aspectFromSize(w, h) {
	if (!w || !h) return "1:1";
	const r = w / h;
	const hit = [
		[9 / 16, "9:16"],
		[9 / 19.5, "9:19.5"],
		[9 / 20, "9:20"],
		[16 / 9, "16:9"],
		[1, "1:1"],
		[4 / 3, "4:3"],
		[3 / 4, "3:4"],
		[3 / 2, "3:2"],
		[2 / 3, "2:3"],
		[21 / 9, "21:9"],
		[9 / 21, "9:21"]
	].find(([v]) => Math.abs(r - v) < .045);
	if (hit) return hit[1];
	const g = (a, b) => b ? g(b, a % b) : a;
	const d = g(Math.round(w), Math.round(h)) || 1;
	return `${Math.round(w / d)}:${Math.round(h / d)}`;
}
function canvasToJpeg(canvas, quality) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("blob")), "image/jpeg", quality);
	});
}
/** Downscale for the Imagine edit request — keep payload small, let the model output 2K. */
async function prepareEnhanceSource(file) {
	const bmp = await createImageBitmap(file);
	const aspect = aspectFromSize(bmp.width, bmp.height);
	const long = Math.max(bmp.width, bmp.height);
	const out = await drawJpeg(bmp, Math.min(1280, long), .84);
	bmp.close();
	return {
		blob: out.blob,
		aspect
	};
}
/** Local polish when Imagine is unavailable — contrast, color, light sharpen. */
async function enhanceLocalFile(file) {
	const bmp = await createImageBitmap(file);
	const srcLong = Math.max(bmp.width, bmp.height);
	const scale = srcLong > 2560 ? 2560 / srcLong : 1;
	const w = Math.max(1, Math.round(bmp.width * scale));
	const h = Math.max(1, Math.round(bmp.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bmp.close();
		throw new Error("canvas");
	}
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.filter = "contrast(1.12) saturate(1.14) brightness(1.03)";
	ctx.drawImage(bmp, 0, 0, w, h);
	ctx.filter = "none";
	sharpenCanvas(ctx, w, h);
	bmp.close();
	const blob = await canvasToJpeg(canvas, .92);
	return capToMax(new File([blob], "enhanced.jpg", { type: "image/jpeg" }));
}
function sharpenCanvas(ctx, w, h) {
	if (w * h > 4e6) return;
	const src = ctx.getImageData(0, 0, w, h);
	const out = ctx.createImageData(w, h);
	const s = src.data;
	const d = out.data;
	const mix = .28;
	for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
		const i = (y * w + x) * 4;
		if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
			d[i] = s[i];
			d[i + 1] = s[i + 1];
			d[i + 2] = s[i + 2];
			d[i + 3] = s[i + 3];
			continue;
		}
		for (let c = 0; c < 3; c += 1) {
			const center = s[i + c];
			const sharp = center * 5 - s[i - 4 + c] - s[i + 4 + c] - s[i - w * 4 + c] - s[i + w * 4 + c];
			d[i + c] = Math.max(0, Math.min(255, center * .72 + sharp * mix));
		}
		d[i + 3] = s[i + 3];
	}
	ctx.putImageData(out, 0, 0);
}
function fileFromB64(b64, mime, name) {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
	return new File([bytes], name, { type: mime || "image/jpeg" });
}
var enhanceStudioPlate = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(createSsrRpc("433352f1ff88364d43e3d7de47decbb7d50a34d00ecf088830aa131922a775fe"));
var suggestStudioCopy = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	if (typeof FormData !== "undefined" && input instanceof FormData) return input;
	throw new Error("Expected FormData");
}).handler(createSsrRpc("19d493312422d96094bcc5a80b6d3cf0241bcfed8419044d366c15d62d71dd7b"));
var MAX_TAGS = 8;
function normalizeTag(raw) {
	const name = raw.trim().toLowerCase().replace(/\s+/g, " ");
	if (name.length < 2 || name.length > 24) return null;
	if (!/[a-z0-9]/.test(name)) return null;
	return name;
}
function withTag(tags, raw) {
	const name = normalizeTag(raw);
	if (!name || tags.includes(name) || tags.length >= MAX_TAGS) return tags;
	return [...tags, name];
}
async function putOriginal(file) {
	const token = getBearerToken();
	const uploadId = crypto.randomUUID();
	const chunkSize = 2097152;
	const count = Math.max(1, Math.ceil(file.size / chunkSize));
	let key = null;
	for (let i = 0; i < count; i += 1) {
		const blob = file.slice(i * chunkSize, Math.min(file.size, (i + 1) * chunkSize));
		const headers = {
			"content-type": "application/octet-stream",
			"x-file-type": file.type || "image/jpeg",
			"x-file-name": encodeURIComponent(file.name || "plate.jpg"),
			"x-upload-id": uploadId,
			"x-chunk-index": String(i),
			"x-chunk-count": String(count)
		};
		if (token) headers.authorization = `Bearer ${token}`;
		const res = await fetch("/api/studio-original", {
			method: "POST",
			headers,
			body: blob
		});
		if (!res.ok) return null;
		const json = await res.json();
		if (typeof json.key === "string") key = json.key;
	}
	return key;
}
function StudioSubmit() {
	const navigate = useNavigate();
	const { piece: pieceId } = Route$5.useSearch();
	const fileRef = (0, import_react.useRef)(null);
	const genRef = (0, import_react.useRef)(0);
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [catalogTags, setCatalogTags] = (0, import_react.useState)([]);
	const [original, setOriginal] = (0, import_react.useState)(null);
	const [enhanced, setEnhanced] = (0, import_react.useState)(null);
	const [useEnhanced, setUseEnhanced] = (0, import_react.useState)(true);
	const [enhancing, setEnhancing] = (0, import_react.useState)(false);
	const [previewUrl, setPreviewUrl] = (0, import_react.useState)(null);
	const [sourceSha, setSourceSha] = (0, import_react.useState)(null);
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [categoryId, setCategoryId] = (0, import_react.useState)("");
	const [tags, setTags] = (0, import_react.useState)([]);
	const [tagDraft, setTagDraft] = (0, import_react.useState)("");
	const [deviceType, setDeviceType] = (0, import_react.useState)("phone");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [writing, setWriting] = (0, import_react.useState)(false);
	const titleTouched = (0, import_react.useRef)(false);
	const bodyTouched = (0, import_react.useRef)(false);
	const editing = Boolean(pieceId);
	const encoded = useEnhanced && enhanced?.ok ? enhanced : original;
	(0, import_react.useEffect)(() => {
		getStudioDashboard().then((d) => {
			if (d.status !== "approved") {
				navigate({ to: "/studio" });
				return;
			}
			return listStudioPlates();
		}).then(async (r) => {
			if (!r) return;
			setCategories(r.categories);
			setCatalogTags(r.tags);
			if (pieceId) {
				const loaded = await getStudioPiece({ data: { id: pieceId } });
				if (!loaded.piece) {
					navigate({ to: "/studio" });
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
				return;
			}
			setCategoryId(r.categories[0]?.id ?? "");
		}).catch(() => setError(true)).finally(() => setLoading(false));
	}, [navigate, pieceId]);
	function addTag(raw) {
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
	function onTagKey(e) {
		if (e.key === "Enter" || e.key === ",") {
			e.preventDefault();
			addTag(tagDraft);
			return;
		}
		if (e.key === "Backspace" && !tagDraft && tags.length) setTags(tags.slice(0, -1));
	}
	function showPlate(result) {
		if (!result.ok) {
			setPreviewUrl(null);
			return;
		}
		setPreviewUrl(result.plate.previewDataUrl);
	}
	async function applyCopy(blob, gen, force = false) {
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
			if (res.tags.length) setTags((prev) => {
				const next = [...prev];
				for (const tag of res.tags) if (!next.includes(tag) && next.length < MAX_TAGS) next.push(tag);
				return next;
			});
		} catch {} finally {
			if (gen === genRef.current) setWriting(false);
		}
	}
	async function polishFile(file) {
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
		} catch {}
		return enhanceLocalFile(file);
	}
	async function onFile(file) {
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
			const dup = await checkStudioDuplicate({ data: pieceId ? {
				hashes: [hash],
				excludeId: pieceId
			} : { hashes: [hash] } });
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
				setMsg(result.error === "size" ? t.studio.tooBig : result.error === "type" ? t.studio.badType : t.studio.badRatio);
				return;
			}
			showPlate(result);
			if (!editing) setDeviceType(inferDeviceType(result.plate.width, result.plate.height));
			if (!title.trim()) {
				const stem = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
				if (stem) setTitle(stem.slice(0, 60));
			}
			applyCopy(result.plate.previewBlob, gen);
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
			setPreviewUrl((prev) => editing ? prev : null);
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
			const res = editing ? await updateStudioPlate({ data: fd }) : await uploadStudioPlate({ data: fd });
			if (!res.ok) {
				setMsg(res.error === "duplicate" ? t.studio.duplicate : t.errors.generic);
				return;
			}
			navigate({ to: "/studio" });
		} finally {
			setBusy(false);
		}
	}
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => window.location.reload() });
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 rounded-xl bg-elevated" });
	const canSubmit = Boolean(title.trim().length >= 2 && categoryId && !enhancing && (encoded?.ok || editing));
	const draftNorm = tagDraft.trim().toLowerCase();
	const suggestions = catalogTags.filter((item) => !tags.includes(item.name) && (!draftNorm || item.name.includes(draftNorm))).slice(0, 12);
	const shown = encoded?.ok ? encoded.plate : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.2em] text-muted uppercase",
			children: t.studio.brand
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 font-display text-4xl text-fg",
			children: editing ? t.studio.editPlate : t.studio.submit
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-6 text-sm text-muted",
			children: editing ? t.studio.changePhoto : t.studio.upload
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: t.studio.uploadHint
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: fileRef,
			type: "file",
			accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
			className: "sr-only",
			onChange: (e) => void onFile(e.target.files?.[0])
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": previewUrl ? t.studio.changePhoto : t.studio.uploadCta,
			onClick: () => fileRef.current?.click(),
			className: "relative mt-4 flex w-full flex-col items-center justify-center overflow-hidden rounded-[20px] bg-elevated text-sm text-muted",
			children: previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "relative mx-auto block w-full max-w-[18rem] px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: previewUrl,
					alt: "",
					className: "mx-auto max-h-80 w-full object-contain"
				}), enhancing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": true,
					className: "absolute inset-4 flex items-center justify-center rounded-xl bg-bg/70 text-sm text-fg",
					children: t.studio.enhancing
				}) : useEnhanced && enhanced?.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					"aria-hidden": true,
					className: "absolute top-6 right-6 inline-flex items-center gap-1 rounded-full bg-fg px-2.5 py-1 text-xs text-bg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }), t.studio.enhanced]
				}) : null]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex min-h-44 items-center px-4 py-8 text-center",
				children: t.studio.uploadCta
			})
		}),
		shown ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-2 text-sm tabular-nums text-muted",
			children: [
				shown.width,
				"×",
				shown.height,
				" · ",
				formatBytes(shown.bytes)
			]
		}) : null,
		original?.ok && enhanced?.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						setUseEnhanced(true);
						showPlate(enhanced);
					},
					className: cn("inline-flex h-11 items-center justify-center gap-1.5 rounded-[12px] text-sm", useEnhanced ? "bg-fg text-bg" : "bg-elevated text-muted"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), t.studio.enhanced]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setUseEnhanced(false);
						showPlate(original);
					},
					className: cn("h-11 rounded-[12px] text-sm", !useEnhanced ? "bg-fg text-bg" : "bg-elevated text-muted"),
					children: t.studio.original
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-subtle",
				children: t.studio.enhanceHint
			})]
		}) : previewUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-2 text-sm text-muted hover:text-fg",
			onClick: () => fileRef.current?.click(),
			children: t.studio.changePhoto
		}) : null,
		original?.ok && enhanced?.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mt-2 text-sm text-muted hover:text-fg",
			onClick: () => fileRef.current?.click(),
			children: t.studio.changePhoto
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 flex items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block min-w-0 flex-1 text-sm text-muted",
				children: [t.studio.plateTitle, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-2",
					value: title,
					onChange: (e) => {
						titleTouched.current = true;
						setTitle(e.target.value);
					},
					maxLength: 60
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				disabled: !encoded?.ok || writing,
				onClick: () => {
					if (!encoded?.ok) return;
					applyCopy(encoded.plate.previewBlob, genRef.current, true);
				},
				className: "mb-0.5 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[12px] bg-elevated px-3 text-sm text-muted disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), writing ? t.studio.writingCopy : t.studio.writeCopy]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-4 block text-sm text-muted",
			children: [t.studio.plateBody, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value: description,
				onChange: (e) => {
					bodyTouched.current = true;
					setDescription(e.target.value);
				},
				maxLength: 280,
				rows: 3,
				className: "mt-2 w-full rounded-[12px] bg-elevated px-4 py-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
			})]
		}),
		categories.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-4 block text-sm text-muted",
			children: [t.studio.category, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				value: categoryId,
				onChange: (e) => setCategoryId(e.target.value),
				className: "mt-2 h-11 w-full rounded-[12px] bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)]",
				children: categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: c.id,
					children: c.name
				}, c.id))
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.errors.empty }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t.studio.device
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-subtle",
					children: t.studio.deviceHint
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 grid grid-cols-3 gap-2",
					children: [
						["phone", t.studio.devicePhone],
						["tablet", t.studio.deviceTablet],
						["both", t.studio.deviceBoth]
					].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setDeviceType(id),
						className: cn("h-11 rounded-[12px] px-2 text-sm", deviceType === id ? "bg-fg text-bg" : "bg-elevated text-muted"),
						children: label
					}, id))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: t.studio.tags
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-subtle",
					children: t.studio.tagsHint
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex min-h-11 flex-wrap items-center gap-2 rounded-[12px] bg-elevated px-3 py-2 shadow-[var(--shadow-border)] focus-within:ring-2 focus-within:ring-ring",
					children: [tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setTags(tags.filter((x) => x !== tag)),
						className: "inline-flex h-8 items-center gap-1 rounded-full bg-fg pl-3 pr-2 text-xs text-bg",
						"aria-label": `Remove ${tag}`,
						children: [tag, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })]
					}, tag)), tags.length < MAX_TAGS ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: tagDraft,
						onChange: (e) => setTagDraft(e.target.value),
						onKeyDown: onTagKey,
						onBlur: () => {
							if (tagDraft.trim()) addTag(tagDraft);
						},
						placeholder: tags.length === 0 ? t.studio.tagsPlaceholder : "",
						maxLength: 24,
						className: "min-w-24 flex-1 bg-transparent py-1 text-sm text-fg outline-none placeholder:text-subtle"
					}) : null]
				}),
				suggestions.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: suggestions.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onMouseDown: (e) => e.preventDefault(),
						onClick: () => addTag(item.name),
						className: "h-8 rounded-full bg-elevated px-3 text-xs text-muted hover:text-fg",
						children: item.name
					}, item.slug))
				}) : null
			]
		}),
		editing && encoded?.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: t.studio.photoReReview
		}) : null,
		msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-danger",
			children: msg
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			className: "mt-6 w-full",
			disabled: busy || !canSubmit,
			onClick: () => void submit(),
			children: enhancing ? t.studio.enhancing : busy ? t.studio.encoding : editing ? t.studio.saveChanges : t.studio.publish
		})
	] });
}
//#endregion
export { StudioSubmit as component };

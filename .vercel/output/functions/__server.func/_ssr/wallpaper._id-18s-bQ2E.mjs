import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { B as orientationOf, M as isLandscape, f as designedFor, h as downloadLabel, it as wallpaperPath, ot as brand, u as categoryPath } from "./queries-bIh47-yB.mjs";
import { D as ChevronLeft, S as Flag, l as Share2, w as Download } from "../_libs/lucide-react.mjs";
import { B as formatBytes, D as getPremiumStatus, I as submitReport, K as t, N as requestDownload, V as formatCount, i as Route$4, x as createAdSession } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { n as WallpaperGrid, t as FavoriteButton } from "./wallpaper-grid-CveWJYI3.mjs";
import { t as Breadcrumbs } from "./breadcrumbs-uNA0UpIi.mjs";
import { t as DevicePreview } from "./device-preview-8Ori_TGM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallpaper._id-18s-bQ2E.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Build an iPhone Live Photo pair: still JPEG + MOV with a shared asset id. */
var ENC = new TextEncoder();
function liveAssetId() {
	return crypto.randomUUID().toUpperCase();
}
function injectLiveJpeg(jpeg, assetId) {
	if (jpeg.length < 4 || jpeg[0] !== 255 || jpeg[1] !== 216) return jpeg;
	const xmp = `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:Apple="http://ns.apple.com/livephotos/"
    Apple:ContentIdentifier="${assetId}"
    Apple:StillImageTime="0"/>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
	const payload = concat(ENC.encode("http://ns.adobe.com/xap/1.0/\0"), ENC.encode(xmp));
	let insertAt = 2;
	if (jpeg[2] === 255 && jpeg[3] === 224) insertAt = 4 + (jpeg[4] << 8 | jpeg[5]);
	const seg = new Uint8Array(4 + payload.length);
	seg[0] = 255;
	seg[1] = 225;
	const len = payload.length + 2;
	seg[2] = len >> 8 & 255;
	seg[3] = len & 255;
	seg.set(payload, 4);
	return concat(jpeg.subarray(0, insertAt), seg, jpeg.subarray(insertAt));
}
function injectLiveMov(mp4, assetId) {
	try {
		const top = readBoxes(mp4, 0, mp4.length);
		const moov = top.find((b) => b.type === "moov");
		const mdat = top.find((b) => b.type === "mdat");
		const ftyp = top.find((b) => b.type === "ftyp");
		if (!moov || !mdat || !ftyp) return mp4;
		const grown = appendMeta(sliceBox(mp4, moov), assetId);
		const rest = top.filter((b) => b.type !== "moov" && b.type !== "free" && b.type !== "skip");
		const mdatIndex = rest.findIndex((b) => b.type === "mdat");
		const before = rest.slice(0, mdatIndex);
		const after = rest.slice(mdatIndex);
		const patched = patchChunkOffsets(grown, before.reduce((n, b) => n + b.size, 0) + grown.length - mdat.start);
		return concat(...before.map((b) => mp4.subarray(b.start, b.start + b.size)), patched, ...after.map((b) => mp4.subarray(b.start, b.start + b.size)));
	} catch {
		return mp4;
	}
}
function zipStore(files) {
	const locals = [];
	const centrals = [];
	let offset = 0;
	for (const file of files) {
		const name = ENC.encode(file.name);
		const crc = crc32(file.data);
		const local = concat(u32(67324752), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), name, file.data);
		const central = concat(u32(33639248), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name);
		locals.push(local);
		centrals.push(central);
		offset += local.length;
	}
	const center = concat(...centrals);
	const eocd = concat(u32(101010256), u16(0), u16(0), u16(files.length), u16(files.length), u32(center.length), u32(offset), u16(0));
	return concat(...locals, center, eocd);
}
function readBoxes(buf, start, end) {
	const out = [];
	let off = start;
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	while (off + 8 <= end) {
		let size = view.getUint32(off);
		const type = String.fromCharCode(buf[off + 4], buf[off + 5], buf[off + 6], buf[off + 7]);
		let header = 8;
		if (size === 1 && off + 16 <= end) {
			const hi = view.getUint32(off + 8);
			const lo = view.getUint32(off + 12);
			size = hi * 2 ** 32 + lo;
			header = 16;
		} else if (size === 0) size = end - off;
		if (size < header || off + size > end) break;
		out.push({
			type,
			start: off,
			size,
			header
		});
		off += size;
	}
	return out;
}
function sliceBox(buf, box) {
	return buf.subarray(box.start, box.start + box.size);
}
function appendMeta(moovBox, assetId) {
	const header = moovBox[4] === 109 && moovBox[5] === 111 && moovBox[6] === 111 && moovBox[7] === 118 ? 8 : 8;
	const udta = readBoxes(moovBox, header, moovBox.length).find((b) => b.type === "udta");
	const meta = makeMetaBox(assetId);
	if (udta) {
		const newUdta = wrap("udta", concat(moovBox.subarray(udta.start + udta.header, udta.start + udta.size), meta));
		return wrap("moov", concat(moovBox.subarray(header, udta.start), newUdta, moovBox.subarray(udta.start + udta.size)));
	}
	return wrap("moov", concat(moovBox.subarray(header), wrap("udta", meta)));
}
function wrap(type, payload) {
	return concat(be32(8 + payload.length), ENC.encode(type), payload);
}
function wrapFull(type, version, payload) {
	const vf = /* @__PURE__ */ new Uint8Array(4);
	vf[0] = version;
	return wrap(type, concat(vf, payload));
}
function wrapIndex(index, dataBox) {
	return concat(be32(8 + dataBox.length), be32(index), dataBox);
}
function dataUtf8(text) {
	return wrap("data", concat(be32(1), be32(0), ENC.encode(text)));
}
function dataInt(n) {
	return wrap("data", concat(be32(21), be32(0), be32(n)));
}
function makeMetaBox(assetId) {
	const names = [
		"com.apple.quicktime.content.identifier",
		"com.apple.quicktime.still-image-time",
		"com.apple.quicktime.live-photo.auto"
	];
	const keyEntries = names.map((k) => {
		const body = ENC.encode(k);
		return concat(be32(8 + body.length), ENC.encode("mdta"), body);
	});
	const keysBox = wrapFull("keys", 0, concat(be32(names.length), ...keyEntries));
	const ilst = wrap("ilst", concat(wrapIndex(1, dataUtf8(assetId)), wrapIndex(2, dataInt(0)), wrapIndex(3, dataInt(1))));
	return wrapFull("meta", 0, concat(wrapFull("hdlr", 0, concat(be32(0), ENC.encode("mdir"), ENC.encode("appl"), be32(0), be32(0), be32(0), new Uint8Array([0]))), keysBox, ilst));
}
function be32(n) {
	return new Uint8Array([
		n >>> 24 & 255,
		n >>> 16 & 255,
		n >>> 8 & 255,
		n & 255
	]);
}
function patchChunkOffsets(moovBox, delta) {
	if (!delta) return moovBox;
	const out = new Uint8Array(moovBox);
	walk(out, 8, out.length);
	function walk(buf, start, end) {
		for (const b of readBoxes(buf, start, end)) if (b.type === "stco" || b.type === "co64") {
			const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
			const countOff = b.start + b.header + 4;
			const count = view.getUint32(countOff);
			let p = countOff + 4;
			if (b.type === "stco") for (let i = 0; i < count && p + 4 <= b.start + b.size; i += 1, p += 4) view.setUint32(p, view.getUint32(p) + delta);
			else for (let i = 0; i < count && p + 8 <= b.start + b.size; i += 1, p += 8) {
				const hi = view.getUint32(p);
				const lo = view.getUint32(p + 4);
				let v = hi * 2 ** 32 + lo + delta;
				view.setUint32(p, Math.floor(v / 2 ** 32));
				view.setUint32(p + 4, v >>> 0);
			}
		} else if ([
			"trak",
			"mdia",
			"minf",
			"stbl",
			"edts"
		].includes(b.type)) walk(buf, b.start + b.header, b.start + b.size);
	}
	return out;
}
function concat(...parts) {
	const len = parts.reduce((n, p) => n + p.length, 0);
	const out = new Uint8Array(len);
	let o = 0;
	for (const p of parts) {
		out.set(p, o);
		o += p.length;
	}
	return out;
}
function u16(n) {
	return new Uint8Array([n & 255, n >> 8 & 255]);
}
function u32(n) {
	return new Uint8Array([
		n & 255,
		n >> 8 & 255,
		n >> 16 & 255,
		n >>> 24 & 255
	]);
}
var CRC_TABLE = /* @__PURE__ */ new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
	let c = i;
	for (let k = 0; k < 8; k += 1) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
	CRC_TABLE[i] = c >>> 0;
}
function crc32(buf) {
	let c = 4294967295;
	for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ c >>> 8;
	return (c ^ 4294967295) >>> 0;
}
async function fetchBytes(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error("fetch");
	return new Uint8Array(await res.arrayBuffer());
}
async function saveFiles(files) {
	const blobs = files.map((f) => {
		const copy = new Uint8Array(f.data);
		return new File([copy], f.filename, { type: f.mime });
	});
	if (navigator.canShare && blobs.every((f) => navigator.canShare({ files: [f] }))) try {
		await navigator.share({
			files: blobs,
			title: files[0]?.filename
		});
		return "shared";
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") return "shared";
	}
	for (const file of blobs) {
		const objectUrl = URL.createObjectURL(file);
		const a = document.createElement("a");
		a.href = objectUrl;
		a.download = file.name;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(objectUrl);
	}
	return "downloaded";
}
function DownloadSheet({ open, onClose, wallpaperId, accessType, isPremiumUser, isLive = false, deviceType = "phone" }) {
	const navigate = useNavigate();
	const [phase, setPhase] = (0, import_react.useState)("idle");
	const [adSessionId, setAdSessionId] = (0, import_react.useState)(null);
	const [message, setMessage] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setPhase("idle");
			setMessage(null);
			setAdSessionId(null);
		}
	}, [open]);
	if (!open) return null;
	async function finish(sessionId, pack = false) {
		setPhase("saving");
		try {
			const res = await requestDownload({ data: {
				wallpaperId,
				source: "details",
				adSessionId: sessionId ?? adSessionId ?? void 0
			} });
			if (res.status === "needs_auth") {
				navigate({
					to: "/login",
					search: { next: `/wallpaper/${wallpaperId}` }
				});
				return;
			}
			if (res.status === "needs_premium") {
				navigate({ to: "/app" });
				return;
			}
			if (res.status === "needs_ad") {
				if (sessionId) {
					setPhase("error");
					setMessage(t.download.failed);
					return;
				}
				const session = await createAdSession({ data: { wallpaperId } });
				setAdSessionId(session.adSessionId);
				await finish(session.adSessionId, pack);
				return;
			}
			if (res.status === "rate_limited") {
				setPhase("error");
				setMessage(t.download.rateLimited);
				return;
			}
			if (res.status === "error") {
				setPhase("error");
				setMessage(res.message);
				return;
			}
			if (res.isLive && res.stillUrl && res.stillFilename) {
				const [video, still] = await Promise.all([fetchBytes(res.url), fetchBytes(res.stillUrl)]);
				const id = liveAssetId();
				const mov = injectLiveMov(video, id);
				const jpg = injectLiveJpeg(still, id);
				if (pack) await saveFiles([{
					data: zipStore([{
						name: res.stillFilename,
						data: jpg
					}, {
						name: res.filename,
						data: mov
					}]),
					filename: `${res.filename.replace(/\.[^.]+$/, "")}-iphone-live.zip`,
					mime: "application/zip"
				}]);
				else await saveFiles([{
					data: jpg,
					filename: res.stillFilename,
					mime: "image/jpeg"
				}, {
					data: mov,
					filename: res.filename,
					mime: "video/quicktime"
				}]);
				setPhase("guide");
				return;
			}
			await saveFiles([{
				data: await fetchBytes(res.url),
				filename: res.filename,
				mime: res.mime || "image/jpeg"
			}]);
			onClose();
		} catch {
			setPhase("error");
			setMessage(t.download.failed);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mw-backdrop absolute inset-0 bg-bg/70",
			"aria-label": t.close,
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "download-title",
			className: "mw-sheet relative z-10 w-full max-w-md rounded-t-[24px] bg-surface p-6 shadow-[var(--shadow-border)] sm:rounded-[24px]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				id: "download-title",
				className: "font-display text-2xl text-fg",
				children: isLive ? t.download.liveTitle : t.download.title
			}), phase === "guide" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: t.download.saved
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "list-decimal space-y-2 pl-5 text-sm text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t.download.iphone1 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t.download.iphone2 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t.download.iphone3 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t.download.iphone4 })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						onClick: onClose,
						children: t.done
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: isLive ? t.download.liveDirect : t.download.freeDirect
					}),
					message ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: message
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full",
						disabled: phase === "saving",
						onClick: () => void finish(),
						children: phase === "saving" ? t.download.saving : isLive ? t.download.saveIphone : downloadLabel(deviceType)
					}),
					isLive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "w-full",
						disabled: phase === "saving",
						onClick: () => void finish(void 0, true),
						children: t.download.savePack
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						className: "w-full",
						onClick: onClose,
						children: t.cancel
					})
				]
			})]
		})]
	});
}
function DetailsPage() {
	const { id } = Route$4.useParams();
	const initial = Route$4.useLoaderData();
	const navigate = useNavigate();
	const { user } = useCurrentUserState();
	const [wallpaper, setWallpaper] = (0, import_react.useState)(initial.wallpaper);
	const [related, setRelated] = (0, import_react.useState)(initial.related);
	const [pair, setPair] = (0, import_react.useState)(initial.pair);
	const [downloadOpen, setDownloadOpen] = (0, import_react.useState)(false);
	const [isPremium, setIsPremium] = (0, import_react.useState)(false);
	const [reportOpen, setReportOpen] = (0, import_react.useState)(false);
	const [shareMsg, setShareMsg] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)(initial.pair?.role === "home" ? "home" : "lock");
	(0, import_react.useEffect)(() => {
		setWallpaper(initial.wallpaper);
		setRelated(initial.related);
		setPair(initial.pair);
		setMode(initial.pair?.role === "home" ? "home" : "lock");
		getPremiumStatus().then((s) => setIsPremium(s.isPremium));
	}, [id, initial]);
	async function share() {
		const url = `${window.location.origin}${wallpaperPath(wallpaper?.slug || id)}`;
		try {
			if (navigator.share) {
				await navigator.share({
					title: wallpaper?.title ?? brand.name,
					url
				});
				return;
			}
			await navigator.clipboard.writeText(url);
			setShareMsg(t.shareCopied);
		} catch {
			setShareMsg(null);
		}
	}
	if (!wallpaper) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.errors.notFound });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-5xl pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/",
							"aria-label": "Back",
							className: "grid size-11 place-items-center rounded-full bg-elevated text-fg",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-[0.18em] text-muted uppercase",
							children: t.preview.live
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavoriteButton, {
							wallpaperId: wallpaper.id,
							isFavorite: wallpaper.isFavorite,
							onChange: (next) => setWallpaper((w) => w ? {
								...w,
								isFavorite: next
							} : w),
							className: "bg-elevated backdrop-blur-none"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breadcrumbs, { items: [
						{
							name: "Home",
							href: "/"
						},
						{
							name: wallpaper.categoryName,
							href: categoryPath(wallpaper.categorySlug)
						},
						{ name: wallpaper.title }
					] })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4 px-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePreview, {
					src: wallpaper.previewUrl,
					alt: wallpaper.altText || wallpaper.title,
					mode,
					onModeChange: setMode,
					variant: wallpaper.deviceType === "tablet" ? "tablet" : "phone",
					landscape: isLandscape(wallpaper.width, wallpaper.height)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pt-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-start justify-between gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-display text-3xl text-fg",
								children: wallpaper.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-fg",
								children: designedFor(wallpaper.deviceType)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-sm text-muted",
								children: [
									wallpaper.creatorSlug && wallpaper.creatorName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: `/creator/${wallpaper.creatorSlug}`,
										className: "hover:text-fg",
										children: wallpaper.creatorName
									}) : t.wallpaper.byPlatform,
									" · ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: categoryPath(wallpaper.categorySlug),
										className: "hover:text-fg",
										children: wallpaper.categoryName
									})
								]
							})
						] })
					}),
					wallpaper.description ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted",
						children: wallpaper.description
					}) : null,
					wallpaper.tags.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 flex flex-wrap gap-2",
						children: wallpaper.tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: `/wallpapers?q=${encodeURIComponent(tag)}`,
							className: "rounded-full bg-elevated px-3 py-1 text-xs text-muted hover:text-fg",
							children: tag
						}, tag))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-subtle",
						children: [
							wallpaper.width,
							"×",
							wallpaper.height,
							" · ",
							formatBytes(wallpaper.fileSizeBytes),
							" · ",
							orientationOf(wallpaper.width, wallpaper.height),
							" · ",
							formatCount(wallpaper.downloadCount),
							" ",
							t.wallpaper.downloads
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: () => setDownloadOpen(true),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), downloadLabel(wallpaper.deviceType)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "secondary",
								onClick: () => void share(),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), t.wallpaper.share]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "secondary",
								size: "icon",
								"aria-label": t.wallpaper.report,
								onClick: () => {
									if (!user) {
										navigate({
											to: "/login",
											search: { next: wallpaperPath(wallpaper.slug) }
										});
										return;
									}
									setReportOpen(true);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flag, { className: "size-4" })
							})
						]
					}),
					shareMsg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: shareMsg
					}) : null,
					pair ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-sm text-muted",
						children: [
							t.pairs.title,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `/pair/${pair.slug}`,
								className: "text-fg hover:underline",
								children: pair.name
							})
						]
					}) : null,
					reportOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-[16px] bg-elevated p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium text-fg",
							children: t.report.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 flex flex-wrap gap-2",
							children: Object.entries(t.report.reasons).map(([key, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "secondary",
								onClick: async () => {
									await submitReport({ data: {
										wallpaperId: wallpaper.id,
										reason: key
									} });
									setReportOpen(false);
									setShareMsg(t.report.thanks);
								},
								children: label
							}, key))
						})]
					}) : null,
					related.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-3 font-display text-xl text-fg",
							children: t.wallpaper.related
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
							items: related,
							eager: 2
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadSheet, {
				open: downloadOpen,
				onClose: () => setDownloadOpen(false),
				wallpaperId: wallpaper.id,
				accessType: wallpaper.accessType,
				isPremiumUser: isPremium,
				deviceType: wallpaper.deviceType
			})
		]
	});
}
//#endregion
export { DetailsPage as component };

import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { M as isLandscape, it as wallpaperPath, nt as wallpaperAlt, p as deviceBadge } from "./queries-bIh47-yB.mjs";
import { b as Heart } from "../_libs/lucide-react.mjs";
import { K as t, L as toggleFavorite, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { n as LazyImage } from "./lazy-CeFyYund.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallpaper-grid-CveWJYI3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FavoriteButton({ wallpaperId, isFavorite, onChange, className }) {
	const { user, isPending } = useCurrentUserState();
	const navigate = useNavigate();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [local, setLocal] = (0, import_react.useState)(isFavorite);
	(0, import_react.useEffect)(() => {
		setLocal(isFavorite);
	}, [isFavorite]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": local ? t.wallpaper.unfavorite : t.wallpaper.favorite,
		"aria-pressed": local,
		disabled: busy,
		className: cn("grid size-11 place-items-center rounded-full bg-bg/55 text-fg backdrop-blur-sm", "transition-transform duration-150 ease-out active:scale-[0.96]", className),
		onClick: async (e) => {
			e.preventDefault();
			e.stopPropagation();
			if (isPending) return;
			if (!user) {
				navigate({
					to: "/login",
					search: { next: `/wallpaper/${wallpaperId}` }
				});
				return;
			}
			setBusy(true);
			const prev = local;
			setLocal(!prev);
			onChange?.(!prev);
			try {
				const res = await toggleFavorite({ data: { wallpaperId } });
				setLocal(res.isFavorite);
				onChange?.(res.isFavorite);
			} catch {
				setLocal(prev);
				onChange?.(prev);
			} finally {
				setBusy(false);
			}
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, {
			className: cn("size-5 transition-transform duration-150 ease-out", local ? "scale-110" : "scale-100"),
			strokeWidth: 1.75,
			fill: local ? "currentColor" : "none"
		})
	});
}
function WallpaperCard({ wallpaper, onFavorite, priority }) {
	const landscape = isLandscape(wallpaper.width, wallpaper.height);
	const badge = deviceBadge(wallpaper.deviceType);
	const href = wallpaperPath(wallpaper.slug || wallpaper.id);
	const alt = wallpaperAlt({
		title: wallpaper.title,
		categoryName: wallpaper.categoryName,
		deviceType: wallpaper.deviceType,
		altText: wallpaper.altText
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: cn("group relative overflow-hidden rounded-[16px] bg-elevated", landscape && "col-span-2"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href,
				className: "block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden",
					style: { aspectRatio: `${wallpaper.width} / ${wallpaper.height}` },
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
						src: wallpaper.thumbnailUrl,
						alt,
						width: wallpaper.width,
						height: wallpaper.height,
						sizes: landscape ? "(min-width: 1024px) 50vw, (min-width: 640px) 66vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
						priority,
						className: "wallpaper-img size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] group-active:scale-[0.99]"
					})
				})
			}),
			badge ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-bg/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg backdrop-blur-sm",
				children: badge
			}) : wallpaper.accessType === "premium" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-bg/70 px-2.5 py-1 text-[11px] font-medium tracking-wide text-fg backdrop-blur-sm",
				children: t.wallpaper.premiumBadge
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FavoriteButton, {
				wallpaperId: wallpaper.id,
				isFavorite: wallpaper.isFavorite,
				onChange: (next) => onFavorite?.(wallpaper.id, next),
				className: "absolute right-1.5 top-1.5 size-10"
			})
		]
	});
}
function WallpaperCardSkeleton({ className, landscape = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("overflow-hidden rounded-[16px] bg-elevated", landscape && "col-span-2", className),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("animate-pulse bg-surface", landscape ? "aspect-[4/3]" : "aspect-[9/16]") })
	});
}
function WallpaperGrid({ items, onFavorite, eager = 0 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4",
		children: items.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperCard, {
			wallpaper: w,
			onFavorite,
			priority: i < eager
		}, w.id))
	});
}
function WallpaperGridSkeleton({ count = 6 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4"),
		children: Array.from({ length: count }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperCardSkeleton, {}, i))
	});
}
//#endregion
export { WallpaperGrid as n, WallpaperGridSkeleton as r, FavoriteButton as t };

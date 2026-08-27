import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { J as resolveHero, U as plateFallback, ot as brand } from "./queries-bIh47-yB.mjs";
import { A as Bell, d as Search } from "../_libs/lucide-react.mjs";
import { E as getHomeFeed, K as t, P as saveTaste, p as Route$28, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as useCurrentUserState } from "./use-current-user-DF_8Asza.mjs";
import { n as LazyImage, r as LazyMount } from "./lazy-CeFyYund.mjs";
import { t as CreatorCard } from "./creator-card-phHnbh7g.mjs";
import { n as ErrorState } from "./empty-state-BWSi2TR4.mjs";
import { n as WallpaperGrid, r as WallpaperGridSkeleton } from "./wallpaper-grid-CveWJYI3.mjs";
import { t as PairCard } from "./pair-card-BlQbIVzH.mjs";
import { t as readLocalTaste } from "./taste-aiRPFToT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/app-eiCaCwwA.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SectionHeader({ title, to, search }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex items-end justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl text-fg md:text-2xl",
			children: title
		}), to ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to,
			search,
			className: "pb-0.5 text-sm text-muted transition-colors duration-150 hover:text-fg",
			children: t.home.seeAll
		}) : null]
	});
}
function Skeleton({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-[12px] bg-elevated", className),
		"aria-hidden": true
	});
}
var SLOT_MS = 15e3;
function trendingSlot(now = Date.now()) {
	return Math.floor(now / SLOT_MS);
}
/** Deterministic weighted shuffle: higher-ranked (more viewed) plates appear more often. */
function shuffleTrendingByViews(items, slot, take = 8) {
	if (items.length <= take) return items;
	const rng = mulberry32(slot ^ 2654435769);
	const pool = items.map((item, rank) => ({
		item,
		weight: (items.length - rank) ** 2
	}));
	const picked = [];
	while (picked.length < take && pool.length > 0) {
		const total = pool.reduce((sum, row) => sum + row.weight, 0);
		let cursor = rng() * total;
		let index = pool.length - 1;
		for (let i = 0; i < pool.length; i += 1) {
			cursor -= pool[i].weight;
			if (cursor <= 0) {
				index = i;
				break;
			}
		}
		picked.push(pool[index].item);
		pool.splice(index, 1);
	}
	return picked;
}
function mulberry32(seed) {
	let t = seed >>> 0;
	return () => {
		t += 1831565813;
		let r = Math.imul(t ^ t >>> 15, 1 | t);
		r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
		return ((r ^ r >>> 14) >>> 0) / 4294967296;
	};
}
function patchFav(list, id, next) {
	return list.map((w) => w.id === id ? {
		...w,
		isFavorite: next,
		favoriteCount: w.favoriteCount + (next ? 1 : -1)
	} : w);
}
function HomePage() {
	const initial = Route$28.useLoaderData();
	const { user, isPending } = useCurrentUserState();
	const [data, setData] = (0, import_react.useState)(initial);
	const [error, setError] = (0, import_react.useState)(false);
	const [tick, setTick] = (0, import_react.useState)(0);
	const [slot, setSlot] = (0, import_react.useState)(null);
	const userId = user?.id ?? null;
	(0, import_react.useEffect)(() => {
		setSlot(trendingSlot());
		const id = window.setInterval(() => setSlot(trendingSlot()), 15e3);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setTick((n) => n + 1), 6e4);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		if (isPending) return;
		const tasteIds = readLocalTaste();
		let cancelled = false;
		getHomeFeed({ data: { tasteIds } }).then((d) => {
			if (cancelled) return;
			setData(d);
			setError(false);
			if (userId && !d.hasTaste && tasteIds.length >= 3) saveTaste({ data: { categoryIds: tasteIds } }).catch(() => void 0);
		}).catch(() => {
			if (!cancelled) setError(true);
		});
		return () => {
			cancelled = true;
		};
	}, [
		userId,
		isPending,
		tick
	]);
	const trending = (0, import_react.useMemo)(() => {
		const list = data?.trending ?? [];
		if (slot == null) return list.slice(0, 8);
		return shuffleTrendingByViews(list, slot, 8);
	}, [data?.trending, slot]);
	const wotdHero = data?.wotd ? resolveHero(data.wotd.id, data.wotd.thumbnailUrl) : null;
	function onFavorite(id, next) {
		setData((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				wotd: prev.wotd && prev.wotd.id === id ? {
					...prev.wotd,
					isFavorite: next
				} : prev.wotd,
				trending: patchFav(prev.trending, id, next),
				fresh: patchFav(prev.fresh, id, next),
				recommended: patchFav(prev.recommended, id, next),
				editors: patchFav(prev.editors, id, next),
				premium: patchFav(prev.premium, id, next),
				recent: patchFav(prev.recent, id, next),
				tablet: patchFav(prev.tablet ?? [], id, next)
			};
		});
	}
	if (error && !data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: () => setTick((n) => n + 1) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mw-enter px-4 pt-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "mb-6 flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-[0.22em] text-muted uppercase",
					children: brand.tagline
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl text-fg",
					children: brand.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-sm text-sm text-muted",
					children: brand.positioning
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/app/explore",
					"aria-label": t.home.search,
					className: "grid size-11 place-items-center rounded-[12px] text-fg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/app/notifications",
					"aria-label": t.home.notifications,
					className: "relative grid size-11 place-items-center rounded-md text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, {
						className: "size-5",
						strokeWidth: 1.75
					}), data && data.unreadCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-2 right-2 size-2.5 rounded-full bg-fg ring-2 ring-bg" }) : null]
				})]
			})]
		}), !data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "aspect-[4/5] w-full rounded-[24px]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGridSkeleton, {})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-10",
			children: [
				!data.hasTaste && readLocalTaste().length < 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/app/taste",
					className: "block rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-[0.18em] text-subtle uppercase",
							children: t.preview.live
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-2xl text-fg",
							children: t.taste.bannerTitle
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm text-muted",
							children: t.taste.bannerBody
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-3 inline-flex h-11 items-center rounded-full bg-fg px-4 text-sm text-bg",
							children: t.taste.cta
						})
					]
				}) : null,
				data.wotd ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t.home.wotd }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/wallpaper/$id",
					params: { id: data.wotd.id },
					className: "relative block overflow-hidden rounded-[24px] bg-elevated",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "aspect-[4/5] sm:aspect-[16/10]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
							src: wotdHero ?? `/wallpapers/${data.wotd.id}.jpg`,
							srcSet: `${wotdHero ?? `/wallpapers/${data.wotd.id}.jpg`} 1080w`,
							sizes: "(min-width: 1024px) 1024px, 100vw",
							alt: data.wotd.title,
							width: 1080,
							height: 1920,
							priority: true,
							fallback: `/wallpapers/${data.wotd.id}.jpg`,
							className: "wallpaper-img size-full object-cover"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/80 to-transparent p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-[0.18em] text-fg/70 uppercase",
							children: t.home.wotd
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-display text-2xl text-fg",
							children: data.wotd.title
						})]
					})]
				})] }) : null,
				data.recommended.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t.home.forYou }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: data.recommended,
					onFavorite,
					eager: 4
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: t.home.trending,
					to: "/app/explore",
					search: { device: "phone" }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: trending,
					onFavorite,
					eager: 4
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: t.home.fresh,
					to: "/app/explore",
					search: { device: "phone" }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: data.fresh,
					onFavorite,
					eager: 2
				})] }),
				(data.tablet ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
					title: t.home.tablet,
					to: "/app/explore",
					search: { device: "tablet" }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: data.tablet ?? [],
					onFavorite,
					eager: 2
				})] }) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t.home.categories }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					children: data.categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/category/$slug",
						params: { slug: c.slug },
						className: "relative h-28 w-36 shrink-0 overflow-hidden rounded-[16px] bg-elevated",
						children: [c.coverUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
							src: c.coverUrl,
							alt: "",
							fallback: plateFallback(c.coverUrl),
							className: "size-full object-cover"
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute inset-x-0 bottom-0 bg-bg/55 px-2.5 py-2 text-sm font-medium text-fg backdrop-blur-sm",
							children: c.name
						})]
					}, c.id))
				})] }),
				data.collections.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t.home.collections }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					children: data.collections.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/collection/$slug",
						params: { slug: col.slug },
						className: "relative h-40 w-52 shrink-0 overflow-hidden rounded-[20px] bg-elevated",
						children: [col.coverUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
							src: col.coverUrl,
							alt: "",
							fallback: plateFallback(col.coverUrl),
							className: "size-full object-cover"
						}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/85 to-transparent px-3 pb-2.5 pt-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm font-medium text-fg",
								children: col.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-0.5 block truncate text-xs text-fg/70",
								children: t.home.wallpaperCount.replace("{n}", String(col.wallpaperCount))
							})]
						})]
					}, col.id))
				})] }) : null,
				(data.pairs ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyMount, {
					minHeight: 280,
					eager: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t.home.pairs }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mb-3 text-sm text-muted",
							children: t.pairs.homeHint
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
							children: data.pairs.map((pair) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PairCard, { pair }, pair.id))
						})
					] })
				}) : null,
				data.creators.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyMount, {
					minHeight: 320,
					eager: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, {
							title: t.home.creators,
							to: "/app/creators"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/creator/$slug",
							params: { slug: data.creators[0].slug },
							className: "relative mb-3 block overflow-hidden rounded-[20px] bg-elevated",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
								src: data.creators[0].coverUrl,
								alt: "",
								fallback: plateFallback(data.creators[0].coverUrl),
								className: "wallpaper-img h-44 w-full object-cover sm:h-56"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent px-4 pb-3 pt-12",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-xs tracking-[0.16em] text-fg/70 uppercase",
										children: t.creators.newFrom
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 block font-display text-2xl text-fg",
										children: data.creators[0].displayName
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-0.5 block text-xs text-fg/75",
										children: t.creators.pieces.replace("{n}", String(data.creators[0].pieceCount))
									})
								]
							})]
						}),
						data.creators.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
							children: data.creators.slice(1).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-40 shrink-0 sm:w-52",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreatorCard, { creator: c })
							}, c.slug))
						}) : null
					] })
				}) : null,
				data.editors.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t.home.editors }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: data.editors,
					onFavorite,
					eager: 2
				})] }) : null,
				data.recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeader, { title: t.home.recent }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: data.recent,
					onFavorite
				})] }) : null
			]
		})]
	});
}
//#endregion
export { HomePage as component };

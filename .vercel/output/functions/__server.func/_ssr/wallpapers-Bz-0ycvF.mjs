import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, V as formatCount, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { n as ErrorState } from "./empty-state-BWSi2TR4.mjs";
import { t as Input } from "./input-BCaChIGK.mjs";
import { C as updateWallpaperOps, _ as setFeaturedSlot, l as listOpsFeatured, m as removeFeaturedSlot, p as listOpsWallpapers } from "./ops-C_QDXn1-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallpapers-Bz-0ycvF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var statuses = [
	"approved",
	"pending",
	"rejected",
	"removed",
	"draft"
];
var slots = [
	"wotd",
	"editors_choice",
	"premium_spotlight"
];
function Select({ value, onChange, children, "aria-label": ariaLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		"aria-label": ariaLabel,
		value,
		onChange: (e) => onChange(e.target.value),
		className: "h-11 rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)]",
		children
	});
}
function slotLabel(slot) {
	return slot === "wotd" ? t.ops.wotd : slot === "editors_choice" ? t.ops.editors : t.ops.spotlight;
}
function OpsWallpapersPage() {
	const [q, setQ] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("");
	const [items, setItems] = (0, import_react.useState)([]);
	const [featured, setFeatured] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	function load() {
		setLoading(true);
		setError(false);
		Promise.all([listOpsWallpapers({ data: {
			q: q.trim() || void 0,
			status: status || void 0
		} }), listOpsFeatured()]).then(([w, f]) => {
			setItems(w.items);
			setFeatured(f.items);
		}).catch(() => setError(true)).finally(() => setLoading(false));
	}
	(0, import_react.useEffect)(() => {
		const id = window.setTimeout(() => load(), 200);
		return () => window.clearTimeout(id);
	}, [q, status]);
	async function patch(id, next) {
		await updateWallpaperOps({ data: {
			wallpaperId: id,
			status: next.status,
			accessType: next.accessType,
			deviceType: next.deviceType
		} });
		setItems((prev) => prev.map((w) => w.id === id ? {
			...w,
			...next
		} : w));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl text-fg",
				children: t.ops.wallpapers
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-xl text-sm text-muted",
				children: t.ops.catalogHint
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-3 font-display text-xl text-fg",
				children: t.ops.featured
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3 lg:grid-cols-3",
				children: slots.map((slot) => {
					const rows = featured.filter((f) => f.slot === slot);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-elevated p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-widest text-subtle uppercase",
							children: slotLabel(slot)
						}), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-sm text-muted",
							children: t.ops.emptySlot
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-3 space-y-2",
							children: rows.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: f.thumbnailUrl,
										alt: "",
										className: "wallpaper-img h-14 w-8 shrink-0 rounded-sm object-cover"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "min-w-0 flex-1 truncate text-sm font-medium text-fg",
										children: f.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: async () => {
											await removeFeaturedSlot({ data: { id: f.id } });
											setFeatured((prev) => prev.filter((x) => x.id !== f.id));
										},
										children: t.ops.removePlace
									})
								]
							}, f.id))
						})]
					}, slot);
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: t.explore.placeholder,
					"aria-label": t.explore.placeholder,
					type: "search"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setStatus(""),
						className: cn("h-9 shrink-0 rounded-full px-4 text-sm", status === "" ? "bg-fg text-bg" : "bg-elevated text-muted"),
						children: t.ops.allStatuses
					}), statuses.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setStatus(s),
						className: cn("h-9 shrink-0 rounded-full px-4 text-sm", status === s ? "bg-fg text-bg" : "bg-elevated text-muted"),
						children: t.ops.status[s]
					}, s))]
				})]
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load }) : loading && items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 animate-pulse rounded-xl bg-elevated" }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-elevated px-4 py-10 text-center text-sm text-muted",
				children: t.ops.emptyCatalog
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border overflow-hidden rounded-xl bg-elevated",
				children: items.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/wallpaper/$id",
							params: { id: w.id },
							className: "flex min-w-0 flex-1 items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: w.thumbnailUrl,
								alt: "",
								className: "wallpaper-img h-16 w-12 shrink-0 rounded-sm object-cover"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium text-fg",
									children: w.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted",
									children: [
										w.categoryName,
										" · ",
										formatCount(w.downloadCount),
										" ",
										t.wallpaper.downloads
									]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: cn("h-11 rounded-full px-4 text-sm", w.accessType === "premium" ? "bg-fg text-bg" : "bg-surface text-muted"),
									onClick: () => void patch(w.id, { accessType: w.accessType === "premium" ? "free" : "premium" }),
									children: w.accessType === "premium" ? t.ops.access.premium : t.ops.access.free
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: w.deviceType,
									"aria-label": t.ops.device.phone,
									onChange: (v) => void patch(w.id, { deviceType: v }),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "phone",
											children: t.ops.device.phone
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "tablet",
											children: t.ops.device.tablet
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "both",
											children: t.ops.device.both
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
									value: w.status,
									"aria-label": t.ops.wallpapers,
									onChange: (v) => void patch(w.id, { status: v }),
									children: statuses.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: s,
										children: t.ops.status[s]
									}, s))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: "",
									"aria-label": t.ops.placeOn,
									onChange: (v) => {
										if (!v) return;
										setFeaturedSlot({ data: {
											wallpaperId: w.id,
											slot: v
										} }).then(load);
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											disabled: true,
											children: t.ops.placeOn
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "wotd",
											children: t.ops.placeWotd
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "editors_choice",
											children: t.ops.placeEditors
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "premium_spotlight",
											children: t.ops.placeSpotlight
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
							className: "w-full rounded-lg bg-surface px-3 py-2 sm:col-span-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
								className: "cursor-pointer text-sm text-muted",
								children: t.ops.seo
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 grid gap-2 sm:grid-cols-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										defaultValue: w.slug,
										placeholder: t.ops.seoSlug,
										"aria-label": t.ops.seoSlug,
										onBlur: (e) => {
											const slug = e.target.value.trim();
											if (slug && slug !== w.slug) updateWallpaperOps({ data: {
												wallpaperId: w.id,
												slug
											} });
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										defaultValue: w.seoTitle,
										placeholder: t.ops.seoTitle,
										"aria-label": t.ops.seoTitle,
										onBlur: (e) => void updateWallpaperOps({ data: {
											wallpaperId: w.id,
											seoTitle: e.target.value
										} })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										defaultValue: w.seoDescription,
										placeholder: t.ops.seoDescription,
										"aria-label": t.ops.seoDescription,
										onBlur: (e) => void updateWallpaperOps({ data: {
											wallpaperId: w.id,
											seoDescription: e.target.value
										} })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										defaultValue: w.altText,
										placeholder: t.ops.seoAlt,
										"aria-label": t.ops.seoAlt,
										onBlur: (e) => void updateWallpaperOps({ data: {
											wallpaperId: w.id,
											altText: e.target.value
										} })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										defaultValue: w.canonicalPath,
										placeholder: t.ops.seoCanonical,
										"aria-label": t.ops.seoCanonical,
										onBlur: (e) => void updateWallpaperOps({ data: {
											wallpaperId: w.id,
											canonicalPath: e.target.value
										} })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: cn("h-11 rounded-full px-4 text-sm", w.robots === "index" ? "bg-fg text-bg" : "bg-elevated text-muted"),
										onClick: () => void updateWallpaperOps({ data: {
											wallpaperId: w.id,
											robots: w.robots === "index" ? "noindex" : "index"
										} }).then(load),
										children: [
											t.ops.seoIndex,
											": ",
											w.robots
										]
									})
								]
							})]
						})
					]
				}, w.id))
			})
		]
	});
}
//#endregion
export { OpsWallpapersPage as component };

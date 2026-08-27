import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, v as Link, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getStudioDashboard } from "./studio-B5cbP66D.mjs";
import { K as t, U as formatUsd, V as formatCount } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { t as StatusBadge } from "./status-badge-B69raXn-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/studio-BxNHm6mf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StudioHome() {
	const navigate = useNavigate();
	const [data, setData] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)(false);
	function load() {
		setError(false);
		getStudioDashboard().then(setData).catch(() => setError(true));
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load });
	if (!data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 animate-pulse rounded-xl bg-elevated" });
	if (!data.marketplaceOn) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.studio.off });
	if (data.status === "none" || data.status === "rejected") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.2em] text-muted uppercase",
				children: t.studio.brand
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl text-fg",
				children: data.status === "rejected" ? t.studio.rejectedTitle : t.studio.applyTitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: data.status === "rejected" ? t.studio.rejectedBody : t.studio.applyBody
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6",
				onClick: () => void navigate({ to: "/studio/apply" }),
				children: t.studio.apply
			})
		]
	});
	if (data.status === "pending") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.2em] text-muted uppercase",
				children: t.studio.brand
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl text-fg",
				children: t.studio.pendingTitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: t.studio.pendingBody
			})
		]
	});
	if (data.status === "suspended") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.studio.suspendedTitle });
	const note = t.studio.shareNote.replace("{share}", String(data.creatorSharePercent)).replace("{min}", formatUsd(data.minPayout));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.2em] text-muted uppercase",
				children: t.studio.dashboard
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-1 font-display text-4xl text-fg",
				children: data.displayName
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [data.slug ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/creator/$slug",
					params: { slug: data.slug },
					className: "inline-flex h-11 items-center rounded-full bg-elevated px-4 text-sm text-fg",
					children: t.studio.publicPage
				}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: () => void navigate({ to: "/studio/submit" }),
					children: t.studio.submitCta
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4",
			children: [
				{
					label: t.studio.live,
					value: String(data.liveCount)
				},
				{
					label: t.studio.pending,
					value: String(data.pendingCount)
				},
				{
					label: t.studio.downloads,
					value: formatCount(data.downloads)
				},
				{
					label: t.studio.share,
					value: formatUsd(data.estimatedShare)
				}
			].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl bg-elevated px-4 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs tracking-wide text-muted uppercase",
					children: s.label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 font-display text-3xl tabular-nums text-fg",
					children: s.value
				})]
			}, s.label))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-xl text-xs text-subtle",
			children: note
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-10 font-display text-xl text-fg",
			children: t.studio.submit
		}),
		data.pieces.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: t.studio.emptyPieces
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 divide-y divide-border overflow-hidden rounded-xl bg-elevated",
			children: data.pieces.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center gap-3 px-3 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: p.thumbnailUrl,
						alt: "",
						className: "wallpaper-img h-14 w-8 shrink-0 rounded-sm object-cover"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-sm text-fg",
							children: p.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted",
							children: [
								formatCount(p.downloadCount),
								" · ",
								p.accessType === "premium" ? t.ops.access.premium : t.ops.access.free
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: p.status }),
					p.status !== "removed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/studio/submit",
						search: { piece: p.id },
						className: "inline-flex h-11 shrink-0 items-center px-3 text-sm text-muted hover:text-fg",
						children: t.studio.edit
					}) : null
				]
			}, p.id))
		})
	] });
}
//#endregion
export { StudioHome as component };

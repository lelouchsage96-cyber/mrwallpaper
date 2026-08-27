import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as formatDate, K as t } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { n as ErrorState } from "./empty-state-BWSi2TR4.mjs";
import { c as listOpsCreators, d as listOpsSubmissions, g as reviewOpsSubmission, h as reviewOpsCreator } from "./ops-C_QDXn1-.mjs";
import { t as StatusBadge } from "./status-badge-B69raXn-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/creators-BeC3QI25.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OpsCreatorsPage() {
	const [creators, setCreators] = (0, import_react.useState)([]);
	const [subs, setSubs] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	function load() {
		setLoading(true);
		setError(false);
		Promise.all([listOpsCreators(), listOpsSubmissions()]).then(([c, s]) => {
			setCreators(c.items);
			setSubs(s.items);
		}).catch(() => setError(true)).finally(() => setLoading(false));
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.2em] text-muted uppercase",
			children: t.ops.studio
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 font-display text-3xl text-fg",
			children: t.ops.creators
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: t.ops.creatorsHint
		}),
		loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-6 h-40 animate-pulse rounded-xl bg-elevated" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 font-display text-xl text-fg",
				children: t.ops.submissions
			}),
			subs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: t.ops.noSubmissions
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-border overflow-hidden rounded-xl bg-elevated",
				children: subs.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center gap-3 px-3 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: s.thumbnailUrl,
							alt: "",
							className: "wallpaper-img h-14 w-8 shrink-0 rounded-sm object-cover"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm text-fg",
								children: s.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted",
								children: [
									s.creatorName,
									" · ",
									s.accessType === "premium" ? t.ops.access.premium : t.ops.access.free
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: s.status }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: async () => {
								await reviewOpsSubmission({ data: {
									id: s.id,
									status: "approved"
								} });
								load();
							},
							children: t.ops.approve
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: async () => {
								await reviewOpsSubmission({ data: {
									id: s.id,
									status: "rejected"
								} });
								load();
							},
							children: t.ops.reject
						})
					]
				}, s.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-10 font-display text-xl text-fg",
				children: t.ops.applications
			}),
			creators.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted",
				children: t.ops.noCreators
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-border overflow-hidden rounded-xl bg-elevated",
				children: creators.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-wrap items-center gap-3 px-4 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm text-fg",
								children: c.displayName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "block truncate text-xs text-muted",
								children: [
									c.slug,
									" · ",
									formatDate(c.appliedAt),
									" · ",
									c.pieceCount
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: c.status }),
						c.status === "pending" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: async () => {
								await reviewOpsCreator({ data: {
									userId: c.userId,
									status: "approved"
								} });
								load();
							},
							children: t.ops.approve
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: async () => {
								await reviewOpsCreator({ data: {
									userId: c.userId,
									status: "rejected"
								} });
								load();
							},
							children: t.ops.reject
						})] }) : c.status === "approved" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/creator/$slug",
							params: { slug: c.slug },
							className: "text-sm text-muted hover:text-fg",
							children: t.studio.publicPage
						}) : null
					]
				}, c.userId))
			})
		] })
	] });
}
//#endregion
export { OpsCreatorsPage as component };

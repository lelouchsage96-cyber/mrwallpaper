import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as formatDate, K as t, z as cn } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { n as ErrorState, t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
import { S as updateReportOps, u as listOpsReports } from "./ops-C_QDXn1-.mjs";
import { t as StatusBadge } from "./status-badge-B69raXn-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reports-DMuZelqg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function OpsReportsPage() {
	const [items, setItems] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(false);
	const [filter, setFilter] = (0, import_react.useState)("open");
	function load() {
		setLoading(true);
		setError(false);
		listOpsReports().then((r) => setItems(r.items)).catch(() => setError(true)).finally(() => setLoading(false));
	}
	(0, import_react.useEffect)(() => {
		load();
	}, []);
	async function setStatus(id, status) {
		await updateReportOps({ data: {
			id,
			status
		} });
		setItems((prev) => prev.map((r) => r.id === id ? {
			...r,
			status
		} : r));
	}
	const openCount = items.filter((r) => r.status === "open").length;
	const visible = items.filter((r) => filter === "all" ? true : r.status === filter);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl text-fg",
			children: t.ops.reports
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-xl text-sm text-muted",
			children: t.ops.reportsHint
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ErrorState, { onRetry: load })
		}) : loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-5 h-40 animate-pulse rounded-xl bg-elevated" }) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.ops.noReports }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 space-y-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
				children: [
					["open", `${t.ops.openReports} · ${openCount}`],
					["resolved", t.ops.tabResolved],
					["dismissed", t.ops.tabDismissed],
					["all", t.ops.allStatuses]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setFilter(id),
					className: cn("h-9 shrink-0 rounded-full px-4 text-sm", filter === id ? "bg-fg text-bg" : "bg-elevated text-muted"),
					children: label
				}, id))
			}), visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-xl bg-elevated px-4 py-10 text-center text-sm text-muted",
				children: t.ops.noReports
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-border overflow-hidden rounded-xl bg-elevated",
				children: visible.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/wallpaper/$id",
						params: { id: r.wallpaperId },
						className: "flex min-w-0 flex-1 items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: r.thumbnailUrl,
							alt: "",
							className: "wallpaper-img h-14 w-8 shrink-0 rounded-sm object-cover"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block truncate text-sm font-medium text-fg",
								children: r.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs capitalize text-muted",
								children: [
									r.reason,
									" · ",
									formatDate(r.createdAt)
								]
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status }), r.status === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: () => setStatus(r.id, "resolved"),
							children: t.ops.resolve
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "secondary",
							onClick: () => setStatus(r.id, "dismissed"),
							children: t.ops.dismiss
						})] }) : null]
					})]
				}, r.id))
			})]
		})
	] });
}
//#endregion
export { OpsReportsPage as component };

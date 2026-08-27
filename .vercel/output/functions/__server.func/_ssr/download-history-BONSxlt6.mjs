import { v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as formatDate, K as t } from "./router-DQ8icHtZ.mjs";
import { n as LazyImage } from "./lazy-CeFyYund.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/download-history-BONSxlt6.js
var import_jsx_runtime = require_jsx_runtime();
function typeLabel(type) {
	if (type === "premium") return t.history.types.premium;
	if (type === "rewarded") return t.history.types.rewarded;
	return t.history.types.free;
}
function DownloadHistoryList({ items }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "divide-y divide-border overflow-hidden rounded-[20px] bg-elevated",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/wallpaper/$id",
			params: { id: item.id },
			className: "flex min-h-16 items-center gap-3 px-3 py-2.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
				src: item.thumbnailUrl,
				alt: "",
				width: 40,
				height: 71,
				className: "wallpaper-img h-14 w-8 shrink-0 rounded-[8px] object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm font-medium text-fg",
					children: item.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mt-0.5 block text-xs text-muted",
					children: [
						formatDate(item.downloadedAt),
						" · ",
						typeLabel(item.downloadType)
					]
				})]
			})]
		}) }, `${item.id}-${item.downloadedAt}`))
	});
}
//#endregion
export { DownloadHistoryList as t };

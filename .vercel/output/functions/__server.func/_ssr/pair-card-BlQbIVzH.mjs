import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t } from "./router-DQ8icHtZ.mjs";
import { n as LazyImage } from "./lazy-CeFyYund.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pair-card-BlQbIVzH.js
var import_jsx_runtime = require_jsx_runtime();
function PairCard({ pair }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href: `/pair/${pair.slug}`,
		className: "block w-44 shrink-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative h-52",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
						src: pair.home.thumbnailUrl,
						alt: `${pair.home.title} home screen wallpaper`,
						width: pair.home.width,
						height: pair.home.height,
						fallback: pair.home.thumbnailUrl,
						className: "wallpaper-img absolute top-4 left-10 h-44 w-24 rounded-md object-cover shadow-[var(--shadow-border)]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
						src: pair.lock.thumbnailUrl,
						alt: `${pair.lock.title} lock screen wallpaper`,
						width: pair.lock.width,
						height: pair.lock.height,
						fallback: pair.lock.thumbnailUrl,
						className: "wallpaper-img absolute top-0 left-0 h-48 w-[6.75rem] rounded-md object-cover shadow-[var(--shadow-border)]"
					}),
					pair.suggested ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute left-1 top-1 rounded-full bg-bg/75 px-2 py-0.5 text-[10px] tracking-wide text-fg backdrop-blur-sm",
						children: t.pairs.today
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-2 block truncate text-sm font-medium text-fg",
				children: pair.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "block text-xs text-muted",
				children: [
					t.pairs.lock,
					" + ",
					t.pairs.home
				]
			})
		]
	});
}
//#endregion
export { PairCard as t };

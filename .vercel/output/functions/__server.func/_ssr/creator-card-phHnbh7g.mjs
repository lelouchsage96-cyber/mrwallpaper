import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { U as plateFallback } from "./queries-bIh47-yB.mjs";
import { K as t, z as cn } from "./router-DQ8icHtZ.mjs";
import { n as LazyImage } from "./lazy-CeFyYund.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/creator-card-phHnbh7g.js
var import_jsx_runtime = require_jsx_runtime();
function CreatorCard({ creator, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
		href: `/creator/${creator.slug}`,
		className: cn("relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-elevated", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LazyImage, {
			src: creator.coverUrl,
			alt: `${creator.displayName} wallpapers`,
			width: 800,
			height: 1e3,
			fallback: plateFallback(creator.coverUrl),
			className: "wallpaper-img size-full object-cover"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/90 to-transparent px-3 pb-2.5 pt-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate font-medium text-fg",
				children: creator.displayName
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mt-0.5 block text-xs text-fg/70",
				children: t.creators.pieces.replace("{n}", String(creator.pieceCount))
			})]
		})]
	});
}
//#endregion
export { CreatorCard as t };

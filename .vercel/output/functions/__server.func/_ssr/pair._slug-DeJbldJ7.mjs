import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { J as resolveHero, it as wallpaperPath } from "./queries-bIh47-yB.mjs";
import { D as ChevronLeft } from "../_libs/lucide-react.mjs";
import { K as t, o as Route$8 } from "./router-DQ8icHtZ.mjs";
import { t as Breadcrumbs } from "./breadcrumbs-uNA0UpIi.mjs";
import { t as DevicePreview } from "./device-preview-8Ori_TGM.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pair._slug-DeJbldJ7.js
var import_jsx_runtime = require_jsx_runtime();
function PairPage() {
	const pair = Route$8.useLoaderData().pair;
	if (!pair) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-4 pb-16 pt-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: "/",
				className: "mb-4 flex min-h-11 items-center gap-1 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), t.nav.home]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breadcrumbs, { items: [
				{
					name: "Home",
					href: "/"
				},
				{
					name: "Wallpapers",
					href: "/wallpapers"
				},
				{ name: pair.name }
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-xs tracking-[0.2em] text-muted uppercase",
				children: t.pairs.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl text-fg",
				children: pair.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-sm text-muted",
				children: pair.description
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 grid gap-10 sm:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-center text-xs tracking-widest text-subtle uppercase",
						children: t.pairs.lock
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePreview, {
						src: resolveHero(pair.lock.id, pair.lock.thumbnailUrl),
						alt: pair.lock.title,
						mode: "lock",
						hideToggle: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: wallpaperPath(pair.lock.slug || pair.lock.id),
						className: "mt-4 flex h-11 items-center justify-center rounded-full bg-elevated text-sm text-fg",
						children: t.pairs.openLock
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-center text-xs tracking-widest text-subtle uppercase",
						children: t.pairs.home
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DevicePreview, {
						src: resolveHero(pair.home.id, pair.home.thumbnailUrl),
						alt: pair.home.title,
						mode: "home",
						hideToggle: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: wallpaperPath(pair.home.slug || pair.home.id),
						className: "mt-4 flex h-11 items-center justify-center rounded-full bg-elevated text-sm text-fg",
						children: t.pairs.openHome
					})
				] })]
			})
		]
	});
}
//#endregion
export { PairPage as component };

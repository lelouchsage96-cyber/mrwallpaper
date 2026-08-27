import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, n as Route$2 } from "./router-DQ8icHtZ.mjs";
import { n as WallpaperGrid } from "./wallpaper-grid-CveWJYI3.mjs";
import { t as Breadcrumbs } from "./breadcrumbs-uNA0UpIi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wallpapers._slug-DmNYPCUU.js
var import_jsx_runtime = require_jsx_runtime();
function HubPage() {
	const { slug } = Route$2.useParams();
	const search = Route$2.useSearch();
	const data = Route$2.useLoaderData();
	const page = search.page ?? 1;
	const name = data.category?.name ?? data.hub?.name ?? slug;
	const intro = data.category?.intro || data.category?.description || data.hub?.intro || "";
	const next = data.hasMore ? page + 1 : null;
	const prev = page > 1 ? page - 1 : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-4 pb-20 pt-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Breadcrumbs, { items: [
				{
					name: "Home",
					href: "/"
				},
				{
					name: "Wallpapers",
					href: "/wallpapers"
				},
				{ name }
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "mt-6 font-display text-4xl text-fg",
				children: [name, " wallpapers"]
			}),
			intro ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-2xl text-sm leading-relaxed text-muted",
				children: intro
			}) : null,
			data.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-10 text-sm text-muted",
				children: t.errors.empty
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperGrid, {
					items: data.items,
					eager: 4
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
				className: "mt-10 flex items-center gap-4 text-sm",
				"aria-label": "Pagination",
				children: [
					prev ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: prev === 1 ? `/wallpapers/${slug}` : `/wallpapers/${slug}?page=${prev}`,
						className: "text-muted hover:text-fg",
						children: "Previous"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-subtle",
						children: "Previous"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: ["Page ", page]
					}),
					next ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: `/wallpapers/${slug}?page=${next}`,
						className: "text-muted hover:text-fg",
						children: "Next"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-subtle",
						children: "Next"
					})
				]
			})
		]
	});
}
//#endregion
export { HubPage as component };

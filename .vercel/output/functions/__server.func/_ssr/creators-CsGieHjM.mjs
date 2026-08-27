import { x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, h as Route$36 } from "./router-DQ8icHtZ.mjs";
import { t as CreatorCard } from "./creator-card-phHnbh7g.mjs";
import { t as EmptyState } from "./empty-state-BWSi2TR4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/creators-CsGieHjM.js
var import_jsx_runtime = require_jsx_runtime();
function CreatorsPage() {
	const data = Route$36.useLoaderData();
	const items = data.items;
	const on = data.marketplaceOn;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-5xl px-4 pb-20 pt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-4xl text-fg",
			children: t.creators.title
		}), !on || items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, { title: t.creators.empty }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3",
			children: items.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "min-w-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreatorCard, { creator: c })
			}, c.slug))
		})]
	});
}
//#endregion
export { CreatorsPage as component };

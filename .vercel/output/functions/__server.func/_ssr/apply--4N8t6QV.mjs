import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as applyToStudio } from "./studio-B5cbP66D.mjs";
import { G as slugify, K as t } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { t as Input } from "./input-BCaChIGK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/apply--4N8t6QV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StudioApply() {
	const navigate = useNavigate();
	const [name, setName] = (0, import_react.useState)("");
	const [slugEdit, setSlugEdit] = (0, import_react.useState)(null);
	const [bio, setBio] = (0, import_react.useState)("");
	const [msg, setMsg] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const slug = (0, import_react.useMemo)(() => slugEdit !== null ? slugEdit : slugify(name), [name, slugEdit]);
	async function submit() {
		if (name.trim().length < 2) {
			setMsg(t.studio.needName);
			return;
		}
		setBusy(true);
		setMsg(null);
		try {
			const res = await applyToStudio({ data: {
				displayName: name.trim(),
				slug,
				bio: bio.trim()
			} });
			if (!res.ok) {
				setMsg(res.error === "taken" ? t.studio.slugTaken : t.studio.needName);
				return;
			}
			navigate({ to: "/studio" });
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto max-w-lg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-[0.2em] text-muted uppercase",
				children: t.studio.brand
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-4xl text-fg",
				children: t.studio.applyTitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm leading-relaxed text-muted",
				children: t.studio.applyBody
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-8 block text-sm text-muted",
				children: [t.studio.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-2",
					value: name,
					onChange: (e) => setName(e.target.value),
					maxLength: 40,
					autoComplete: "organization"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block text-sm text-muted",
				children: [t.studio.slug, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-2",
					value: slug,
					onChange: (e) => setSlugEdit(e.target.value.toLowerCase()),
					maxLength: 32
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-4 block text-sm text-muted",
				children: [t.studio.bio, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: bio,
					onChange: (e) => setBio(e.target.value),
					maxLength: 280,
					rows: 4,
					className: "mt-2 w-full rounded-[12px] bg-elevated px-4 py-3 text-sm text-fg placeholder:text-subtle shadow-[var(--shadow-border)] outline-none focus-visible:ring-2 focus-visible:ring-ring",
					placeholder: t.studio.bioHint
				})]
			}),
			msg ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-danger",
				children: msg
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "mt-6 w-full",
				disabled: busy,
				onClick: () => void submit(),
				children: busy ? t.studio.applying : t.studio.apply
			})
		]
	});
}
//#endregion
export { StudioApply as component };

import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, b as useRouter, v as Link, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { ot as brand } from "./queries-bIh47-yB.mjs";
import { i as GROK_PROVIDERS } from "./verify.server-DYWA13FN.mjs";
import { K as t, m as Route$35, v as MwMark } from "./router-DQ8icHtZ.mjs";
import { i as signIn, t as authClient } from "./client-BXBOTlUB.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
import { t as Input } from "./input-BCaChIGK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-2L72yGog.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { next } = Route$35.useSearch();
	const router = useRouter();
	const [mode, setMode] = (0, import_react.useState)("signin");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [info, setInfo] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function onEmail(e) {
		e.preventDefault();
		setError(null);
		setInfo(null);
		setBusy(true);
		try {
			if (mode === "reset") {
				setInfo(t.auth.resetSent);
				return;
			}
			if (mode === "signup") {
				const { error: err } = await authClient.signUp.email({
					email,
					password,
					name: name || email.split("@")[0] || "Member"
				});
				if (err) throw new Error(err.message);
			} else {
				const { error: err } = await authClient.signIn.email({
					email,
					password
				});
				if (err) throw new Error(err.message);
			}
			router.history.push(next ?? "/app");
		} catch {
			setError(mode === "signin" ? t.auth.invalid : t.auth.error);
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "size-12" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-6 font-display text-4xl text-fg",
				children: mode === "signup" ? t.auth.needAccount : mode === "reset" ? t.auth.resetTitle : t.auth.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: mode === "reset" ? t.auth.resetHint : t.auth.subtitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 space-y-3",
				children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "secondary",
					className: "w-full",
					onClick: () => void signIn(p.providerId, {
						callbackURL: next ?? "/app",
						errorCallbackURL: "/login"
					}),
					children: [
						t.auth.continueWith,
						" ",
						p.label
					]
				}, p.providerId))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "my-6 text-center text-xs uppercase tracking-[0.18em] text-subtle",
				children: t.auth.orEmail
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-3",
				onSubmit: (e) => void onEmail(e),
				children: [
					mode === "signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						name: "name",
						autoComplete: "name",
						placeholder: t.auth.name,
						value: name,
						onChange: (e) => setName(e.target.value)
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						name: "email",
						type: "email",
						autoComplete: "email",
						required: true,
						placeholder: t.auth.email,
						value: email,
						onChange: (e) => setEmail(e.target.value)
					}),
					mode !== "reset" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						name: "password",
						type: "password",
						autoComplete: mode === "signup" ? "new-password" : "current-password",
						required: true,
						minLength: 8,
						placeholder: t.auth.password,
						value: password,
						onChange: (e) => setPassword(e.target.value)
					}) : null,
					error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-danger",
						children: error
					}) : null,
					info ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: info
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: busy,
						children: mode === "reset" ? t.auth.resetSend : mode === "signup" ? t.auth.signUp : t.auth.signIn
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-2 text-center text-sm text-muted",
				children: [mode === "signin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 text-fg",
					onClick: () => setMode("reset"),
					children: t.auth.forgot
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					t.auth.noAccount,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-fg underline-offset-4 hover:underline",
						onClick: () => setMode("signup"),
						children: t.auth.signUp
					})
				] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
					t.auth.hasAccount,
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "text-fg underline-offset-4 hover:underline",
						onClick: () => setMode("signin"),
						children: t.auth.signIn
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/app",
					className: "block min-h-11 pt-2 text-muted hover:text-fg",
					children: t.auth.guest
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-8 text-center text-xs text-subtle",
				children: [
					brand.name,
					". ",
					brand.tagline
				]
			})
		]
	});
}
//#endregion
export { Login as component };

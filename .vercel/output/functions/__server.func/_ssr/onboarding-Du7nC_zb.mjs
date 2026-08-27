import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime, y as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { K as t, v as MwMark, y as ONBOARDING_KEY } from "./router-DQ8icHtZ.mjs";
import { t as Button } from "./button-CNkutHzj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-Du7nC_zb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var previews = [
	[
		"/wallpapers/ridge-line.jpg",
		"/wallpapers/after-rain-sky.jpg",
		"/wallpapers/true-black.jpg"
	],
	[
		"/wallpapers/paper-moon.jpg",
		"/wallpapers/late-grid.jpg",
		"/wallpapers/crane-hour.jpg"
	],
	[
		"/wallpapers/lock-dune.jpg",
		"/wallpapers/kepler-dust.jpg",
		"/wallpapers/thin-cross.jpg"
	]
];
function complete() {
	localStorage.setItem(ONBOARDING_KEY, "1");
}
function Onboarding() {
	const navigate = useNavigate();
	const [step, setStep] = (0, import_react.useState)(0);
	const screens = t.onboarding.screens;
	const last = step === screens.length - 1;
	const screen = screens[step];
	const shots = previews[step] ?? previews[0];
	function skip() {
		complete();
		navigate({ to: "/app" });
	}
	function finish() {
		complete();
		navigate({
			to: "/login",
			search: { next: "/app" }
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-10 pt-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MwMark, { className: "size-9" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "min-h-11 px-2 text-sm text-muted",
					onClick: skip,
					children: t.onboarding.skip
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col justify-center mw-enter",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "relative mx-auto mb-8 h-56 w-full max-w-xs",
						children: shots.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src,
							alt: "",
							className: "absolute top-0 aspect-[9/16] w-28 rounded-[20px] object-cover shadow-[var(--shadow-border)]",
							style: {
								left: `${18 + i * 22}%`,
								zIndex: i === 1 ? 3 : 1,
								transform: `rotate(${(i - 1) * 8}deg) translateY(${i === 1 ? 0 : 12}px)`
							}
						}, src))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs tracking-[0.2em] text-muted uppercase",
						children: [
							String(step + 1).padStart(2, "0"),
							" / ",
							String(screens.length).padStart(2, "0")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-4xl text-fg md:text-5xl",
						children: screen.headline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-sm text-base text-muted",
						children: screen.description
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2 pb-4",
				children: screens.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1 flex-1 rounded-full ${i <= step ? "bg-fg" : "bg-elevated"}` }, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				className: "w-full",
				onClick: () => {
					if (last) finish();
					else setStep((s) => s + 1);
				},
				children: last ? t.onboarding.getStarted : t.onboarding.next
			})
		]
	});
}
//#endregion
export { Onboarding as component };

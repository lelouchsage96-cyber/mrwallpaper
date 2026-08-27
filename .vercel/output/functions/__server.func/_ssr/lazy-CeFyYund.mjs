import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { z as cn } from "./router-DQ8icHtZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/lazy-CeFyYund.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useInView(opts = {}) {
	const { rootMargin = "280px 80px", once = true, disabled = false } = opts;
	const [node, setNode] = (0, import_react.useState)(null);
	const [inView, setInView] = (0, import_react.useState)(disabled);
	const ref = (0, import_react.useCallback)((el) => setNode(el), []);
	(0, import_react.useEffect)(() => {
		if (disabled) {
			setInView(true);
			return;
		}
		if (!node) return;
		if (typeof IntersectionObserver === "undefined") {
			setInView(true);
			return;
		}
		const io = new IntersectionObserver(([entry]) => {
			if (!entry?.isIntersecting) return;
			setInView(true);
			if (once) io.disconnect();
		}, {
			root: null,
			rootMargin,
			threshold: 0
		});
		io.observe(node);
		const fallback = window.setTimeout(() => setInView(true), 250);
		return () => {
			io.disconnect();
			window.clearTimeout(fallback);
		};
	}, [
		disabled,
		node,
		once,
		rootMargin
	]);
	return {
		ref,
		inView
	};
}
function LazyImage({ src, alt, className, width, height, sizes, srcSet, priority, fallback }) {
	const [failed, setFailed] = (0, import_react.useState)(false);
	const href = failed && fallback ? fallback : src;
	const webp = href.endsWith(".webp") ? href : href.includes("/wallpapers/thumbs/") ? href.replace(/\.(jpe?g|png)$/i, ".webp") : href.replace(/-thumb\.jpe?g$/i, "-thumb.webp");
	const useWebp = href.includes("/wallpapers/thumbs/") || href.endsWith(".webp");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("picture", { children: [useWebp && !failed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
		type: "image/webp",
		srcSet: webp
	}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: href,
		srcSet: !failed ? srcSet : void 0,
		alt,
		width,
		height,
		sizes,
		loading: priority ? "eager" : "lazy",
		fetchPriority: priority ? "high" : "low",
		decoding: "async",
		onError: () => {
			if (fallback && !failed) setFailed(true);
		},
		className: cn("bg-elevated", className)
	})] });
}
function LazyMount({ children, minHeight = 280, eager }) {
	const { ref, inView } = useInView({
		disabled: eager,
		rootMargin: "640px 0px"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		style: inView ? void 0 : { minHeight },
		children: inView ? children : null
	});
}
function InfiniteSentinel({ onLoad, disabled }) {
	const { ref, inView } = useInView({
		once: false,
		disabled,
		rootMargin: "720px 0px"
	});
	const fn = (0, import_react.useRef)(onLoad);
	fn.current = onLoad;
	(0, import_react.useEffect)(() => {
		if (!inView || disabled) return;
		fn.current();
	}, [disabled, inView]);
	if (disabled) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "h-8",
		"aria-hidden": true
	});
}
//#endregion
export { LazyImage as n, LazyMount as r, InfiniteSentinel as t };

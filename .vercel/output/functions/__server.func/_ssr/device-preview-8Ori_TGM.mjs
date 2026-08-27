import { o as __toESM } from "../_runtime.mjs";
import { U as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as FileText, f as Phone, g as Mail, h as Map, j as Battery, k as Camera, m as Music2, n as Wifi, o as Sun, u as Settings, x as Flashlight } from "../_libs/lucide-react.mjs";
import { K as t, z as cn } from "./router-DQ8icHtZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/device-preview-8Ori_TGM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function clockParts(now) {
	const d = now ?? new Date(2e3, 0, 1, 9, 41);
	const minutes = d.getMinutes();
	const hours = d.getHours() % 12;
	return {
		minuteDeg: minutes * 6,
		hourDeg: hours * 30 + minutes * .5
	};
}
function AnalogClock({ now, className }) {
	const { hourDeg, minuteDeg } = clockParts(now);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("mw-clock-face", className),
		children: [
			Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mw-clock-tick",
				style: { transform: `rotate(${i * 30}deg)` }
			}, i)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mw-clock-hour",
				style: { transform: `rotate(${hourDeg}deg)` }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mw-clock-minute",
				style: { transform: `rotate(${minuteDeg}deg)` }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-clock-dot" })
		]
	});
}
function CalendarFace({ now }) {
	const d = now ?? new Date(2e3, 7, 26);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "mw-app-icon mw-app-cal",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mw-cal-month",
			children: d.toLocaleDateString(void 0, { month: "short" }).toUpperCase()
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mw-cal-day",
			children: d.getDate()
		})]
	});
}
function PhotosGlyph() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 32 32",
		className: "relative z-[1] size-[70%]",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
			transform: "translate(16 16)",
			children: [[
				"#ff375f",
				"#ff9f0a",
				"#ffd60a",
				"#30d158",
				"#64d2ff",
				"#0a84ff",
				"#5e5ce6",
				"#bf5af2"
			].map((c, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "0",
				cy: "-6.6",
				rx: "3.2",
				ry: "6.8",
				fill: c,
				transform: `rotate(${i * 45})`
			}, c)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				r: "2.6",
				fill: "white"
			})]
		})
	});
}
function SafariGlyph() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: "relative z-[1] size-[72%]",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "16",
				r: "13",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.7"
			}),
			Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "15.35",
				y: "3.1",
				width: "1.3",
				height: i % 3 === 0 ? 3.1 : 1.7,
				rx: "0.4",
				fill: "currentColor",
				transform: `rotate(${i * 30} 16 16)`
			}, i)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "16,5 18.8,16 16,14.5 13.2,16",
				fill: "#ff3b30"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: "16,27 13.2,16 16,17.5 18.8,16",
				fill: "currentColor",
				opacity: "0.88"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "16",
				r: "1.35",
				fill: "currentColor"
			})
		]
	});
}
function HomeApp({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mw-home-app",
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mw-app-label",
			children: label
		})]
	});
}
function GlassIcon({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "mw-app-icon",
		children
	});
}
function DevicePreview({ src, videoSrc, alt, mode, onModeChange, hideToggle = false, variant = "phone", landscape = false }) {
	const [now, setNow] = (0, import_react.useState)(null);
	const [plateSrc, setPlateSrc] = (0, import_react.useState)(src);
	(0, import_react.useEffect)(() => {
		setNow(/* @__PURE__ */ new Date());
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 3e4);
		return () => window.clearInterval(id);
	}, []);
	(0, import_react.useEffect)(() => {
		setPlateSrc(src);
	}, [src]);
	function onPlateError() {
		if (plateSrc.endsWith(".jpg")) {
			setPlateSrc(plateSrc.replace(/\.jpg$/i, ".svg"));
			return;
		}
		if (plateSrc.endsWith(".webp")) setPlateSrc(plateSrc.replace(/\/thumbs\/([^/.]+)\.webp$/i, "/$1.jpg"));
	}
	const time = now ? now.toLocaleTimeString(void 0, {
		hour: "numeric",
		minute: "2-digit"
	}).replace(/\s?[AP]M$/i, "") : "9:41";
	const date = now ? now.toLocaleDateString(void 0, {
		weekday: "long",
		month: "long",
		day: "numeric"
	}) : "Wednesday, August 26";
	const weekday = now ? now.toLocaleDateString(void 0, { weekday: "short" }).toUpperCase() : "WED";
	const monthLong = now ? now.toLocaleDateString(void 0, { month: "long" }) : "August";
	const dayNum = now ? String(now.getDate()) : "26";
	const plate = videoSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
		src: videoSrc,
		poster: plateSrc,
		className: "size-full object-cover",
		autoPlay: true,
		muted: true,
		loop: true,
		playsInline: true,
		preload: "metadata"
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: plateSrc,
		alt,
		width: landscape ? 2048 : 1080,
		height: landscape ? 1536 : 1920,
		className: "size-full object-cover",
		decoding: "async",
		fetchPriority: "high",
		onError: onPlateError
	});
	if (variant === "tablet") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: landscape ? "mw-tablet" : "mw-tablet is-portrait",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mw-tablet-screen",
				children: [
					plate,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mw-tablet-cam",
						"aria-hidden": true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("pointer-events-none absolute inset-0 flex flex-col transition-opacity duration-200 ease-out", mode === "lock" ? "opacity-100" : "hidden"),
						"aria-hidden": mode !== "lock",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-10 text-center text-sm font-medium tracking-wide text-on-photo",
								children: date
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-center font-sans text-6xl font-light leading-none tracking-tight text-on-photo tabular-nums sm:text-7xl",
								children: time
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-auto flex flex-col items-center gap-4 pb-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-tablet-home-bar" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("pointer-events-none absolute inset-0 flex flex-col transition-opacity duration-200 ease-out", mode === "home" ? "opacity-100" : "hidden"),
						"aria-hidden": mode !== "home",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mw-home-shade" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative mw-home-status",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-semibold tabular-nums",
										children: time
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center justify-end gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, {
											className: "size-3.5",
											strokeWidth: 2.4
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Battery, {
											className: "size-4",
											strokeWidth: 2.2
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative mt-auto flex flex-col items-center gap-2.5 pb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mw-dock",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafariGlyph, {}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
											className: "size-5",
											fill: "currentColor",
											strokeWidth: 1.6
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotosGlyph, {}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music2, {
											className: "size-5",
											fill: "currentColor",
											strokeWidth: 1.6
										}) })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-tablet-home-bar" })]
							})
						]
					})
				]
			})
		})
	}), hideToggle ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto mt-5 grid max-w-xs grid-cols-2 gap-2",
		children: ["lock", "home"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onModeChange?.(m),
			className: cn("h-11 rounded-full text-sm", mode === m ? "bg-fg text-bg" : "bg-elevated text-muted"),
			children: m === "lock" ? t.preview.lock : t.preview.home
		}, m))
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "px-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mw-phone",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mw-phone-silent",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mw-phone-vol-up",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mw-phone-vol-down",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mw-phone-power",
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mw-phone-screen",
					children: [
						videoSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							src: videoSrc,
							poster: plateSrc,
							className: "size-full object-cover",
							autoPlay: true,
							muted: true,
							loop: true,
							playsInline: true,
							preload: "metadata"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: plateSrc,
							alt,
							width: 1080,
							height: 1920,
							className: "size-full object-cover",
							decoding: "async",
							fetchPriority: "high",
							onError: onPlateError
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mw-phone-island",
							"aria-hidden": true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("pointer-events-none absolute inset-0 z-[4] flex flex-col overflow-hidden transition-opacity duration-200 ease-out", mode === "lock" ? "opacity-100" : "hidden"),
							"aria-hidden": mode !== "lock",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-14 whitespace-nowrap px-3 text-center text-sm font-medium tracking-wide text-on-photo",
									children: date
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 whitespace-nowrap text-center font-sans text-7xl font-light leading-none tracking-tight text-on-photo tabular-nums sm:text-8xl",
									children: time
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-auto flex flex-col items-center gap-5 pb-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex w-full justify-between px-8",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-12 place-items-center rounded-full bg-on-photo/20 text-on-photo backdrop-blur-md",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flashlight, {
												className: "size-5",
												strokeWidth: 1.6
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "grid size-12 place-items-center rounded-full bg-on-photo/20 text-on-photo backdrop-blur-md",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
												className: "size-5",
												strokeWidth: 1.6
											})
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-phone-home-bar" })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("pointer-events-none absolute inset-0 z-[4] flex flex-col overflow-hidden gap-5 transition-opacity duration-200 ease-out", mode === "home" ? "opacity-100" : "hidden"),
							"aria-hidden": mode !== "home",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mw-home-shade" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mw-home-status",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-semibold tabular-nums",
											children: time
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center justify-end gap-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-end gap-px",
													"aria-hidden": true,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-status-glyph h-1 w-0.5 rounded-sm" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-status-glyph h-1.5 w-0.5 rounded-sm" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-status-glyph h-2 w-0.5 rounded-sm" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-status-glyph h-2.5 w-0.5 rounded-sm" })
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wifi, {
													className: "size-3.5",
													strokeWidth: 2.4
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Battery, {
													className: "size-4",
													strokeWidth: 2.2
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mw-home-widgets",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mw-widget",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mw-widget-kicker",
												children: weekday
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mw-widget-day",
												children: dayNum
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mw-widget-sub",
												children: monthLong
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mw-widget mw-widget-clock",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalogClock, { now })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mw-home-apps",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Calendar",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarFace, { now })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Photos",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhotosGlyph, {}) })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Camera",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, {
												className: "size-5",
												fill: "currentColor",
												strokeWidth: 1.6
											}) })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Clock",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnalogClock, { now }) })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Maps",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, {
												className: "size-5",
												fill: "currentColor",
												strokeWidth: 1.6
											}) })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Weather",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
												className: "size-5",
												fill: "currentColor",
												strokeWidth: 1.6
											}) })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Notes",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
												className: "size-5",
												fill: "currentColor",
												strokeWidth: 1.6
											}) })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomeApp, {
											label: "Settings",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, {
												className: "size-5",
												fill: "currentColor",
												strokeWidth: 1.6
											}) })
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative mt-auto flex flex-col items-center gap-2.5 pb-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex gap-1.5",
											"aria-hidden": true,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-on-photo" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-on-photo/35" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mw-dock",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {
													className: "size-5",
													fill: "currentColor",
													strokeWidth: 1.4
												}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, {
													className: "size-5",
													fill: "currentColor",
													strokeWidth: 1.6
												}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SafariGlyph, {}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GlassIcon, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Music2, {
													className: "size-5",
													fill: "currentColor",
													strokeWidth: 1.6
												}) })
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mw-phone-home-bar" })
									]
								})
							]
						})
					]
				})
			]
		})
	}), hideToggle ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mx-auto mt-5 grid max-w-xs grid-cols-2 gap-2",
		children: ["lock", "home"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onModeChange?.(m),
			className: cn("h-11 rounded-full text-sm", mode === m ? "bg-fg text-bg" : "bg-elevated text-muted"),
			children: m === "lock" ? t.preview.lock : t.preview.home
		}, m))
	})] });
}
//#endregion
export { DevicePreview as t };

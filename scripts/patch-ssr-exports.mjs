#!/usr/bin/env node
/**
 * Rolldown splits Start SSR into ssr.mjs ↔ ssr2.mjs with a circular import:
 * ssr2 imports __exportAll from ssr, ssr imports the server entry from ssr2.
 * Node then throws (`ssr_exports is not defined` / `__exportAll$1 is not a
 * function`) and Nitro answers `{ error: true, status: 500, unhandled: true }`.
 *
 * Also copies PGLite wasm/data next to the bundled driver so `vite preview`
 * can boot without DATABASE_URL.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ssrDir = join(root, ".vercel/output/functions/__server.func/_ssr");
const libsDir = join(root, ".vercel/output/functions/__server.func/_libs");
const ssr = join(ssrDir, "ssr.mjs");
const ssr2 = join(ssrDir, "ssr2.mjs");

function patchSsr(src) {
  // Newer Rolldown builds already bind `var ssr_exports`. Re-inserting `const`
  // duplicates the identifier and Nitro answers 500 (`ssr_exports has already
  // been declared`).
  if (/\b(?:var|let|const)\s+ssr_exports\s*=/.test(src)) return src;
  if (!src.includes("ssr_exports as s")) return src;
  return src.replace(
    "export { getServerFnById as a, __exportAll as c, createServerEntry, server_default as default, TSS_SERVER_FUNCTION as i, createMiddleware as n, getRequest as o, createServerFn as r, ssr_exports as s, server_exports as t };",
    "const ssr_exports = { getServerFnById, __exportAll, createServerEntry, default: server_default, TSS_SERVER_FUNCTION, createMiddleware, getRequest, createServerFn, server_exports };\nexport { getServerFnById as a, __exportAll as c, createServerEntry, server_default as default, TSS_SERVER_FUNCTION as i, createMiddleware as n, getRequest as o, createServerFn as r, ssr_exports as s, server_exports as t };",
  );
}

function patchSsr2(src) {
  let next = src.replace(
    'import { c as __exportAll$1 } from "./ssr.mjs";\n',
    "",
  );
  next = next.replace(
    "var server_exports = /* @__PURE__ */ __exportAll$1({ setCookie: () => setCookie$1 });",
    "var server_exports = { setCookie: setCookie$1 };",
  );
  next = next.replace(
    "var server_exports = /* @__PURE__ */ (() => {\n\tconst target = { setCookie: setCookie$1 };\n\treturn target;\n})();",
    "var server_exports = { setCookie: setCookie$1 };",
  );
  return next;
}

let changed = false;
if (existsSync(ssr)) {
  const before = readFileSync(ssr, "utf8");
  const after = patchSsr(before);
  if (after !== before) {
    writeFileSync(ssr, after);
    changed = true;
  }
}
if (existsSync(ssr2)) {
  const before = readFileSync(ssr2, "utf8");
  const after = patchSsr2(before);
  if (after !== before) {
    writeFileSync(ssr2, after);
    changed = true;
  }
}

const pgliteDist = join(root, "node_modules/@electric-sql/pglite/dist");
if (existsSync(libsDir) && existsSync(pgliteDist)) {
  mkdirSync(libsDir, { recursive: true });
  for (const name of ["pglite.wasm", "initdb.wasm", "pglite.data"]) {
    const from = join(pgliteDist, name);
    const to = join(libsDir, name);
    if (existsSync(from) && !existsSync(to)) {
      copyFileSync(from, to);
      changed = true;
    }
  }
}

if (changed) console.log("[patch-ssr] production SSR + PGLite assets ready");

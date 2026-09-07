import { Buffer } from "node:buffer";
import { APP_ICON_CHUNK_0 } from "@/lib/app-icon/chunk-0";
import { APP_ICON_CHUNK_1 } from "@/lib/app-icon/chunk-1";
import { APP_ICON_CHUNK_2 } from "@/lib/app-icon/chunk-2";
import { APP_ICON_CHUNK_3 } from "@/lib/app-icon/chunk-3";
import { APP_ICON_CHUNK_4 } from "@/lib/app-icon/chunk-4";
import { APP_ICON_CHUNK_5 } from "@/lib/app-icon/chunk-5";
import { APP_ICON_CHUNK_6 } from "@/lib/app-icon/chunk-6";
import { APP_ICON_CHUNK_7 } from "@/lib/app-icon/chunk-7";

export const APP_ICON_BASE64 =
  APP_ICON_CHUNK_0 +
  APP_ICON_CHUNK_1 +
  APP_ICON_CHUNK_2 +
  APP_ICON_CHUNK_3 +
  APP_ICON_CHUNK_4 +
  APP_ICON_CHUNK_5 +
  APP_ICON_CHUNK_6 +
  APP_ICON_CHUNK_7;

const SOURCE_PNG = Buffer.from(APP_ICON_BASE64, "base64");

export function appIconResponse(_size?: 32 | 180 | 192 | 512) {
  return new Response(SOURCE_PNG, {
    headers: {
      "content-type": "image/png",
      "content-length": String(SOURCE_PNG.byteLength),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

export function appIconSvgResponse(maskable = false) {
  const image = maskable
    ? `<rect width="512" height="512" fill="#05070b"/><image href="data:image/png;base64,${APP_ICON_BASE64}" x="51" y="51" width="410" height="410"/>`
    : `<image href="data:image/png;base64,${APP_ICON_BASE64}" x="0" y="0" width="512" height="512"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${image}</svg>`;
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

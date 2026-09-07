import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";
import { APP_ICON_CHUNK_0 } from "@/lib/app-icon/chunk-0";
import { APP_ICON_CHUNK_1 } from "@/lib/app-icon/chunk-1";
import { APP_ICON_CHUNK_2 } from "@/lib/app-icon/chunk-2";
import { APP_ICON_CHUNK_3 } from "@/lib/app-icon/chunk-3";
import { APP_ICON_CHUNK_4 } from "@/lib/app-icon/chunk-4";
import { APP_ICON_CHUNK_5 } from "@/lib/app-icon/chunk-5";
import { APP_ICON_CHUNK_6 } from "@/lib/app-icon/chunk-6";
import { APP_ICON_CHUNK_7 } from "@/lib/app-icon/chunk-7";

const APP_ICON_BASE64 =
  APP_ICON_CHUNK_0 +
  APP_ICON_CHUNK_1 +
  APP_ICON_CHUNK_2 +
  APP_ICON_CHUNK_3 +
  APP_ICON_CHUNK_4 +
  APP_ICON_CHUNK_5 +
  APP_ICON_CHUNK_6 +
  APP_ICON_CHUNK_7;

export const Route = createFileRoute("/app-icon.png")({
  server: {
    handlers: {
      GET: async () => {
        const bytes = Buffer.from(APP_ICON_BASE64, "base64");
        return new Response(bytes, {
          headers: {
            "content-type": "image/png",
            "content-length": String(bytes.byteLength),
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});

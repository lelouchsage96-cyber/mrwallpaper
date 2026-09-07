import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";

const APP_ICON_BASE64 = `iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAIAAAB7GkOtAAEAAElEQVR42uz9e7xdR3nfCX+...TRUNCATED...`;

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

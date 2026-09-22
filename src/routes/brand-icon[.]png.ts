import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";

const ICON_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAIAAACyr5FlAAAMdklEQVR42u2de1AT1x7HN0AMJhAf0Dj4AIOXi3qxIKjh0Tooll6xgopQRJj6AAFr6wWx7R+lM7W9nbl0SqtW5CECg5YWlYe2VbkWp1MJRfQWKteiKC2lVyTWCDEUCA3cP7ZdMyGbJyS7w/cz+WOz57eHc3Y/OefsSTjL4fMFBAC6sMMpAJADQA4AOQDkAJADQA4AOQDkAJADQA4AIAeAHAByAMgBIAeAHAByAMgBIAeAHAByAMgBAOQAkANADgA5AOQAkANADgA5AOQAkAMAyAEgB4AcAHIAyAEgB4AcAHIAyAEgBwAEQRDE/wFOw4uHZs4XGwAAAABJRU5ErkJggg==";

export const Route = createFileRoute("/brand-icon.png")({
  server: {
    handlers: {
      GET: () => {
        const bytes = Buffer.from(ICON_BASE64, "base64");
        return new Response(bytes, {
          headers: {
            "content-type": "image/png",
            "content-length": String(bytes.byteLength),
            "cache-control": "public, max-age=300, must-revalidate",
          },
        });
      },
    },
  },
});

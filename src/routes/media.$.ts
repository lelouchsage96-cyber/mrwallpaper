import { createFileRoute } from "@tanstack/react-router";
import { loadPublicPlate } from "@/lib/server/queries";

export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const name = params._splat ?? "";
        if (!name || name.length > 120) return new Response("Not found", { status: 404 });
        try {
          const plate = await loadPublicPlate(name);
          if (!plate) return new Response("Not found", { status: 404 });
          if (plate.redirect) {
            return new Response(null, {
              status: 302,
              headers: { Location: plate.redirect, "Cache-Control": "public, max-age=86400" },
            });
          }
          if (!plate.bytes) return new Response("Not found", { status: 404 });
          return new Response(new Uint8Array(plate.bytes), {
            headers: {
              "Content-Type": plate.mime || "image/jpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Disposition": `inline; filename="${plate.downloadName || name}"`,
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});

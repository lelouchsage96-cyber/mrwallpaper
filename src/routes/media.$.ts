import { createFileRoute } from "@tanstack/react-router";
import { loadPublicPlate } from "@/lib/server/queries";
import { mediaBytesResponse, mediaCacheHeaders } from "@/lib/server/media-response";

export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const name = params._splat ?? "";
        if (!name || name.length > 120) return new Response("Not found", { status: 404 });
        try {
          const plate = await loadPublicPlate(name);
          if (!plate) return new Response("Not found", { status: 404 });
          if (plate.redirect) {
            return new Response(null, {
              status: 302,
              headers: { Location: plate.redirect, ...mediaCacheHeaders() },
            });
          }
          if (!plate.bytes) return new Response("Not found", { status: 404 });
          return mediaBytesResponse(request, plate.bytes, {
            ...mediaCacheHeaders(),
            "Content-Type": plate.mime || "image/jpeg",
            "Content-Disposition": `inline; filename="${plate.downloadName || name}"`,
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});

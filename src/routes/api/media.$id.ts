import { createFileRoute } from "@tanstack/react-router";
import { loadMediaFile } from "@/lib/server/storage";

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).pathname.split("/").pop() ?? "";
        if (!id || id.length > 64 || id.includes(".")) {
          return new Response("Not found", { status: 404 });
        }
        try {
          const row = await loadMediaFile(id);
          if (!row) return new Response("Not found", { status: 404 });
          const download = new URL(request.url).searchParams.get("dl");
          const headers: Record<string, string> = {
            "Content-Type": row.mime || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Robots-Tag": "noindex, nofollow",
          };
          if (download) {
            const ext =
              row.mime?.includes("mp4") || row.mime?.includes("quicktime")
                ? "MOV"
                : row.mime?.includes("png")
                  ? "png"
                  : row.mime?.includes("webp")
                    ? "webp"
                    : "jpg";
            headers["Content-Disposition"] = `attachment; filename="${id}.${ext}"`;
            headers["Content-Type"] = "application/octet-stream";
          }
          return new Response(new Uint8Array(row.bytes), { headers });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});

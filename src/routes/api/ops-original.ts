import { createFileRoute } from "@tanstack/react-router";
import { requireUserId } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { storeStudioOriginal, storeStudioPart } from "@/lib/server/storage";
import { MAX_ORIGINAL_BYTES } from "@/lib/upload-limit";

const ALLOWED = /^(image\/jpeg|image\/png|image\/webp|application\/octet-stream)$/i;
const CHUNK = 2 * 1024 * 1024;

export const Route = createFileRoute("/api/ops-original")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let userId: string;
        try {
          const header = request.headers.get("authorization");
          const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7) : undefined;
          userId = await requireUserId(token);
        } catch {
          return Response.json({ error: "auth" }, { status: 401 });
        }

        const sql = await getSql();
        const roles = await sql.query<{ role: string; status: string }>(
          `select role, status from profiles where user_id = $1 limit 1`,
          [userId],
        );
        if (roles[0]?.role !== "admin" || roles[0]?.status !== "active") {
          return Response.json({ error: "forbidden" }, { status: 403 });
        }

        const mimeHeader = (request.headers.get("content-type") || "").split(";")[0].trim();
        const declared = (request.headers.get("x-file-type") || mimeHeader).split(";")[0].trim();
        const mime = ALLOWED.test(declared) && !declared.includes("octet-stream") ? declared : "image/jpeg";
        const name = decodeURIComponent(request.headers.get("x-file-name") || "wallpaper.jpg");
        const ext = (name.split(".").pop() || "jpg").toLowerCase();
        const safeExt = ext === "png" || ext === "webp" ? ext : "jpg";
        const uploadId = request.headers.get("x-upload-id") || "";
        const index = Number(request.headers.get("x-chunk-index") || "0");
        const count = Number(request.headers.get("x-chunk-count") || "1");

        const buf = Buffer.from(await request.arrayBuffer());
        if (buf.length < 1 || buf.length > Math.max(CHUNK + 64_000, MAX_ORIGINAL_BYTES)) {
          return Response.json({ error: "size" }, { status: 413 });
        }

        try {
          if (count > 1 && uploadId) {
            const stored = await storeStudioPart({
              userId,
              uploadId,
              index,
              count,
              mime,
              ext: safeExt,
              bytes: buf,
            });
            return Response.json(stored);
          }
          if (buf.length > MAX_ORIGINAL_BYTES) return Response.json({ error: "size" }, { status: 413 });
          const stored = await storeStudioOriginal({ userId, bytes: buf, mime, ext: safeExt });
          return Response.json(stored);
        } catch (err) {
          console.error("[ops-original]", err);
          return Response.json({ error: "store" }, { status: 500 });
        }
      },
    },
  },
});

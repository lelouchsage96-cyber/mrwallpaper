import { createFileRoute } from "@tanstack/react-router";
import { appIconResponse } from "@/lib/app-icon/runtime";

export const Route = createFileRoute("/icon-v3-512.png")({
  server: {
    handlers: {
      GET: async () => appIconResponse(512),
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { appIconResponse } from "@/lib/app-icon/runtime";

export const Route = createFileRoute("/apple-touch-icon.png")({
  server: {
    handlers: {
      GET: async () => appIconResponse(192),
    },
  },
});

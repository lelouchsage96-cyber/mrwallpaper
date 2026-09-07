import { createFileRoute } from "@tanstack/react-router";
import { appIconResponse } from "@/lib/app-icon/runtime";

export const Route = createFileRoute("/favicon-v3.png")({
  server: {
    handlers: {
      GET: async () => appIconResponse(32),
    },
  },
});

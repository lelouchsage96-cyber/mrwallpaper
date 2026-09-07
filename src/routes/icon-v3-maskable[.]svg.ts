import { createFileRoute } from "@tanstack/react-router";
import { appIconSvgResponse } from "@/lib/app-icon/runtime";

export const Route = createFileRoute("/icon-v3-maskable.svg")({
  server: {
    handlers: {
      GET: async () => appIconSvgResponse(true),
    },
  },
});

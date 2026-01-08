import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

const Route = createFileRoute("/api/workflows/backfill-artwork")({
  server: {
    handlers: {
      GET: async () => {
        const instance = await env.BACKFILL_ARTWORK_WORKFLOW.create();

        return Response.json({
          success: true,
          instanceId: instance.id,
          message: "Backfill artwork workflow started",
        });
      },
    },
  },
});

export { Route };

import { createFileRoute } from "@tanstack/react-router"
import { env } from "cloudflare:workers"
import { drizzle } from "drizzle-orm/d1"
import { isNotNull } from "drizzle-orm"
import * as schema from "@/lib/db/schema"

/**
 * Cron endpoint - called every minute by Cloudflare Cron Trigger
 * Fans out sync jobs to the queue for each active user
 */
const Route = createFileRoute("/api/cron")({
  server: {
    handlers: {
      // This will be called by the scheduled handler in server.ts
      GET: async () => {
        try {
          const db = drizzle(env.DB, { schema })

          // Find all users with valid Apple Music tokens
          const usersWithTokens = await db
            .select({
              userId: schema.appleMusicTokens.userId,
            })
            .from(schema.appleMusicTokens)
            .where(isNotNull(schema.appleMusicTokens.userToken))
            .all()

          console.log(`[cron] Found ${usersWithTokens.length} users with Apple Music connected`)

          // Enqueue sync job for each user
          for (const { userId } of usersWithTokens) {
            await env.SYNC_QUEUE.send({ userId })
          }

          return Response.json({
            success: true,
            usersQueued: usersWithTokens.length,
          })
        } catch (error) {
          console.error("[cron] Error:", error)
          return Response.json({ error: "Cron failed" }, { status: 500 })
        }
      },
    },
  },
})

export { Route }

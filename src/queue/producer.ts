import { db } from "@/lib/db"
import { isNotNull } from "drizzle-orm"
import * as schema from "../lib/db/schema"
import { env } from "cloudflare:workers"

/**
 * Enqueue sync jobs for all users with Apple Music connected
 * Called by the scheduled handler on cron trigger
 */
async function enqueueSyncJobs(): Promise<void> {
  console.log(`[producer] Enqueuing sync jobs at ${new Date().toISOString()}`)

  // Find all users with valid Apple Music tokens
  const usersWithTokens = await db
    .select({
      userId: schema.appleMusicTokens.userId,
    })
    .from(schema.appleMusicTokens)
    .where(isNotNull(schema.appleMusicTokens.userToken))
    .all()

  console.log(`[producer] Found ${usersWithTokens.length} users with Apple Music connected`)

  // Enqueue sync job for each user
  for (const { userId } of usersWithTokens) {
    await env.SYNC_QUEUE.send({ userId })
  }

  console.log(`[producer] Enqueued ${usersWithTokens.length} sync jobs`)
}

export { enqueueSyncJobs }

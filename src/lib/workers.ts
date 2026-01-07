import { drizzle } from "drizzle-orm/d1"
import { isNotNull } from "drizzle-orm"
import * as schema from "./db/schema"
import { syncUserTracks } from "./sync"

// Queue consumer class for processing sync jobs
class SyncQueueConsumer {
  private env: Env

  constructor(env: Env) {
    this.env = env
  }

  async queue(batch: MessageBatch<SyncJobMessage>): Promise<void> {
    for (const message of batch.messages) {
      const { userId } = message.body

      try {
        await syncUserTracks(userId, this.env)
        message.ack()
      } catch (error) {
        console.error(`Sync failed for user ${userId}:`, error)
        message.retry()
      }
    }
  }
}

// Scheduled handler for cron trigger
async function scheduled(event: ScheduledEvent, env: Env): Promise<void> {
  console.log(`[cron] Triggered at ${new Date(event.scheduledTime).toISOString()}`)

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

  console.log(`[cron] Enqueued ${usersWithTokens.length} sync jobs`)
}

export { SyncQueueConsumer, scheduled }


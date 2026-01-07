import { syncUserTracks } from "./sync"

/**
 * Handle sync queue messages
 * Called by the queue handler for each batch of messages
 */
async function consumeSyncJobs(batch: MessageBatch<SyncJobMessage>): Promise<void> {
  for (const message of batch.messages) {
    const { userId } = message.body

    try {
      await syncUserTracks(userId)
      message.ack()
    } catch (error) {
      console.error(`Sync failed for user ${userId}:`, error)
      message.retry()
    }
  }
}

export { consumeSyncJobs }

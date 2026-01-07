import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import { enqueueSyncJobs } from "./queue/producer"
import { consumeSyncJobs } from "./queue/consumer"

export default {
  ...createServerEntry({
    fetch(request) {
      return handler.fetch(request)
    },
  }),

  async scheduled(controller: ScheduledController): Promise<void> {
    switch (controller.cron) {
      case "* * * * *":
        await enqueueSyncJobs()
        break
    }
  },

  async queue(batch: MessageBatch<SyncJobMessage>): Promise<void> {
    await consumeSyncJobs(batch)
  },
}

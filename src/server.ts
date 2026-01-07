import handler, { createServerEntry } from "@tanstack/react-start/server-entry"
import { produceSyncJobs } from "./queue/producer"
import { consumeSyncJobs } from "./queue/consumer"
import { SyncJobMessage } from "./queue/types"

export default {
  ...createServerEntry({
    fetch(request) {
      return handler.fetch(request)
    },
  }),

  async scheduled(controller: ScheduledController): Promise<void> {
    switch (controller.cron) {
      case "* * * * *":
        await produceSyncJobs()
        break
    }
  },

  async queue(batch: MessageBatch<SyncJobMessage>): Promise<void> {
    await consumeSyncJobs(batch)
  },
}

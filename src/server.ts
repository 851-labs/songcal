import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { consumeSyncJobs } from "./queues/sync/consumer";
import { produceSyncJobs } from "./queues/sync/producer";
import { SyncJobMessage } from "./queues/sync/types";
import { BackfillArtworkWorkflow } from "./workflows/backfill-artwork-workflow";

export default {
  ...createServerEntry({
    fetch(request) {
      return handler.fetch(request);
    },
  }),

  async scheduled(controller: ScheduledController): Promise<void> {
    switch (controller.cron) {
      case "* * * * *":
        await produceSyncJobs();
        break;
    }
  },

  async queue(batch: MessageBatch<SyncJobMessage>): Promise<void> {
    switch (batch.queue) {
      case "songcal-sync":
        await consumeSyncJobs(batch);
        break;
    }
  },
};

export { BackfillArtworkWorkflow };

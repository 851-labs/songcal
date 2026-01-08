import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { tracks } from "@/lib/db/schema";

interface AppleMusicTrackData {
  attributes?: {
    artwork?: {
      url?: string;
    };
  };
}

interface BackfillArtworkResult {
  updated: number;
  skipped: number;
  total: number;
}

interface TrackToBackfill {
  id: string;
  name: string;
}

class BackfillArtworkWorkflow extends WorkflowEntrypoint<Env, void> {
  async run(_event: WorkflowEvent<void>, step: WorkflowStep): Promise<BackfillArtworkResult> {
    // Step 1: Get IDs of tracks needing backfill (minimal payload to stay under 1 MiB)
    const tracksToUpdate = await step.do("fetch-track-ids", async () => {
      const result = await db
        .select({
          id: tracks.id,
          name: tracks.name,
        })
        .from(tracks)
        .where(isNull(tracks.artworkUrl))
        .all();

      return result as TrackToBackfill[];
    });

    if (tracksToUpdate.length === 0) {
      return { updated: 0, skipped: 0, total: 0 };
    }

    // Step 2: Process each track individually (granular steps for durability)
    // Each step fetches data and updates - single service call per step
    const results: Array<"updated" | "skipped"> = [];

    for (const track of tracksToUpdate) {
      const result = await step.do(`backfill-${track.id}`, async () => {
        // Fetch the track's data field
        const trackData = await db
          .select({ data: tracks.data, artworkUrl: tracks.artworkUrl })
          .from(tracks)
          .where(eq(tracks.id, track.id))
          .get();

        // Idempotency check: skip if already has artwork
        if (trackData?.artworkUrl) {
          return "skipped" as const;
        }

        if (!trackData?.data) {
          return "skipped" as const;
        }

        try {
          const data: AppleMusicTrackData = JSON.parse(trackData.data);
          const rawArtworkUrl = data.attributes?.artwork?.url;

          if (!rawArtworkUrl) {
            return "skipped" as const;
          }

          // Replace placeholders with 100x100
          const artworkUrl = rawArtworkUrl.replace("{w}", "100").replace("{h}", "100");

          await db.update(tracks).set({ artworkUrl }).where(eq(tracks.id, track.id));

          return "updated" as const;
        } catch {
          return "skipped" as const;
        }
      });

      results.push(result);
    }

    // Aggregate results from step returns (no state outside steps)
    const updated = results.filter((r) => r === "updated").length;
    const skipped = results.filter((r) => r === "skipped").length;

    return { updated, skipped, total: tracksToUpdate.length };
  }
}

export { BackfillArtworkWorkflow };

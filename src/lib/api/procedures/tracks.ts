import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";

import { formatRelativeTime } from "@/utils/date";

import { db } from "../../db";
import { tracks } from "../../db/schema";
import { throwIfUnauthenticatedMiddleware } from "../middleware";

const getRecent = createServerFn({ method: "GET" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id;

    const recentTracks = await db
      .select({
        name: tracks.name,
        artist: tracks.artistName,
        artworkUrl: tracks.artworkUrl,
        syncedAt: tracks.createdAt,
      })
      .from(tracks)
      .where(eq(tracks.userId, userId))
      .orderBy(desc(tracks.createdAt))
      .limit(10)
      .all();

    return recentTracks.map((t) => ({
      name: t.name,
      artist: t.artist,
      artworkUrl: t.artworkUrl,
      syncedAt: formatRelativeTime(t.syncedAt),
    }));
  });

const tracksRouter = {
  getRecent,
};

export { tracksRouter };

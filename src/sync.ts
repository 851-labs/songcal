import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import type { PlayedTrack } from "./apple-music";
import type { GoogleCalendarClient } from "./google-calendar";

/**
 * Sync a batch of tracks to the database and Google Calendar
 */
export async function syncTracks(
  tracks: PlayedTrack[],
  googleCalendar: GoogleCalendarClient
): Promise<{ synced: number; skipped: number }> {
  let synced = 0;
  let skipped = 0;

  for (const track of tracks) {
    // Create a unique ID based on track ID and current timestamp
    // This allows the same track to be recorded multiple times
    const now = new Date();
    const uniqueId = `${track.id}_${now.getTime()}`;

    // Check if this exact play was already recorded (within last 2 minutes to avoid duplicates)
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const existingTracks = await db
      .select()
      .from(schema.tracks)
      .where(eq(schema.tracks.trackId, track.id))
      .limit(10);

    // Check if there's a recent entry for this track
    const recentEntry = existingTracks.find(
      (t) => t.playedAt.getTime() > twoMinutesAgo.getTime()
    );

    if (recentEntry) {
      skipped++;
      continue;
    }

    await db.insert(schema.tracks).values({
      id: uniqueId,
      trackId: track.id,
      name: track.name,
      artistName: track.artistName,
      albumName: track.albumName,
      durationMs: track.durationMs,
      data: track.data,
      playedAt: now,
      syncedToCalendar: false,
    });

    // Sync to Google Calendar
    try {
      await googleCalendar.createEvent(track);
      await db
        .update(schema.tracks)
        .set({ syncedToCalendar: true })
        .where(eq(schema.tracks.id, uniqueId));
      console.log(`  ✓ ${track.name} – ${track.artistName}`);
      synced++;
    } catch (error) {
      console.error(`  ✗ Failed to sync ${track.name}: ${error}`);
    }
  }

  return { synced, skipped };
}

/**
 * Update the last sync timestamp in the database
 */
export async function updateSyncState(
  key: string,
  value: string
): Promise<void> {
  await db
    .insert(schema.syncState)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.syncState.key,
      set: { value, updatedAt: new Date() },
    });
}

/**
 * Get a sync state value from the database
 */
export async function getSyncState(key: string): Promise<string | null> {
  const result = await db
    .select()
    .from(schema.syncState)
    .where(eq(schema.syncState.key, key))
    .limit(1);

  return result[0]?.value ?? null;
}

import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import type { PlayedTrack } from "./apple-music";
import type { GoogleCalendarClient } from "./google-calendar";

const SYNC_STATE_KEYS = {
  lastSeenTrackIds: "lastSeenTrackIds",
  initialized: "initialized",
} as const;

/**
 * Check if this is a cold start (first run after service start)
 */
export async function isInitialized(): Promise<boolean> {
  const value = await getSyncState(SYNC_STATE_KEYS.initialized);
  return value === "true";
}

/**
 * Get the track IDs from the previous sync
 */
async function getLastSeenTrackIds(): Promise<Set<string>> {
  const value = await getSyncState(SYNC_STATE_KEYS.lastSeenTrackIds);
  if (!value) return new Set();
  try {
    const ids = JSON.parse(value) as string[];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

/**
 * Store the current batch of track IDs for the next comparison
 */
async function setLastSeenTrackIds(trackIds: string[]): Promise<void> {
  await updateSyncState(SYNC_STATE_KEYS.lastSeenTrackIds, JSON.stringify(trackIds));
}

/**
 * Handle cold start - store initial tracks without creating calendar events
 * Returns true if this was a cold start
 */
export async function handleColdStart(tracks: PlayedTrack[]): Promise<boolean> {
  const initialized = await isInitialized();
  
  if (initialized) {
    return false; // Not a cold start
  }

  console.log("🧊 Cold start detected - storing baseline tracks (no calendar events)");
  
  // Store the current track IDs as baseline
  const trackIds = tracks.map((t) => t.id);
  await setLastSeenTrackIds(trackIds);
  
  // Mark as initialized
  await updateSyncState(SYNC_STATE_KEYS.initialized, "true");
  
  console.log(`   Baseline: ${trackIds.length} tracks recorded`);
  return true;
}

/**
 * Sync a batch of tracks to the database and Google Calendar
 * Only syncs tracks that are NEW compared to the previous poll
 */
export async function syncTracks(
  tracks: PlayedTrack[],
  googleCalendar: GoogleCalendarClient
): Promise<{ synced: number; skipped: number }> {
  // Get track IDs from previous poll
  const lastSeenIds = await getLastSeenTrackIds();
  const currentTrackIds = tracks.map((t) => t.id);
  
  // Update stored track IDs for next comparison
  await setLastSeenTrackIds(currentTrackIds);
  
  // Find truly new tracks (not in the previous batch)
  const newTracks = tracks.filter((t) => !lastSeenIds.has(t.id));
  
  if (newTracks.length === 0) {
    return { synced: 0, skipped: tracks.length };
  }

  let synced = 0;
  let skipped = 0;
  const now = new Date();

  for (const track of newTracks) {
    const uniqueId = `${track.id}_${now.getTime()}`;

    // Store in database
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
      skipped++;
    }
  }

  return { synced, skipped: tracks.length - newTracks.length + skipped };
}

/**
 * Update a sync state value in the database
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

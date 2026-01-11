import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";

import { generateDeveloperToken, getRecentlyPlayed } from "@/lib/clients/apple-music";
import {
  createCalendarEvent,
  getOrCreateCalendar,
  refreshAccessToken,
} from "@/lib/clients/google-calendar";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { APPLE_MUSIC_COLOR, DEFAULT_CALENDAR_NAME } from "@/utils/constants";

import { SyncJobMessage } from "./types";

/**
 * Sync tracks for a single user
 * Called by the queue consumer for each user
 */
async function syncUserTracks(userId: string): Promise<void> {
  const log = `[🔄 sync:${userId}]`;

  console.log(`${log} Starting sync`);

  // Get user's Apple Music token
  const appleMusicToken = await db
    .select()
    .from(schema.appleMusicTokens)
    .where(eq(schema.appleMusicTokens.userId, userId))
    .get();

  if (!appleMusicToken) {
    console.log(`${log} No Apple Music token`);
    return;
  }

  // Check if token is expired
  if (appleMusicToken.expiresAt < new Date()) {
    console.log(`${log} Apple Music token expired`);
    return;
  }

  // Get user's Google account (for Calendar access)
  // Filter by both userId and providerId to ensure we get the correct OAuth provider
  const googleAccount = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.providerId, "google")))
    .get();

  if (!googleAccount?.refreshToken) {
    console.log(`${log} No Google refresh token`);
    return;
  }

  // Get or create sync state
  let syncState = await db
    .select()
    .from(schema.syncState)
    .where(eq(schema.syncState.userId, userId))
    .get();

  if (!syncState) {
    await db.insert(schema.syncState).values({
      userId,
      initialized: false,
    });
    syncState = await db
      .select()
      .from(schema.syncState)
      .where(eq(schema.syncState.userId, userId))
      .get();
  }

  try {
    // Generate developer token
    const developerToken = await generateDeveloperToken(
      env.APPLE_TEAM_ID,
      env.APPLE_KEY_ID,
      env.APPLE_PRIVATE_KEY,
    );

    // Fetch recently played tracks
    const tracks = await getRecentlyPlayed(developerToken, appleMusicToken.userToken);
    console.log(`${log} Found ${tracks.length} recent tracks`);

    if (tracks.length === 0) {
      return;
    }

    // Handle cold start - first run just records baseline
    if (!syncState?.initialized) {
      console.log(`${log} Cold start - storing baseline`);
      const trackIds = tracks.map((t) => t.id);
      await db
        .update(schema.syncState)
        .set({
          lastSeenTrackIds: JSON.stringify(trackIds),
          initialized: true,
          lastSyncAt: new Date(),
        })
        .where(eq(schema.syncState.userId, userId));
      return;
    }

    // Parse last seen track IDs
    const lastSeenIds = new Set<string>(
      syncState?.lastSeenTrackIds ? JSON.parse(syncState.lastSeenTrackIds) : [],
    );

    // Find new tracks
    const newTracks = tracks.filter((t) => !lastSeenIds.has(t.id));

    if (newTracks.length === 0) {
      console.log(`${log} No new tracks`);
      // Update last seen IDs anyway
      await db
        .update(schema.syncState)
        .set({
          lastSeenTrackIds: JSON.stringify(tracks.map((t) => t.id)),
          lastSyncAt: new Date(),
        })
        .where(eq(schema.syncState.userId, userId));
      return;
    }

    console.log(`${log} Syncing ${newTracks.length} new tracks`);

    // Refresh Google access token
    const { accessToken } = await refreshAccessToken(
      googleAccount.refreshToken,
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    );

    // Use selected calendar or fall back to default "Apple Music" calendar
    const calendarId =
      syncState?.calendarId ??
      (await getOrCreateCalendar(accessToken, DEFAULT_CALENDAR_NAME, APPLE_MUSIC_COLOR));

    // Sync each new track
    const now = new Date();
    for (const track of newTracks) {
      try {
        // Create calendar event
        const eventId = await createCalendarEvent(accessToken, calendarId, track, now);

        // Store track in database
        await db.insert(schema.tracks).values({
          userId,
          trackId: track.id,
          name: track.name,
          artistName: track.artistName,
          albumName: track.albumName,
          artworkUrl: track.artworkUrl,
          durationMs: track.durationMs,
          data: JSON.stringify(track.data),
          playedAt: now,
          syncedToCalendar: true,
          calendarEventId: eventId,
        });

        console.log(`${log} ✓ ${track.name} – ${track.artistName}`);
      } catch (error) {
        console.error(`${log} ✗ Failed to sync ${track.name}:`, error);
      }
    }

    // Update sync state
    await db
      .update(schema.syncState)
      .set({
        lastSeenTrackIds: JSON.stringify(tracks.map((t) => t.id)),
        lastSyncAt: new Date(),
      })
      .where(eq(schema.syncState.userId, userId));

    console.log(`${log} Completed sync`);
  } catch (error) {
    console.error(`${log} Error:`, error);
    throw error;
  }
}

/**
 * Handle sync queue messages
 * Called by the queue handler for each batch of messages
 */
async function consumeSyncJobs(batch: MessageBatch<SyncJobMessage>): Promise<void> {
  console.log(`[📥 consumer] Processing batch of ${batch.messages.length} messages`);

  for (const message of batch.messages) {
    const { userId } = message.body;
    console.log(`[📥 consumer] Processing sync job for user ${userId}`);

    try {
      await syncUserTracks(userId);
      console.log(`[📥 consumer] Completed sync for user ${userId}`);
      message.ack();
    } catch (error) {
      console.error(`[📥 consumer] Sync failed for user ${userId}:`, error);
      message.retry();
    }
  }

  console.log(`[📥 consumer] Batch complete`);
}

export { consumeSyncJobs };

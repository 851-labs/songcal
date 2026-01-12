import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import ms from "ms";

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

/** Staleness threshold - skip sync if last sync was longer than this ago */
const STALE_THRESHOLD_MS = ms("5m");

/**
 * Sync tracks for a single user
 * Called by the queue consumer for each user
 */
async function syncUserTracks(userId: string): Promise<void> {
  // Get user info for better logging
  const user = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();

  const userLabel = user?.email ?? userId;
  const log = `[🔄 sync:${userLabel}]`;

  console.log(`${log} ========== STARTING SYNC ==========`);
  console.log(`${log} User ID: ${userId}`);

  // Get user's Apple Music token
  const appleMusicToken = await db
    .select()
    .from(schema.appleMusicTokens)
    .where(eq(schema.appleMusicTokens.userId, userId))
    .get();

  if (!appleMusicToken) {
    console.log(`${log} ❌ EXIT: No Apple Music token found`);
    return;
  }

  console.log(`${log} ✓ Apple Music token found`);
  console.log(`${log}   Token ID: ${appleMusicToken.id}`);
  console.log(`${log}   Expires at: ${appleMusicToken.expiresAt.toISOString()}`);
  console.log(`${log}   Token length: ${appleMusicToken.userToken.length} chars`);

  // Check if token is expired
  const now = new Date();
  const isExpired = appleMusicToken.expiresAt < now;
  console.log(`${log}   Current time: ${now.toISOString()}`);
  console.log(`${log}   Is expired: ${isExpired}`);

  if (isExpired) {
    console.log(`${log} ❌ EXIT: Apple Music token expired`);
    return;
  }

  // Get user's Google account (for Calendar access)
  const googleAccount = await db
    .select()
    .from(schema.accounts)
    .where(and(eq(schema.accounts.userId, userId), eq(schema.accounts.providerId, "google")))
    .get();

  if (!googleAccount) {
    console.log(`${log} ❌ EXIT: No Google account found`);
    return;
  }

  console.log(`${log} ✓ Google account found`);
  console.log(`${log}   Account ID: ${googleAccount.id}`);
  console.log(`${log}   Has refresh token: ${!!googleAccount.refreshToken}`);
  console.log(`${log}   Refresh token preview: ${googleAccount.refreshToken?.slice(0, 10)}...`);

  if (!googleAccount.refreshToken) {
    console.log(`${log} ❌ EXIT: No Google refresh token`);
    return;
  }

  // Get or create sync state
  let syncState = await db
    .select()
    .from(schema.syncState)
    .where(eq(schema.syncState.userId, userId))
    .get();

  console.log(`${log} Sync state exists: ${!!syncState}`);

  if (!syncState) {
    console.log(`${log} Creating new sync state...`);
    await db.insert(schema.syncState).values({ userId });
    syncState = await db
      .select()
      .from(schema.syncState)
      .where(eq(schema.syncState.userId, userId))
      .get();
    console.log(`${log} ✓ New sync state created`);
  }

  console.log(`${log} Sync state details:`);
  console.log(`${log}   ID: ${syncState?.id}`);
  console.log(`${log}   Last sync at: ${syncState?.lastSyncAt?.toISOString() ?? "never"}`);
  console.log(`${log}   Calendar ID: ${syncState?.calendarId ?? "default"}`);

  const lastSeenTrackIds = syncState?.lastSeenTrackIds
    ? JSON.parse(syncState.lastSeenTrackIds)
    : [];
  console.log(`${log}   Last seen track IDs count: ${lastSeenTrackIds.length}`);

  try {
    // Generate developer token
    console.log(`${log} Generating Apple developer token...`);
    const developerToken = await generateDeveloperToken(
      env.APPLE_TEAM_ID,
      env.APPLE_KEY_ID,
      env.APPLE_PRIVATE_KEY,
    );
    console.log(`${log} ✓ Developer token generated (${developerToken.length} chars)`);

    // Fetch recently played tracks
    console.log(`${log} Fetching recently played tracks from Apple Music API...`);
    const tracks = await getRecentlyPlayed(developerToken, appleMusicToken.userToken);
    console.log(`${log} ✓ Apple Music API response: ${tracks.length} tracks`);

    if (tracks.length > 0) {
      console.log(`${log} Recent tracks:`);
      tracks.forEach((t, i) => {
        console.log(`${log}   ${i + 1}. [${t.id}] ${t.name} – ${t.artistName}`);
      });
    }

    if (tracks.length === 0) {
      console.log(`${log} ❌ EXIT: No recent tracks from Apple Music API`);
      return;
    }

    const trackIds = tracks.map((t) => t.id);

    // === COLD START: First sync ever (lastSyncAt is NULL) ===
    if (!syncState?.lastSyncAt) {
      console.log(`${log} 🆕 COLD START: First sync for this user`);
      console.log(`${log}   Storing ${tracks.length} tracks as baseline`);
      console.log(`${log}   Track IDs: ${JSON.stringify(trackIds)}`);

      await db
        .update(schema.syncState)
        .set({
          lastSeenTrackIds: JSON.stringify(trackIds),
          lastSyncAt: now,
        })
        .where(eq(schema.syncState.userId, userId));

      console.log(`${log} ✓ Baseline stored`);
      console.log(`${log} ❌ EXIT: Cold start complete (no tracks synced on first run)`);
      return;
    }

    // === STALENESS CHECK: Skip if last sync was too long ago ===
    const timeSinceLastSync = now.getTime() - syncState.lastSyncAt.getTime();
    const isStale = timeSinceLastSync > STALE_THRESHOLD_MS;

    console.log(
      `${log} Time since last sync: ${ms(timeSinceLastSync)} (threshold: ${ms(STALE_THRESHOLD_MS)})`,
    );

    if (isStale) {
      console.log(`${log} ⚠️ STALE DATA: Skipping sync, resetting baseline`);
      console.log(`${log}   Track IDs: ${JSON.stringify(trackIds)}`);

      await db
        .update(schema.syncState)
        .set({
          lastSeenTrackIds: JSON.stringify(trackIds),
          lastSyncAt: now,
        })
        .where(eq(schema.syncState.userId, userId));

      console.log(`${log} ✓ Baseline reset`);
      console.log(`${log} ❌ EXIT: Data stale, skipped sync`);
      return;
    }

    // === NORMAL SYNC: Fresh data, find new tracks ===
    const lastSeenIds = new Set<string>(
      syncState.lastSeenTrackIds ? JSON.parse(syncState.lastSeenTrackIds) : [],
    );
    console.log(`${log} Previously seen track IDs: ${lastSeenIds.size}`);

    const newTracks = tracks.filter((t) => !lastSeenIds.has(t.id));
    console.log(`${log} New tracks found: ${newTracks.length}`);

    if (newTracks.length > 0) {
      console.log(`${log} New tracks to sync:`);
      newTracks.forEach((t, i) => {
        console.log(`${log}   ${i + 1}. [${t.id}] ${t.name} – ${t.artistName}`);
      });
    }

    if (newTracks.length === 0) {
      console.log(`${log} No new tracks to sync`);
      await db
        .update(schema.syncState)
        .set({
          lastSeenTrackIds: JSON.stringify(trackIds),
          lastSyncAt: now,
        })
        .where(eq(schema.syncState.userId, userId));
      console.log(`${log} ✓ Updated lastSeenTrackIds and lastSyncAt`);
      console.log(`${log} ❌ EXIT: No new tracks`);
      return;
    }

    console.log(`${log} 📅 Syncing ${newTracks.length} new tracks to Google Calendar`);

    // Refresh Google access token
    console.log(`${log} Refreshing Google access token...`);
    const { accessToken } = await refreshAccessToken(
      googleAccount.refreshToken,
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    );
    console.log(`${log} ✓ Google access token refreshed`);

    // Get or create calendar
    console.log(`${log} Getting/creating calendar...`);
    const calendarId =
      syncState.calendarId ??
      (await getOrCreateCalendar(accessToken, DEFAULT_CALENDAR_NAME, APPLE_MUSIC_COLOR));
    console.log(`${log} ✓ Using calendar: ${calendarId}`);

    // Sync each new track
    const syncTime = new Date();
    let successCount = 0;
    let failCount = 0;

    for (const track of newTracks) {
      try {
        console.log(`${log} Creating calendar event for: ${track.name} – ${track.artistName}`);

        // Create calendar event
        const eventId = await createCalendarEvent(accessToken, calendarId, track, syncTime);
        console.log(`${log}   ✓ Calendar event created: ${eventId}`);

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
          playedAt: syncTime,
          syncedToCalendar: true,
          calendarEventId: eventId,
        });
        console.log(`${log}   ✓ Track stored in database`);

        successCount++;
        console.log(`${log} ✓ Synced: ${track.name} – ${track.artistName}`);
      } catch (error) {
        failCount++;
        console.error(`${log} ✗ Failed to sync ${track.name}:`, error);
      }
    }

    // Update sync state
    await db
      .update(schema.syncState)
      .set({
        lastSeenTrackIds: JSON.stringify(trackIds),
        lastSyncAt: new Date(),
      })
      .where(eq(schema.syncState.userId, userId));

    console.log(`${log} ========== SYNC COMPLETE ==========`);
    console.log(`${log} Results: ${successCount} synced, ${failCount} failed`);
  } catch (error) {
    console.error(`${log} ========== SYNC ERROR ==========`);
    console.error(`${log} Error:`, error);
    throw error;
  }
}

/**
 * Handle sync queue messages
 * Called by the queue handler for each batch of messages
 */
async function consumeSyncJobs(batch: MessageBatch<SyncJobMessage>): Promise<void> {
  console.log(`[📥 consumer] ========================================`);
  console.log(`[📥 consumer] Processing batch of ${batch.messages.length} messages`);
  console.log(`[📥 consumer] ========================================`);

  for (const message of batch.messages) {
    const { userId } = message.body;
    console.log(`[📥 consumer] Processing sync job for user ${userId}`);

    try {
      await syncUserTracks(userId);
      console.log(`[📥 consumer] ✓ Completed sync for user ${userId}`);
      message.ack();
    } catch (error) {
      console.error(`[📥 consumer] ✗ Sync failed for user ${userId}:`, error);
      message.retry();
    }
  }

  console.log(`[📥 consumer] ========================================`);
  console.log(`[📥 consumer] Batch complete`);
  console.log(`[📥 consumer] ========================================`);
}

export { consumeSyncJobs };

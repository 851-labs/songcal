import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { generateDeveloperToken, getRecentlyPlayed } from "../lib/clients/apple-music"
import { createCalendarEvent, getOrCreateCalendar, refreshAccessToken } from "../lib/clients/google-calendar"
import * as schema from "../lib/db/schema"

const CALENDAR_NAME = "Apple Music"

/**
 * Sync tracks for a single user
 * Called by the queue consumer for each user
 */
async function syncUserTracks(userId: string): Promise<void> {
  console.log(`[sync] Starting sync for user ${userId}`)

  // Get user's Apple Music token
  const appleMusicToken = await db
    .select()
    .from(schema.appleMusicTokens)
    .where(eq(schema.appleMusicTokens.userId, userId))
    .get()

  if (!appleMusicToken) {
    console.log(`[sync] No Apple Music token for user ${userId}`)
    return
  }

  // Check if token is expired
  if (appleMusicToken.expiresAt < new Date()) {
    console.log(`[sync] Apple Music token expired for user ${userId}`)
    return
  }

  // Get user's Google account (for Calendar access)
  const googleAccount = await db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId)).get()

  if (!googleAccount?.refreshToken) {
    console.log(`[sync] No Google refresh token for user ${userId}`)
    return
  }

  // Get or create sync state
  let syncState = await db.select().from(schema.syncState).where(eq(schema.syncState.userId, userId)).get()

  if (!syncState) {
    await db.insert(schema.syncState).values({
      userId,
      initialized: false,
    })
    syncState = await db.select().from(schema.syncState).where(eq(schema.syncState.userId, userId)).get()
  }

  try {
    // Generate developer token
    const developerToken = await generateDeveloperToken(env.APPLE_TEAM_ID, env.APPLE_KEY_ID, env.APPLE_PRIVATE_KEY)

    // Fetch recently played tracks
    const tracks = await getRecentlyPlayed(developerToken, appleMusicToken.userToken)
    console.log(`[sync] Found ${tracks.length} recent tracks for user ${userId}`)

    if (tracks.length === 0) {
      return
    }

    // Handle cold start - first run just records baseline
    if (!syncState?.initialized) {
      console.log(`[sync] Cold start for user ${userId} - storing baseline`)
      const trackIds = tracks.map((t) => t.id)
      await db
        .update(schema.syncState)
        .set({
          lastSeenTrackIds: JSON.stringify(trackIds),
          initialized: true,
          lastSyncAt: new Date(),
        })
        .where(eq(schema.syncState.userId, userId))
      return
    }

    // Parse last seen track IDs
    const lastSeenIds = new Set<string>(syncState?.lastSeenTrackIds ? JSON.parse(syncState.lastSeenTrackIds) : [])

    // Find new tracks
    const newTracks = tracks.filter((t) => !lastSeenIds.has(t.id))

    if (newTracks.length === 0) {
      console.log(`[sync] No new tracks for user ${userId}`)
      // Update last seen IDs anyway
      await db
        .update(schema.syncState)
        .set({
          lastSeenTrackIds: JSON.stringify(tracks.map((t) => t.id)),
          lastSyncAt: new Date(),
        })
        .where(eq(schema.syncState.userId, userId))
      return
    }

    console.log(`[sync] Syncing ${newTracks.length} new tracks for user ${userId}`)

    // Refresh Google access token
    const { accessToken } = await refreshAccessToken(
      googleAccount.refreshToken,
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET
    )

    // Get or create calendar
    const calendarId = await getOrCreateCalendar(accessToken, CALENDAR_NAME)

    // Sync each new track
    const now = new Date()
    for (const track of newTracks) {
      try {
        // Create calendar event
        const eventId = await createCalendarEvent(accessToken, calendarId, track, now)

        // Store track in database
        await db.insert(schema.tracks).values({
          userId,
          trackId: track.id,
          name: track.name,
          artistName: track.artistName,
          albumName: track.albumName,
          durationMs: track.durationMs,
          data: JSON.stringify(track.data),
          playedAt: now,
          syncedToCalendar: true,
          calendarEventId: eventId,
        })

        console.log(`[sync] ✓ ${track.name} – ${track.artistName}`)
      } catch (error) {
        console.error(`[sync] ✗ Failed to sync ${track.name}:`, error)
      }
    }

    // Update sync state
    await db
      .update(schema.syncState)
      .set({
        lastSeenTrackIds: JSON.stringify(tracks.map((t) => t.id)),
        lastSyncAt: new Date(),
      })
      .where(eq(schema.syncState.userId, userId))

    console.log(`[sync] Completed sync for user ${userId}`)
  } catch (error) {
    console.error(`[sync] Error syncing user ${userId}:`, error)
    throw error
  }
}

export { syncUserTracks }

import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * Tracks table - stores Apple Music listening history
 */
export const tracks = pgTable("tracks", {
  // Apple Music track ID + playedAt as composite key to allow same track played multiple times
  id: text("id").primaryKey(), // Format: `${trackId}_${playedAt.getTime()}`
  trackId: text("track_id").notNull(), // Original Apple Music track ID
  name: text("name").notNull(),
  artistName: text("artist_name").notNull(),
  albumName: text("album_name").notNull(),
  durationMs: integer("duration_ms").notNull(),
  data: jsonb("data"), // Original Apple Music API response
  playedAt: timestamp("played_at", { withTimezone: true }).notNull(),
  syncedToCalendar: boolean("synced_to_calendar").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Sync state table - stores key-value pairs for sync state
 */
export const syncState = pgTable("sync_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

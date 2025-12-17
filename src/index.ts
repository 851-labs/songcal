import { loadConfig } from "./config";
import { AppleMusicClient } from "./apple-music";
import { GoogleCalendarClient } from "./google-calendar";
import { syncTracks, updateSyncState } from "./sync";

let isRunning = true;

async function runSync(
  appleMusic: AppleMusicClient,
  googleCalendar: GoogleCalendarClient
): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Starting sync...`);

  try {
    // Fetch recently played tracks from Apple Music
    const tracks = await appleMusic.getRecentlyPlayed();
    console.log(`Found ${tracks.length} recent tracks`);

    if (tracks.length === 0) {
      console.log("No tracks to sync");
      return;
    }

    // Sync tracks to database and Google Calendar
    const { synced, skipped } = await syncTracks(tracks, googleCalendar);
    console.log(`Synced ${synced} new tracks, skipped ${skipped} duplicates`);

    // Update last sync timestamp
    await updateSyncState("lastSyncAt", new Date().toISOString());
  } catch (error) {
    console.error("Sync error:", error instanceof Error ? error.message : error);
  }
}

async function main() {
  console.log("🎵 songcal - Apple Music → Google Calendar sync\n");

  // Load configuration
  const config = loadConfig();
  console.log("✓ Database connected\n");

  // Initialize clients
  const appleMusic = new AppleMusicClient(config);
  const googleCalendar = new GoogleCalendarClient(config);

  // Authenticate with Google Calendar
  await googleCalendar.authenticate();

  // Handle graceful shutdown
  const shutdown = () => {
    console.log("\n\nShutting down...");
    isRunning = false;
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Run initial sync
  await runSync(appleMusic, googleCalendar);

  // Start interval-based sync
  const intervalMs = config.sync.intervalMs;
  console.log(`\n⏱️  Running sync every ${intervalMs / 1000} seconds`);
  console.log("Press Ctrl+C to stop\n");

  while (isRunning) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    if (isRunning) {
      await runSync(appleMusic, googleCalendar);
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});

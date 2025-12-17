import { loadConfig } from "./config";
import { AppleMusicClient } from "./apple-music";
import { GoogleCalendarClient } from "./google-calendar";

async function main() {
  console.log("🎵 songcal - Apple Music → Google Calendar sync\n");

  // Load configuration
  const config = loadConfig();

  // Initialize clients
  const appleMusic = new AppleMusicClient(config);
  const googleCalendar = new GoogleCalendarClient(config);

  // Authenticate with Google Calendar
  await googleCalendar.authenticate();

  // Fetch recently played tracks from Apple Music
  console.log("Fetching recently played tracks...");
  const tracks = await appleMusic.getRecentlyPlayed();
  console.log(`Found ${tracks.length} recent tracks\n`);

  // Sync each track to Google Calendar
  let synced = 0;
  let skipped = 0;

  for (const track of tracks) {
    const exists = await googleCalendar.trackExists(track);

    if (exists) {
      skipped++;
      continue;
    }

    await googleCalendar.createEvent(track);
    console.log(`  ✓ ${track.name} – ${track.artistName}`);
    synced++;
  }

  console.log(`\nDone! Synced ${synced} new tracks, skipped ${skipped} duplicates.`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});


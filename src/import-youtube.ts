import { eq } from "drizzle-orm";
import { loadConfig } from "./config";
import { parseWatchHistory } from "./clients/youtube";
import { GoogleCalendarClient } from "./clients/google-calendar";
import { db, schema } from "./db";

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: bun run import:youtube <path-to-watch-history.html>");
    process.exit(1);
  }

  console.log("📺 YouTube Watch History Import\n");

  // Load config and authenticate
  const config = loadConfig();
  const googleCalendar = new GoogleCalendarClient(config);
  await googleCalendar.authenticate();

  // Parse the HTML file
  console.log(`Parsing ${filePath}...`);
  const watches = parseWatchHistory(filePath);
  console.log(`Found ${watches.length} watch entries\n`);

  if (watches.length === 0) {
    console.log("No watches found to import.");
    return;
  }

  // Import watches
  let imported = 0;
  let skipped = 0;

  for (const watch of watches) {
    const uniqueId = `${watch.videoId}_${watch.watchedAt.getTime()}`;

    // Check if already imported
    const existing = await db
      .select()
      .from(schema.youtubeWatches)
      .where(eq(schema.youtubeWatches.id, uniqueId))
      .limit(1);

    if (existing.length > 0) {
      skipped++;
      continue;
    }

    // Insert into database
    await db.insert(schema.youtubeWatches).values({
      id: uniqueId,
      videoId: watch.videoId,
      title: watch.title,
      channel: watch.channel,
      watchedAt: watch.watchedAt,
      syncedToCalendar: false,
    });

    // Create calendar event
    try {
      await googleCalendar.createYouTubeEvent(watch);
      await db
        .update(schema.youtubeWatches)
        .set({ syncedToCalendar: true })
        .where(eq(schema.youtubeWatches.id, uniqueId));
      console.log(`  ✓ ${watch.title}`);
      imported++;
    } catch (error) {
      console.error(`  ✗ Failed: ${watch.title} - ${error}`);
    }
  }

  console.log(`\nDone! Imported ${imported} watches, skipped ${skipped} duplicates.`);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});


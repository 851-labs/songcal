import { readFileSync } from "fs";

interface YouTubeWatch {
  videoId: string;
  title: string;
  channel: string;
  watchedAt: Date;
  url: string;
}

/**
 * Parse YouTube watch history from Google Takeout HTML export
 */
function parseWatchHistory(filePath: string): YouTubeWatch[] {
  const html = readFileSync(filePath, "utf-8");
  const watches: YouTubeWatch[] = [];

  // Debug: check if key patterns exist
  const watchedCount = (html.match(/Watched/g) || []).length;
  console.log(`  Debug: Found ${watchedCount} "Watched" occurrences`);

  // Pattern to match each watch entry:
  // Watched <a href="https://www.youtube.com/watch?v=VIDEO_ID">Title</a><br>
  // <a href="https://www.youtube.com/channel/...">Channel</a><br>
  // Dec 17, 2025, 2:48:15 PM PST<br>
  // Note: Google Takeout uses non-breaking spaces (\xa0) instead of regular spaces
  const watchPattern =
    /Watched[\s\u00A0]<a href="https:\/\/www\.youtube\.com\/watch\?v=([^"]+)">([^<]+)<\/a><br><a href="https:\/\/www\.youtube\.com\/channel\/[^"]+">([^<]+)<\/a><br>([A-Z][a-z]+[\s\u00A0]\d{1,2},[\s\u00A0]\d{4},[\s\u00A0]\d{1,2}:\d{2}:\d{2}[\s\u00A0][AP]M[\s\u00A0][A-Z]+)/g;

  let match;
  while ((match = watchPattern.exec(html)) !== null) {
    const videoId = match[1];
    const title = match[2];
    const channel = match[3];
    const timestamp = match[4];

    // Skip if any required field is missing
    if (!videoId || !title || !channel || !timestamp) {
      continue;
    }

    // Parse timestamp like "Dec 17, 2025, 2:48:15 PM PST"
    const watchedAt = parseTimestamp(timestamp);

    if (watchedAt) {
      watches.push({
        videoId,
        title: decodeHtmlEntities(title),
        channel: decodeHtmlEntities(channel),
        watchedAt,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }
  }

  return watches;
}

/**
 * Parse timestamp like "Dec 17, 2025, 2:48:15 PM PST"
 */
function parseTimestamp(timestamp: string): Date | null {
  try {
    // Remove timezone abbreviation and parse
    const cleanTimestamp = timestamp.replace(/\s+[A-Z]{2,4}$/, "");
    const date = new Date(cleanTimestamp);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch {
    return null;
  }
}

/**
 * Decode HTML entities like &#39; -> '
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export { parseWatchHistory };
export type { YouTubeWatch };


import { google } from "googleapis";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { createServer } from "http";
import type { Config } from "./config";
import type { PlayedTrack } from "./apple-music";

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

class GoogleCalendarClient {
  private config: Config;
  private oauth2Client: ReturnType<typeof google.auth.OAuth2>;
  private calendar: ReturnType<typeof google.calendar>;
  private calendarId: string | null = null;

  constructor(config: Config) {
    this.config = config;
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      "http://localhost:8585/callback"
    );
    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  /**
   * Ensure we have valid OAuth tokens
   */
  async authenticate(): Promise<void> {
    const tokenPath = this.config.paths.googleToken;

    // Try to load existing tokens
    if (existsSync(tokenPath)) {
      const tokens: StoredTokens = JSON.parse(readFileSync(tokenPath, "utf-8"));
      this.oauth2Client.setCredentials(tokens);

      // Check if token needs refresh
      if (tokens.expiry_date && tokens.expiry_date < Date.now() + 60000) {
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.saveTokens(credentials as StoredTokens);
        } catch {
          // Refresh failed, need to re-auth
          await this.runOAuthFlow();
        }
      }
      return;
    }

    // No tokens, run OAuth flow
    await this.runOAuthFlow();
  }

  private saveTokens(tokens: StoredTokens): void {
    const tokenPath = this.config.paths.googleToken;
    mkdirSync(dirname(tokenPath), { recursive: true });
    writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
  }

  private async runOAuthFlow(): Promise<void> {
    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar"],
      prompt: "consent",
    });

    console.log("\n📅 Google Calendar Authorization Required");
    console.log("━".repeat(50));
    console.log("\n1. Open this URL in your browser:\n");
    console.log(`   ${authUrl}\n`);
    console.log("2. Sign in and authorize songcal");
    console.log("3. You'll be redirected to localhost - that's expected!\n");

    const code = await this.waitForCallback();
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    this.saveTokens(tokens as StoredTokens);
    console.log("✓ Google Calendar authorized!\n");
  }

  private waitForCallback(): Promise<string> {
    return new Promise((resolve, reject) => {
      const server = createServer((req, res) => {
        const url = new URL(req.url!, `http://localhost:8585`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<h1>Authorization failed</h1><p>You can close this window.</p>");
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<h1>✓ Authorization successful!</h1><p>You can close this window and return to the terminal.</p>");
          server.close();
          resolve(code);
        }
      });

      server.listen(8585, () => {
        console.log("Waiting for authorization...");
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(new Error("Authorization timed out"));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Get or create the Music History calendar
   */
  async getOrCreateCalendar(): Promise<string> {
    if (this.calendarId) return this.calendarId;

    const calendarName = this.config.google.calendarName;

    // List calendars to find existing one
    const { data } = await this.calendar.calendarList.list();
    const existing = data.items?.find((cal) => cal.summary === calendarName);

    if (existing) {
      this.calendarId = existing.id!;
      return this.calendarId;
    }

    // Create new calendar
    const { data: newCal } = await this.calendar.calendars.insert({
      requestBody: {
        summary: calendarName,
        description: "Automatically synced from Apple Music by songcal",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });

    this.calendarId = newCal.id!;
    console.log(`✓ Created calendar: ${calendarName}`);
    return this.calendarId;
  }

  /**
   * Check if a track was already synced recently
   */
  async trackExists(track: PlayedTrack): Promise<boolean> {
    const calendarId = await this.getOrCreateCalendar();

    // Search for events in the last 24 hours with matching track ID
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data } = await this.calendar.events.list({
      calendarId,
      timeMin: yesterday.toISOString(),
      timeMax: now.toISOString(),
      privateExtendedProperty: `trackId=${track.id}`,
      maxResults: 1,
    });

    return (data.items?.length ?? 0) > 0;
  }

  /**
   * Create a calendar event for a played track
   */
  async createEvent(track: PlayedTrack): Promise<void> {
    const calendarId = await this.getOrCreateCalendar();

    const now = new Date();
    const durationMs = track.durationMs || 3 * 60 * 1000; // Default 3 min
    const endTime = new Date(now.getTime() + durationMs);

    await this.calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `${track.name} – ${track.artistName}`,
        description: `Album: ${track.albumName}\nDuration: ${this.formatDuration(durationMs)}`,
        start: {
          dateTime: now.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        extendedProperties: {
          private: {
            trackId: track.id,
            source: "songcal",
          },
        },
      },
    });
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }
}

export { GoogleCalendarClient };

import type { PlayedTrack } from "./apple-music";

const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

interface CalendarListEntry {
  id: string;
  summary: string;
  accessRole?: string;
  primary?: boolean;
}

interface CalendarListResponse {
  items?: CalendarListEntry[];
}

interface CalendarInfo {
  id: string;
  name: string;
  primary: boolean;
}

interface CreateEventResponse {
  id: string;
}

/**
 * Refresh an access token using a refresh token
 */
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<{ accessToken: string; expiresAt: Date }> {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to refresh token: ${response.status} - ${text}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  return {
    accessToken: data.access_token,
    expiresAt,
  };
}

/**
 * Get or create a calendar with the given name
 */
async function getOrCreateCalendar(accessToken: string, calendarName: string): Promise<string> {
  // List calendars to find existing one
  const listResponse = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!listResponse.ok) {
    throw new Error(`Failed to list calendars: ${listResponse.status}`);
  }

  const { items }: CalendarListResponse = await listResponse.json();
  const existing = items?.find((cal) => cal.summary === calendarName);

  if (existing) {
    return existing.id;
  }

  // Create new calendar
  const createResponse = await fetch(`${GOOGLE_CALENDAR_API}/calendars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: calendarName,
      description: "Automatically synced from Apple Music by songcal",
      timeZone: "UTC",
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create calendar: ${createResponse.status}`);
  }

  const newCalendar: { id: string } = await createResponse.json();
  return newCalendar.id;
}

/**
 * Create a calendar event for a played track
 */
async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  track: PlayedTrack,
  playedAt: Date,
): Promise<string> {
  const endTime = new Date(playedAt.getTime() + track.durationMs);

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `${track.name} – ${track.artistName}`,
        description: [
          `Album: ${track.albumName}`,
          `Duration: ${formatDuration(track.durationMs)}`,
          ``,
          `https://music.apple.com/song/${track.id}`,
        ].join("\n"),
        start: {
          dateTime: playedAt.toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "UTC",
        },
        transparency: "transparent",
        extendedProperties: {
          private: {
            trackId: track.id,
            source: "songcal",
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create event: ${response.status} - ${text}`);
  }

  const event: CreateEventResponse = await response.json();
  return event.id;
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * List all calendars the user has write access to
 */
async function listCalendars(accessToken: string): Promise<CalendarInfo[]> {
  const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list calendars: ${response.status}`);
  }

  const { items }: CalendarListResponse = await response.json();

  // Filter to calendars the user can write to (owner or writer)
  const writableRoles = ["owner", "writer"];
  const writableCalendars =
    items?.filter((cal) => cal.accessRole && writableRoles.includes(cal.accessRole)) ?? [];

  return writableCalendars.map((cal) => ({
    id: cal.id,
    name: cal.summary,
    primary: cal.primary ?? false,
  }));
}

export { refreshAccessToken, getOrCreateCalendar, createCalendarEvent, listCalendars };

export type { CalendarInfo };

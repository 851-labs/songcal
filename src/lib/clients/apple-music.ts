import { SignJWT, importPKCS8 } from "jose";

const APPLE_MUSIC_API_URL = "https://api.music.apple.com";

interface RecentlyPlayedResponse {
  data: Array<{
    id: string;
    type: string;
    href: string;
    attributes: {
      name: string;
      artistName?: string;
      albumName?: string;
      durationInMillis?: number;
      artwork?: {
        url: string;
      };
    };
  }>;
}

interface PlayedTrack {
  id: string;
  type: string;
  name: string;
  artistName: string;
  albumName: string;
  artworkUrl: string | null;
  durationMs: number;
  data: Record<string, unknown>;
}

/**
 * Generate a developer JWT token for MusicKit API
 */
async function generateDeveloperToken(
  teamId: string,
  keyId: string,
  privateKey: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const key = await importPKCS8(privateKey, "ES256");

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(expiry)
    .sign(key);

  return token;
}

/**
 * Fetch recently played tracks from Apple Music
 */
async function getRecentlyPlayed(
  developerToken: string,
  userToken: string,
): Promise<PlayedTrack[]> {
  const response = await fetch(`${APPLE_MUSIC_API_URL}/v1/me/recent/played/tracks?limit=10`, {
    headers: {
      Authorization: `Bearer ${developerToken}`,
      "Music-User-Token": userToken,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apple Music API error: ${response.status} - ${text}`);
  }

  const data: RecentlyPlayedResponse = await response.json();

  return data.data.map((item) => {
    // Apple Music artwork URLs have {w} and {h} placeholders
    // Replace with 100x100 for display in the list
    const rawArtworkUrl = item.attributes.artwork?.url;
    const artworkUrl = rawArtworkUrl
      ? rawArtworkUrl.replace("{w}", "100").replace("{h}", "100")
      : null;

    return {
      id: item.id,
      type: item.type,
      name: item.attributes.name,
      artistName: item.attributes.artistName || "Unknown Artist",
      albumName: item.attributes.albumName || "Unknown Album",
      artworkUrl,
      durationMs: item.attributes.durationInMillis || 0,
      data: item as Record<string, unknown>,
    };
  });
}

export { generateDeveloperToken, getRecentlyPlayed };
export type { PlayedTrack };

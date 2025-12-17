import { SignJWT, importPKCS8 } from "jose";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { Config } from "../config";

interface AppleUserToken {
  userToken: string;
  expiresAt: number;
}

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
  durationMs: number;
  data: Record<string, unknown>;
}

class AppleMusicClient {
  private static readonly API_URL = "https://api.music.apple.com";

  private config: Config;
  private developerToken: string | null = null;
  private developerTokenExpiry: number = 0;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Generate a developer JWT token for MusicKit API
   */
  private async generateDeveloperToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if still valid (with 5 min buffer)
    if (this.developerToken && this.developerTokenExpiry > now + 300) {
      return this.developerToken;
    }

    const privateKey = await importPKCS8(this.config.apple.privateKey, "ES256");

    // Token valid for 1 hour
    const expiry = now + 3600;

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: this.config.apple.keyId })
      .setIssuer(this.config.apple.teamId)
      .setIssuedAt(now)
      .setExpirationTime(expiry)
      .sign(privateKey);

    this.developerToken = token;
    this.developerTokenExpiry = expiry;

    return token;
  }

  /**
   * Load or request user token for Apple Music
   */
  private async getUserToken(): Promise<string> {
    const tokenPath = this.config.paths.appleUserToken;

    // Try to load existing token
    if (existsSync(tokenPath)) {
      const stored: AppleUserToken = JSON.parse(readFileSync(tokenPath, "utf-8"));
      if (stored.expiresAt > Date.now()) {
        return stored.userToken;
      }
    }

    // Need to get a new user token via browser auth
    console.log("\n🍎 Apple Music Authorization Required");
    console.log("━".repeat(50));
    console.log("\nTo authorize songcal with your Apple Music account:");
    console.log("\n1. Open this URL in your browser:");
    console.log("   https://music.apple.com");
    console.log("\n2. Sign in to your Apple Music account");
    console.log("\n3. Open browser Developer Tools (F12)");
    console.log("\n4. Go to Application > Storage > Cookies");
    console.log("\n5. Find the cookie named 'media-user-token'");
    console.log("\n6. Copy its value and paste it below:");
    console.log("");

    const userToken = await this.promptForInput("media-user-token: ");

    if (!userToken.trim()) {
      throw new Error("No user token provided");
    }

    // Store token (valid for ~6 months typically)
    const tokenData: AppleUserToken = {
      userToken: userToken.trim(),
      expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000, // 180 days
    };

    mkdirSync(dirname(tokenPath), { recursive: true });
    writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
    console.log("\n✓ Token saved to", tokenPath);

    return tokenData.userToken;
  }

  private promptForInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      let input = "";
      process.stdin.setEncoding("utf-8");
      process.stdin.once("data", (data) => {
        input = data.toString().trim();
        resolve(input);
      });
    });
  }

  /**
   * Fetch recently played tracks from Apple Music
   */
  async getRecentlyPlayed(): Promise<PlayedTrack[]> {
    const developerToken = await this.generateDeveloperToken();
    const userToken = await this.getUserToken();

    const response = await fetch(`${AppleMusicClient.API_URL}/v1/me/recent/played/tracks?limit=10`, {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Music-User-Token": userToken,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 401 || response.status === 403) {
        // Token expired, delete it and throw
        const tokenPath = this.config.paths.appleUserToken;
        if (existsSync(tokenPath)) {
          const { unlinkSync } = await import("fs");
          unlinkSync(tokenPath);
        }
        throw new Error(`Apple Music auth failed (${response.status}). Please re-run to re-authorize.`);
      }
      throw new Error(`Apple Music API error: ${response.status} - ${text}`);
    }

    const data: RecentlyPlayedResponse = await response.json();

    return data.data.map((item) => ({
      id: item.id,
      type: item.type,
      name: item.attributes.name,
      artistName: item.attributes.artistName || "Unknown Artist",
      albumName: item.attributes.albumName || "Unknown Album",
      durationMs: item.attributes.durationInMillis || 0,
      data: item as Record<string, unknown>,
    }));
  }
}

export { AppleMusicClient };
export type { PlayedTrack };

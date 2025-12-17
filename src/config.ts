import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface Config {
  // Apple MusicKit
  apple: {
    teamId: string;
    keyId: string;
    privateKey: string;
  };
  // Google Calendar
  google: {
    clientId: string;
    clientSecret: string;
    calendarName: string;
  };
  // Paths for token storage
  paths: {
    appleUserToken: string;
    googleToken: string;
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadPrivateKey(pathOrContent: string): string {
  // If it looks like a path, read the file
  if (pathOrContent.endsWith(".p8") || pathOrContent.startsWith("/") || pathOrContent.startsWith("~")) {
    const resolvedPath = pathOrContent.startsWith("~")
      ? join(homedir(), pathOrContent.slice(1))
      : pathOrContent;
    return readFileSync(resolvedPath, "utf-8");
  }
  // Otherwise assume it's the key content directly
  return pathOrContent;
}

function loadConfig(): Config {
  const dataDir = join(homedir(), ".songcal");

  return {
    apple: {
      teamId: requiredEnv("APPLE_TEAM_ID"),
      keyId: requiredEnv("APPLE_KEY_ID"),
      privateKey: loadPrivateKey(requiredEnv("APPLE_PRIVATE_KEY")),
    },
    google: {
      clientId: requiredEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
      calendarName: process.env.GOOGLE_CALENDAR_NAME || "Music History",
    },
    paths: {
      appleUserToken: join(dataDir, "apple-user-token.json"),
      googleToken: join(dataDir, "google-token.json"),
    },
  };
}

export { Config, loadConfig };

import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";
import { SignJWT, importPKCS8 } from "jose";

async function generateDeveloperToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const privateKey = await importPKCS8(env.APPLE_PRIVATE_KEY, "ES256");

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID })
    .setIssuer(env.APPLE_TEAM_ID)
    .setIssuedAt(now)
    .setExpirationTime(expiry)
    .sign(privateKey);

  return token;
}

const Route = createFileRoute("/api/apple-music/token")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const developerToken = await generateDeveloperToken();
          return Response.json({ developerToken });
        } catch (error) {
          console.error("Failed to generate developer token:", error);
          return Response.json({ error: "Failed to generate token" }, { status: 500 });
        }
      },
    },
  },
});

export { Route };

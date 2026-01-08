import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { env, waitUntil } from "cloudflare:workers"
import { db } from "../db"
import { generateId } from "@/utils/uuid"

const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
  }),
  plugins: [tanstackStartCookies()],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      // Request Calendar scope along with standard profile/email
      scope: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar"],
      // Enable offline access to get refresh token
      accessType: "offline",
      prompt: "consent",
    },
  },
  advanced: {
    database: {
      generateId: () => generateId(),
    },
    backgroundTasks: {
      handler: waitUntil,
    },
  },
})

export { auth }

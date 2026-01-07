import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { accounts, syncState } from "@/lib/db/schema"
import { listCalendars, refreshAccessToken } from "@/lib/clients/google-calendar"
import { eq } from "drizzle-orm"
import { env } from "cloudflare:workers"

const Route = createFileRoute("/api/calendars")({
  server: {
    handlers: {
      /**
       * GET /api/calendars - List available Google Calendars
       */
      GET: async ({ request }) => {
        try {
          const session = await auth.api.getSession({ headers: request.headers })
          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
          }

          // Get user's Google account
          const googleAccount = await db
            .select()
            .from(accounts)
            .where(eq(accounts.userId, session.user.id))
            .get()

          if (!googleAccount?.refreshToken) {
            return Response.json({ error: "No Google account linked" }, { status: 400 })
          }

          // Refresh access token
          const { accessToken } = await refreshAccessToken(
            googleAccount.refreshToken,
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET
          )

          // Get calendars
          const calendars = await listCalendars(accessToken)

          // Get user's current calendar selection
          const userSyncState = await db
            .select({ calendarId: syncState.calendarId })
            .from(syncState)
            .where(eq(syncState.userId, session.user.id))
            .get()

          return Response.json({
            calendars,
            selectedCalendarId: userSyncState?.calendarId ?? null,
          })
        } catch (error) {
          console.error("Failed to list calendars:", error)
          return Response.json({ error: "Failed to list calendars" }, { status: 500 })
        }
      },

      /**
       * POST /api/calendars - Save selected calendar
       */
      POST: async ({ request }) => {
        try {
          const session = await auth.api.getSession({ headers: request.headers })
          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
          }

          const body = await request.json()
          const { calendarId } = body as { calendarId: string | null }

          // Upsert sync state with calendar selection
          const existing = await db
            .select()
            .from(syncState)
            .where(eq(syncState.userId, session.user.id))
            .get()

          if (existing) {
            await db
              .update(syncState)
              .set({ calendarId })
              .where(eq(syncState.userId, session.user.id))
          } else {
            await db.insert(syncState).values({
              userId: session.user.id,
              calendarId,
              initialized: false,
            })
          }

          return Response.json({ success: true })
        } catch (error) {
          console.error("Failed to save calendar selection:", error)
          return Response.json({ error: "Failed to save selection" }, { status: 500 })
        }
      },
    },
  },
})

export { Route }


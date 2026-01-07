import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { appleMusicTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const Route = createFileRoute("/api/apple-music/connect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Get current user session
          const session = await auth.api.getSession({ headers: request.headers })
          if (!session?.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 })
          }

          const body = await request.json()
          const { userToken } = body as { userToken: string }

          if (!userToken) {
            return Response.json({ error: "Missing userToken" }, { status: 400 })
          }

          // Apple Music tokens typically last 6 months
          const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)

          // Upsert the token
          const existing = await db
            .select()
            .from(appleMusicTokens)
            .where(eq(appleMusicTokens.userId, session.user.id))
            .get()

          if (existing) {
            await db
              .update(appleMusicTokens)
              .set({ userToken, expiresAt, updatedAt: new Date() })
              .where(eq(appleMusicTokens.userId, session.user.id))
          } else {
            await db.insert(appleMusicTokens).values({
              userId: session.user.id,
              userToken,
              expiresAt,
            })
          }

          return Response.json({ success: true })
        } catch (error) {
          console.error("Failed to save Apple Music token:", error)
          return Response.json({ error: "Failed to save token" }, { status: 500 })
        }
      },
    },
  },
})

export { Route }

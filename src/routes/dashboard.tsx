import { createFileRoute, redirect, useLoaderData } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { CheckCircle, XCircle, Music, Calendar, RefreshCw, Clock } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { AppleMusicConnect } from "@/components/apple-music-connect"
import { auth } from "@/lib/auth/server"
import { db } from "@/lib/db"
import { appleMusicTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const getDashboardData = createServerFn({ method: "GET" }).handler(async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) {
    throw redirect({ to: "/" })
  }

  const token = await db
    .select({ id: appleMusicTokens.id })
    .from(appleMusicTokens)
    .where(eq(appleMusicTokens.userId, session.user.id))
    .get()

  return {
    appleMusicConnected: !!token,
  }
})

function DashboardPage() {
  const { data: session } = authClient.useSession()
  const { appleMusicConnected } = useLoaderData({ from: "/dashboard" })
  const recentTracks: { name: string; artist: string; syncedAt: string }[] = []

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Connection Status */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Google Calendar Status */}
        <div className="p-6 rounded-2xl bg-midnight-900 border border-midnight-700">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-400" />
            </div>
            <StatusBadge connected={true} />
          </div>
          <h3 className="text-lg font-semibold mb-1">Google Calendar</h3>
          <p className="text-zinc-400 text-sm mb-4">Connected as {session?.user?.email}</p>
          <p className="text-xs text-zinc-500">Events sync to a calendar named "Apple Music"</p>
        </div>

        {/* Apple Music Status */}
        <div className="p-6 rounded-2xl bg-midnight-900 border border-midnight-700">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <Music className="w-6 h-6 text-rose-400" />
            </div>
            <StatusBadge connected={appleMusicConnected} />
          </div>
          <h3 className="text-lg font-semibold mb-1">Apple Music</h3>
          {appleMusicConnected ? (
            <p className="text-zinc-400 text-sm">Your listening history is being synced</p>
          ) : (
            <>
              <p className="text-zinc-400 text-sm mb-4">Connect to start syncing your music</p>
              <AppleMusicConnect />
            </>
          )}
        </div>
      </div>

      {/* Sync Status */}
      <div className="p-6 rounded-2xl bg-midnight-900 border border-midnight-700 mb-12">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold">Sync Status</h3>
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Syncs automatically every minute</span>
        </div>
      </div>

      {/* Recent Tracks */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recently Synced</h2>
        {recentTracks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-midnight-900 border border-midnight-700 text-center">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">No tracks synced yet</p>
            <p className="text-sm text-zinc-500 mt-1">
              {appleMusicConnected
                ? "Play some music and tracks will appear here"
                : "Connect Apple Music to start syncing"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTracks.map((track, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-midnight-900 border border-midnight-700 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-zinc-400">{track.artist}</p>
                </div>
                <p className="text-xs text-zinc-500">{track.syncedAt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
      <CheckCircle className="w-3.5 h-3.5" />
      Connected
    </div>
  ) : (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-700/50 text-zinc-400 text-xs font-medium">
      <XCircle className="w-3.5 h-3.5" />
      Not connected
    </div>
  )
}

const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  loader: () => getDashboardData(),
})

export { Route }

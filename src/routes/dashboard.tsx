import { AppleMusicConnect } from "@/components/apple-music-connect"
import { CalendarPicker } from "@/components/calendar-picker"
import { api } from "@/lib/api"
import { redirectIfUnauthenticatedMiddleware } from "@/lib/api/middleware"
import { authClient } from "@/lib/auth/client"
import { db } from "@/lib/db"
import { appleMusicTokens, syncState, tracks } from "@/lib/db/schema"
import { createFileRoute, useLoaderData, useNavigate } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { desc, eq } from "drizzle-orm"
import { AlertTriangle, Calendar, CheckCircle, Clock, Music, RefreshCw, XCircle } from "lucide-react"

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

const getDashboardData = createServerFn({ method: "GET" })
  .middleware([redirectIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const { session } = context

    const token = await db
      .select({ id: appleMusicTokens.id })
      .from(appleMusicTokens)
      .where(eq(appleMusicTokens.userId, session.user.id))
      .get()

    const recentTracksData = await db
      .select({
        name: tracks.name,
        artist: tracks.artistName,
        syncedAt: tracks.createdAt,
      })
      .from(tracks)
      .where(eq(tracks.userId, session.user.id))
      .orderBy(desc(tracks.createdAt))
      .limit(10)
      .all()

    // Get user's calendar selection
    const userSyncState = await db
      .select({ calendarId: syncState.calendarId })
      .from(syncState)
      .where(eq(syncState.userId, session.user.id))
      .get()

    return {
      userEmail: session.user.email,
      appleMusicConnected: !!token,
      selectedCalendarId: userSyncState?.calendarId ?? null,
      recentTracks: recentTracksData.map((t) => ({
        name: t.name,
        artist: t.artist,
        syncedAt: formatRelativeTime(t.syncedAt),
      })),
    }
  })

function DashboardPage() {
  const { userEmail, appleMusicConnected, selectedCalendarId, recentTracks } = useLoaderData({ from: "/dashboard" })
  const navigate = useNavigate()

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
    )
    if (!confirmed) return

    await api.account.delete()
    await authClient.signOut()
    navigate({ to: "/" })
  }

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
          <p className="text-zinc-400 text-sm mb-3">Connected as {userEmail}</p>
          <p className="text-xs text-zinc-500 mb-2">Sync events to:</p>
          <CalendarPicker initialCalendarId={selectedCalendarId} initialCalendarName={null} />
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

      {/* Delete Account */}
      <div className="mt-16 pt-8 border-t border-midnight-700">
        <h2 className="text-xl font-semibold mb-2">Delete Account</h2>
        <p className="text-zinc-400 text-sm mb-4">
          If you no longer wish to use SongCal, you can permanently delete your account.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" />
          Delete My Account
        </button>
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

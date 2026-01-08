import { createFileRoute, useLoaderData, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { AlertTriangle, Calendar, CheckCircle, Music, XCircle } from "lucide-react";

import { AppleMusicConnect } from "@/components/apple-music-connect";
import { CalendarPicker } from "@/components/calendar-picker";
import { api } from "@/lib/api";
import { redirectIfUnauthenticatedMiddleware } from "@/lib/api/middleware";
import { authClient } from "@/lib/auth/client";
import { db } from "@/lib/db";
import { appleMusicTokens, syncState, tracks } from "@/lib/db/schema";
import { formatRelativeTime } from "@/utils/date";

const getDashboardData = createServerFn({ method: "GET" })
  .middleware([redirectIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const { session } = context;

    const token = await db
      .select({ id: appleMusicTokens.id })
      .from(appleMusicTokens)
      .where(eq(appleMusicTokens.userId, session.user.id))
      .get();

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
      .all();

    // Get user's calendar selection
    const userSyncState = await db
      .select({ calendarId: syncState.calendarId })
      .from(syncState)
      .where(eq(syncState.userId, session.user.id))
      .get();

    return {
      userEmail: session.user.email,
      appleMusicConnected: !!token,
      selectedCalendarId: userSyncState?.calendarId ?? null,
      recentTracks: recentTracksData.map((t) => ({
        name: t.name,
        artist: t.artist,
        syncedAt: formatRelativeTime(t.syncedAt),
      })),
    };
  });

function DashboardPage() {
  const { userEmail, appleMusicConnected, selectedCalendarId, recentTracks } = useLoaderData({
    from: "/dashboard",
  });
  const navigate = useNavigate();

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
    );
    if (!confirmed) return;

    await api.account.delete();
    await authClient.signOut();
    navigate({ to: "/" });
  }

  return (
    <main className="">
      <h1 className="">Dashboard</h1>

      {/* Connection Status */}
      <div className="">
        {/* Google Calendar Status */}
        <div className="">
          <div className="">
            <div className="">
              <Calendar className="" />
            </div>
            <StatusBadge connected={true} />
          </div>
          <h3 className="">Google Calendar</h3>
          <p className="">Connected as {userEmail}</p>
          <p className="">Sync events to:</p>
          <CalendarPicker initialCalendarId={selectedCalendarId} initialCalendarName={null} />
        </div>

        {/* Apple Music Status */}
        <div className="">
          <div className="">
            <div className="">
              <Music className="" />
            </div>
            <StatusBadge connected={appleMusicConnected} />
          </div>
          <h3 className="">Apple Music</h3>
          {appleMusicConnected ? (
            <p className="">Your listening history is being synced</p>
          ) : (
            <>
              <p className="">Connect to start syncing your music</p>
              <AppleMusicConnect />
            </>
          )}
        </div>
      </div>

      {/* Recent Tracks */}
      <div>
        <div>
          <h2 className="">
            Recently Synced
            <span className="">
              <span className="" />
              <span className="" />
            </span>
          </h2>
          <p className="">Syncs automatically every minute</p>
        </div>
        {recentTracks.length === 0 ? (
          <div className="">
            <Music className="" />
            <p className="text-zinc-400">No tracks synced yet</p>
            <p className="">
              {appleMusicConnected
                ? "Play some music and tracks will appear here"
                : "Connect Apple Music to start syncing"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTracks.map((track, i) => (
              <div key={i} className="">
                <div>
                  <p className="font-medium">{track.name}</p>
                  <p className="">{track.artist}</p>
                </div>
                <p className="">{track.syncedAt}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="">
        <h2 className="">Delete Account</h2>
        <p className="">
          If you no longer wish to use songcal, you can permanently delete your account.
        </p>
        <button onClick={handleDeleteAccount} className="">
          <AlertTriangle className="" />
          Delete My Account
        </button>
      </div>
    </main>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <div className="">
      <CheckCircle className="" />
      Connected
    </div>
  ) : (
    <div className="">
      <XCircle className="" />
      Not connected
    </div>
  );
}

const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  loader: () => getDashboardData(),
});

export { Route };

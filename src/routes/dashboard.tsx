import { Link, createFileRoute, useLoaderData, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AlertTriangle, Calendar, CheckCircle, LogOut, Music, XCircle } from "lucide-react";

import { AppleMusicConnect } from "@/components/apple-music-connect";
import { CalendarPicker } from "@/components/calendar-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { redirectIfUnauthenticatedMiddleware } from "@/lib/api/middleware";
import { authClient } from "@/lib/auth/client";

const getDashboardData = createServerFn({ method: "GET" })
  .middleware([redirectIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const { session } = context;

    const [appleMusicStatus, recentTracksData, calendarSelection] = await Promise.all([
      api.appleMusic.getConnectionStatus(),
      api.tracks.getRecent(),
      api.calendars.getSelected(),
    ]);

    return {
      userEmail: session.user.email,
      userImage: session.user.image,
      appleMusicConnected: appleMusicStatus.connected,
      selectedCalendarId: calendarSelection.calendarId,
      recentTracks: recentTracksData,
    };
  });

function DashboardPage() {
  const { userEmail, userImage, appleMusicConnected, selectedCalendarId, recentTracks } =
    useLoaderData({
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

  function handleSignOut() {
    authClient.signOut();
  }

  return (
    <>
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-foreground hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-primary to-chart-3 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">songcal</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar>
                <AvatarImage src={userImage ?? undefined} alt="" />
                <AvatarFallback>{userEmail?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{userEmail}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Connection Status */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Google Calendar Status */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-400" />
              </div>
              <StatusBadge connected={true} />
            </div>
            <h3 className="text-lg font-semibold mb-1">Google Calendar</h3>
            <p className="text-muted-foreground text-sm mb-3">Connected as {userEmail}</p>
            <p className="text-xs text-muted-foreground mb-2">Sync events to:</p>
            <CalendarPicker initialCalendarId={selectedCalendarId} initialCalendarName={null} />
          </div>

          {/* Apple Music Status */}
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
                <Music className="w-6 h-6 text-chart-3" />
              </div>
              <StatusBadge connected={appleMusicConnected} />
            </div>
            <h3 className="text-lg font-semibold mb-1">Apple Music</h3>
            {appleMusicConnected ? (
              <p className="text-muted-foreground text-sm">
                Your listening history is being synced
              </p>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-4">
                  Connect to start syncing your music
                </p>
                <AppleMusicConnect />
              </>
            )}
          </div>
        </div>

        {/* Recent Tracks */}
        <div>
          <div>
            <h2 className="text-xl font-semibold inline-flex items-center gap-2">
              Recently Synced
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </h2>
            <p className="text-sm mb-4 text-muted-foreground">Syncs automatically every minute</p>
          </div>
          {recentTracks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center">
              <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tracks synced yet</p>
              <p className="text-sm text-muted-foreground mt-1">
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
                  className="p-4 rounded-xl bg-card border border-border flex items-center gap-4"
                >
                  {track.artworkUrl ? (
                    <img
                      src={track.artworkUrl}
                      alt={`${track.name} artwork`}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{track.syncedAt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Account */}
        <div className="mt-16 pt-8 border-t border-border">
          <h2 className="text-xl font-semibold mb-2">Delete Account</h2>
          <p className="text-muted-foreground text-sm mb-4">
            If you no longer wish to use songcal, you can permanently delete your account.
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
    </>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return connected ? (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
      <CheckCircle className="w-3.5 h-3.5" />
      Connected
    </div>
  ) : (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
      <XCircle className="w-3.5 h-3.5" />
      Not connected
    </div>
  );
}

const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  loader: () => getDashboardData(),
});

export { Route };

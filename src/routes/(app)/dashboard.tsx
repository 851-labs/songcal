import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Calendar, ChevronsUpDown, Loader2, LogOut, Music } from "lucide-react";
import { useCallback, useState } from "react";

import { api } from "@/lib/api";
import { requireAuth } from "@/lib/api/middleware";
import { authClient } from "@/lib/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/ui/item";

function ConnectionsSection() {
  const { data: calendarData } = useSuspenseQuery(api.calendars.list.queryOptions());

  const calendars = calendarData.calendars.filter((c) => c.name !== "Apple Music");
  const selectedCalendar = calendars.find((c) => c.id === calendarData.selectedCalendarId);

  const APPLE_MUSIC_COLOR = "#f43e64";

  const [isSaving, setIsSaving] = useState(false);
  const [currentCalendarId, setCurrentCalendarId] = useState<string | null>(
    calendarData.selectedCalendarId,
  );
  const [currentCalendarName, setCurrentCalendarName] = useState<string | null>(
    selectedCalendar?.name ?? null,
  );
  const [currentCalendarColor, setCurrentCalendarColor] = useState<string>(
    selectedCalendar?.color ?? APPLE_MUSIC_COLOR,
  );

  const handleCalendarChange = useCallback(
    async (value: string) => {
      const calendar = value === "apple-music" ? null : calendars.find((c) => c.id === value);
      setIsSaving(true);
      try {
        await api.calendars.select.mutate({ calendarId: calendar?.id ?? null });
        setCurrentCalendarId(calendar?.id ?? null);
        setCurrentCalendarName(calendar?.name ?? null);
        setCurrentCalendarColor(calendar?.color ?? APPLE_MUSIC_COLOR);
      } catch (error) {
        console.error("Failed to save calendar selection:", error);
      } finally {
        setIsSaving(false);
      }
    },
    [calendars],
  );

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold">Connections</h2>
      <p className="text-sm text-muted-foreground mb-4 mt-0.5">
        Connect your accounts to sync your music listening history.
      </p>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <ItemGroup className="gap-0">
          {/* Google Calendar */}
          <Item>
            <ItemMedia variant="icon">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                Google Calendar
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Connected
                </Badge>
              </ItemTitle>
              <ItemDescription>Choose which calendar to sync to.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" disabled={isSaving} />}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: currentCalendarColor }}
                    />
                  )}
                  {currentCalendarName ?? "Apple Music"}
                  <ChevronsUpDown className="opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuRadioGroup
                    value={currentCalendarId ?? "apple-music"}
                    onValueChange={handleCalendarChange}
                  >
                    <DropdownMenuRadioItem value="apple-music">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: APPLE_MUSIC_COLOR }}
                      />
                      Apple Music
                    </DropdownMenuRadioItem>
                    {calendars.map((calendar) => (
                      <DropdownMenuRadioItem key={calendar.id} value={calendar.id}>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: calendar.color }}
                        />
                        {calendar.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          </Item>

          <ItemSeparator className="my-0 ml-12" />

          {/* Apple Music */}
          <Item>
            <ItemMedia variant="icon">
              <Music className="w-5 h-5 text-muted-foreground" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="inline-flex items-center gap-2">
                Apple Music
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  Connected
                </Badge>
              </ItemTitle>
              <ItemDescription>Your listening history is being synced.</ItemDescription>
            </ItemContent>
          </Item>
        </ItemGroup>
      </div>
    </div>
  );
}

function RecentTracksSection() {
  const { data: tracks } = useSuspenseQuery(api.tracks.getRecent.queryOptions());

  return (
    <div className="mb-12">
      <h2 className="text-xl font-semibold inline-flex items-center gap-2">
        Recently Synced
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      </h2>
      <p className="text-sm mb-4 text-muted-foreground mt-0.5">Syncs automatically every minute.</p>

      {tracks.length === 0 ? (
        <Empty className="rounded-2xl bg-card border border-solid border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Music />
            </EmptyMedia>
            <EmptyTitle>No tracks synced yet</EmptyTitle>
            <EmptyDescription>
              Songs will appear here as you start listening to music.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <ItemGroup className="gap-0">
            {tracks.map((track, i) => (
              <div key={i}>
                {i > 0 && <ItemSeparator className="my-0 ml-18" />}
                <Item>
                  <ItemMedia variant="image">
                    {track.artworkUrl ? (
                      <img src={track.artworkUrl} alt={`${track.name} artwork`} />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{track.name}</ItemTitle>
                    <ItemDescription>{track.artist}</ItemDescription>
                  </ItemContent>
                  <p className="text-xs text-muted-foreground shrink-0">{track.syncedAt}</p>
                </Item>
              </div>
            ))}
          </ItemGroup>
        </div>
      )}
    </div>
  );
}

function DangerZoneSection() {
  const navigate = useNavigate();

  const handleDeleteAccount = useCallback(async () => {
    await api.account.delete.mutate();
    await authClient.signOut();
    navigate({ to: "/" });
  }, [navigate]);

  return (
    <div>
      <h2 className="text-xl font-semibold">Danger Zone</h2>
      <p className="text-sm text-muted-foreground mb-4 mt-0.5">
        If you no longer wish to use songcal, you can permanently delete your account.
      </p>

      <Dialog>
        <DialogTrigger render={<Button variant="destructive" size="lg" />}>
          <AlertTriangle className="w-4 h-4" data-icon="inline-start" />
          Delete My Account
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and all
              your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OnboardingSection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Fetch developer token from server
      const response = await fetch("/api/apple-music/token");
      if (!response.ok) {
        throw new Error("Failed to get developer token");
      }
      const { developerToken } = (await response.json()) as { developerToken: string };

      // Configure MusicKit
      const music = await MusicKit.configure({
        developerToken,
        app: {
          name: "songcal",
          build: "1.0.0",
        },
      });

      // Authorize user
      const userToken = await music.authorize();

      // Send token to server
      const saveResponse = await fetch("/api/apple-music/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save token");
      }

      // Refresh the page to show connected state
      window.location.reload();
    } catch (err) {
      console.error("Apple Music connect error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12">
      <Empty className="border rounded-2xl border-solid border-border bg-card max-w-md ">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Music />
          </EmptyMedia>
          <EmptyTitle>Sync your music to your calendar</EmptyTitle>
          <EmptyDescription>
            Connect Apple Music to automatically add your listening history to Google Calendar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="lg" disabled={isConnecting} onClick={handleConnect}>
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Music className="w-4 h-4" data-icon="inline-start" />
            )}
            Connect Apple Music
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </EmptyContent>
      </Empty>
    </main>
  );
}

function DashboardHeader() {
  const navigate = useNavigate();
  const { data: account } = useSuspenseQuery(api.account.get.queryOptions());

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  }, [navigate]);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
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
              <AvatarImage src={account.image ?? undefined} alt={account.name} />
              <AvatarFallback>{account.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{account.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function DashboardPage() {
  const { data: appleMusicStatus } = useSuspenseQuery(
    api.appleMusic.getConnectionStatus.queryOptions(),
  );

  const appleMusicConnected = appleMusicStatus.connected;

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />

      {appleMusicConnected ? (
        <main className="max-w-3xl mx-auto px-6 py-12 w-full">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

          <ConnectionsSection />
          <RecentTracksSection />
          <DangerZoneSection />
        </main>
      ) : (
        <OnboardingSection />
      )}
    </div>
  );
}

const Route = createFileRoute("/(app)/dashboard")({
  component: DashboardPage,
  beforeLoad: () => requireAuth(),
  loader: async ({ context: { queryClient } }) => {
    // Prefetch all data in parallel to avoid waterfalls
    await Promise.all([
      queryClient.ensureQueryData(api.account.get.queryOptions()),
      queryClient.ensureQueryData(api.appleMusic.getConnectionStatus.queryOptions()),
      queryClient.ensureQueryData(api.calendars.list.queryOptions()),
      queryClient.ensureQueryData(api.tracks.getRecent.queryOptions()),
    ]);
  },
});

export { Route };

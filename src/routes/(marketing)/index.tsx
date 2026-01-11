import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";

import { authClient } from "@/lib/auth/client";

import { Footer } from "./-components/footer";

// Rose accent for dark mode
const EVENT_COLOR = "#e07a8a";

// Songs grouped into 3 tight clusters throughout the day
const SONGS = [
  // Morning commute - 4 songs back to back
  { song: "Espresso", artist: "Sabrina Carpenter", slot: 0, group: 0 },
  { song: "Good Luck, Babe!", artist: "Chappell Roan", slot: 1, group: 0 },
  { song: "Pink Pony Club", artist: "Chappell Roan", slot: 2, group: 0 },
  { song: "365", artist: "Charli XCX", slot: 3, group: 0 },
  // Lunch break - 3 songs
  { song: "Lunch", artist: "Billie Eilish", slot: 0, group: 1 },
  { song: "Birds of a Feather", artist: "Billie Eilish", slot: 1, group: 1 },
  { song: "Saturn", artist: "SZA", slot: 2, group: 1 },
  // Evening - 3 songs
  { song: "Guess", artist: "Charli XCX", slot: 0, group: 2 },
  { song: "Please Please Please", artist: "Sabrina Carpenter", slot: 1, group: 2 },
  { song: "Starburned", artist: "Fred again..", slot: 2, group: 2 },
];

// Group positions (percentage from top of timeline)
const GROUP_POSITIONS = [
  { label: "8am", top: 8 }, // Morning
  { label: "12pm", top: 42 }, // Lunch
  { label: "6pm", top: 72 }, // Evening
];

// Hour markers to show
const HOURS = [
  { label: "8am", top: 4 },
  { label: "10am", top: 20 },
  { label: "12pm", top: 40 },
  { label: "2pm", top: 55 },
  { label: "4pm", top: 68 },
  { label: "6pm", top: 80 },
  { label: "8pm", top: 92 },
];

function LandingPage() {
  const { data: session } = authClient.useSession();

  const handleSignIn = useCallback(() => {
    authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&family=Caveat:wght@400;500&display=swap');
        
        .dark-page {
          --dark-bg: #0c0a09;
          --dark-card: #1c1917;
          --dark-text: #fafaf9;
          --dark-rose: oklch(0.70 0.18 350);
          --dark-muted: #a8a29e;
          --dark-line: rgba(255, 255, 255, 0.08);
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .song-event {
          animation: fade-in 0.4s ease-out both;
        }
      `}</style>

      <div
        className="dark-page min-h-screen w-full relative overflow-hidden"
        style={{ background: "var(--dark-bg)" }}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(var(--dark-line) 1px, transparent 1px),
              linear-gradient(90deg, var(--dark-line) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Header */}
        <header className="relative z-50 px-6 md:px-10 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-60"
              style={{ color: "var(--dark-text)" }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: "var(--dark-rose)" }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <span
                className="text-xl"
                style={{ fontFamily: "Crimson Pro, serif", fontWeight: 600 }}
              >
                songcal
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/851-labs/songcal"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full transition-opacity hover:opacity-60"
                style={{ color: "var(--dark-text)" }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </header>

        {/* Main content - side by side */}
        <main className="relative z-10 px-6 md:px-10 pt-8 lg:pt-0 lg:h-[calc(100vh-88px)] flex items-start lg:items-center">
          <div className="max-w-7xl mx-auto pb-16 lg:pb-0 w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Hero text */}
            <div className="lg:mb-16">
              <span
                className="inline-flex items-center gap-2 text-sm mb-4 ml-1"
                style={{ fontFamily: "Crimson Pro, serif", color: "var(--dark-muted)" }}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                    style={{ background: "var(--dark-rose)" }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-2 w-2"
                    style={{ background: "var(--dark-rose)" }}
                  />
                </span>
                syncing every minute
              </span>
              <h1
                className="text-5xl md:text-5xl lg:text-6xl leading-[1.1] mb-6"
                style={{
                  fontFamily: "Crimson Pro, serif",
                  fontWeight: 600,
                  color: "var(--dark-text)",
                }}
              >
                Your music history,
                <br />
                <span style={{ color: "var(--dark-rose)" }}>on your calendar</span>
              </h1>

              <p
                className="text-xl mb-8 max-w-md"
                style={{ fontFamily: "Crimson Pro, serif", color: "var(--dark-muted)" }}
              >
                Connect Apple Music and Google Calendar. Your songs become calendar events, synced
                every minute.
              </p>

              {/* CTA */}
              <div className="flex flex-row items-start gap-4">
                {session?.user ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                    style={{
                      background: "var(--dark-rose)",
                      color: "white",
                    }}
                  >
                    Sign in with Google
                  </Link>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="inline-flex items-center px-7 py-3.5 rounded-full text-sm font-semibold transition-all hover:scale-105 cursor-pointer"
                    style={{
                      background: "var(--dark-rose)",
                      color: "white",
                    }}
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>

            {/* Right: Day calendar view */}
            <div className="relative">
              {/* Glow underneath calendar */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(224, 122, 138, 0.15) 0%, transparent 60%)",
                }}
              />
              <div
                className="rounded-2xl overflow-hidden h-[520px] relative"
                style={{
                  background: "var(--dark-card)",
                  boxShadow: "0 8px 60px rgba(0, 0, 0, 0.4)",
                  border: "1px solid var(--dark-line)",
                }}
              >
                {/* Day header */}
                <div
                  className="px-5 py-4 flex items-center justify-between border-b sticky top-0 z-10"
                  style={{ borderColor: "var(--dark-line)", background: "var(--dark-card)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        fontFamily: "Crimson Pro, serif",
                        background: "var(--dark-rose)",
                        color: "white",
                      }}
                    >
                      9
                    </span>
                    <div>
                      <span
                        className="block text-sm font-medium"
                        style={{ fontFamily: "Crimson Pro, serif", color: "var(--dark-text)" }}
                      >
                        Thursday
                      </span>
                      <span
                        className="block text-xs"
                        style={{ fontFamily: "Crimson Pro, serif", color: "var(--dark-muted)" }}
                      >
                        January 2026
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      fontFamily: "Caveat, cursive",
                      color: "var(--dark-muted)",
                      fontSize: "1rem",
                    }}
                  >
                    10 songs
                  </span>
                </div>

                {/* Timeline - no scroll */}
                <div className="relative h-[calc(100%-72px)]">
                  {/* Hour lines */}
                  {HOURS.map((hour) => (
                    <div
                      key={hour.label}
                      className="absolute left-0 right-0 flex items-start"
                      style={{ top: `${hour.top}%` }}
                    >
                      <span
                        className="w-12 text-right pr-3 text-xs shrink-0 -mt-2"
                        style={{ fontFamily: "Crimson Pro, serif", color: "var(--dark-muted)" }}
                      >
                        {hour.label}
                      </span>
                      <div
                        className="flex-1 border-t"
                        style={{ borderColor: "var(--dark-line)" }}
                      />
                    </div>
                  ))}

                  {/* Song events - grouped into clusters */}
                  {SONGS.map((song, idx) => {
                    const group = GROUP_POSITIONS[song.group];
                    // Each song in a group is stacked apart
                    const topPercent = group.top + song.slot * 4.5;

                    return (
                      <div
                        key={idx}
                        className="song-event absolute left-14 right-3 rounded-sm flex items-center px-3 gap-2 overflow-hidden cursor-default"
                        style={{
                          top: `${topPercent}%`,
                          height: "16px",
                          background: EVENT_COLOR,
                          animationDelay: `${idx * 0.04}s`,
                        }}
                        title={`${song.song} - ${song.artist}`}
                      >
                        <span
                          className="text-[11px] font-medium truncate"
                          style={{ fontFamily: "Crimson Pro, serif", color: "white" }}
                        >
                          {song.song}
                        </span>
                        <span
                          className="text-[11px] truncate opacity-70 hidden sm:inline"
                          style={{ fontFamily: "Crimson Pro, serif", color: "white" }}
                        >
                          {song.artist}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

const Route = createFileRoute("/(marketing)/")({
  component: LandingPage,
});

export { Route };

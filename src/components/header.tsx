import { Link } from "@tanstack/react-router";
import { Music } from "lucide-react";

import { authClient } from "@/lib/auth/client";

function Header() {
  const { data: session, isPending } = authClient.useSession();

  const handleSignIn = () => {
    authClient.signIn.social({ provider: "google" });
  };

  const handleSignOut = () => {
    authClient.signOut();
  };

  return (
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

        <nav className="flex items-center gap-4">
          {isPending ? (
            <div className="w-24 h-9 rounded-lg bg-muted animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                )}
                <button
                  onClick={handleSignOut}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold text-sm transition-colors cursor-pointer"
            >
              Get started
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export { Header };

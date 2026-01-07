import { Link } from "@tanstack/react-router"
import { Music } from "lucide-react"
import { authClient } from "@/lib/auth/client"

function Header() {
  const { data: session, isPending } = authClient.useSession()

  const handleSignIn = () => {
    authClient.signIn.social({ provider: "google" })
  }

  const handleSignOut = () => {
    authClient.signOut()
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-midnight-950/80 border-b border-midnight-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-white hover:text-violet-400 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">songcal</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isPending ? (
            <div className="w-24 h-9 rounded-lg bg-midnight-800 animate-pulse" />
          ) : session?.user ? (
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <button
                  onClick={handleSignOut}
                  className="text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-4 py-2 rounded-lg bg-midnight-800 hover:bg-midnight-700 text-sm font-medium transition-colors cursor-pointer"
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

export { Header }


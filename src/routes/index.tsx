import { createFileRoute } from "@tanstack/react-router"
import { Music, Calendar, Zap, ArrowRight } from "lucide-react"
import { authClient } from "@/lib/auth/client"

function LandingPage() {
  const { data: session, isPending } = authClient.useSession()

  const handleSignIn = () => {
    authClient.signIn.social({ provider: "google" })
  }

  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-500/20 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-midnight-800 border border-midnight-600 text-sm text-violet-400 mb-8">
            <Zap className="w-4 h-4" />
            <span>Automatic sync every minute</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Your music history,
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              on your calendar
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-12">
            Connect your Apple Music and Google Calendar. Every song you play appears as a calendar event—automatically.
          </p>

          {isPending ? (
            <div className="h-14" />
          ) : session?.user ? (
            <a
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-lg transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </a>
          ) : (
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold text-lg transition-colors cursor-pointer"
            >
              Sign in with Google
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Music className="w-6 h-6" />}
            title="Apple Music"
            description="Connect with MusicKit. We securely sync your recently played tracks."
          />
          <FeatureCard
            icon={<Calendar className="w-6 h-6" />}
            title="Google Calendar"
            description="Events appear in a dedicated calendar with song details and links."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Always in Sync"
            description="Background sync runs every minute. Your calendar stays up to date."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-midnight-700 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <Step number={1} title="Sign in" description="Connect your Google account to get started." />
            <Step number={2} title="Connect Apple Music" description="Authorize songcal to read your listening history." />
            <Step number={3} title="Enjoy" description="Your music history syncs to Google Calendar automatically." />
          </div>
        </div>
      </section>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-midnight-900 border border-midnight-700 hover:border-midnight-600 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center font-bold text-lg mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  )
}

const Route = createFileRoute("/")({
  component: LandingPage,
})

export { Route }


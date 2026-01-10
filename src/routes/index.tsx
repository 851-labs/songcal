import { createFileRoute } from "@tanstack/react-router";
import { Music, Calendar, Zap } from "lucide-react";

import { authClient } from "@/lib/auth/client";

function LandingPage() {
  const { data: session, isPending } = authClient.useSession();

  const handleSignIn = () => {
    authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  };

  return (
    <main className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-primary/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm text-primary mb-8">
            <Zap className="w-4 h-4" />
            <span>Automatic sync every minute</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Your music history,
            <br />
            <span className="bg-linear-to-r from-chart-2 via-chart-3 to-chart-4 bg-clip-text text-transparent">
              on your calendar
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Connect your Apple Music and Google Calendar. Every song you play appears as a calendar
            event—automatically.
          </p>

          {isPending ? (
            <div className="h-14" />
          ) : session?.user ? (
            <a
              href="/dashboard"
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg transition-colors"
            >
              Go to Dashboard
            </a>
          ) : (
            <button
              onClick={handleSignIn}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg transition-colors cursor-pointer"
            >
              Get started
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
      <section className="border-t border-border py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <Step
              number={1}
              title="Sign in"
              description="Connect your Google account to get started."
            />
            <Step
              number={2}
              title="Connect Apple Music"
              description="Authorize songcal to read your listening history."
            />
            <Step
              number={3}
              title="Enjoy"
              description="Your music history syncs to Google Calendar automatically."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

const Route = createFileRoute("/")({
  component: LandingPage,
});

export { Route };

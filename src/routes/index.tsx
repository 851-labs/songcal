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
      <section className="">
        {/* Background gradient */}
        <div className="" />
        <div className="" />

        <div className="">
          <div className="">
            <Zap className="" />
            <span>Automatic sync every minute</span>
          </div>

          <h1 className="">
            Your music history,
            <br />
            <span className="">on your calendar</span>
          </h1>

          <p className="">
            Connect your Apple Music and Google Calendar. Every song you play appears as a calendar
            event—automatically.
          </p>

          {isPending ? (
            <div className="h-14" />
          ) : session?.user ? (
            <a href="/dashboard" className="">
              Go to Dashboard
            </a>
          ) : (
            <button onClick={handleSignIn} className="">
              Get started
            </button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="">
        <div className="">
          <FeatureCard
            icon={<Music className="" />}
            title="Apple Music"
            description="Connect with MusicKit. We securely sync your recently played tracks."
          />
          <FeatureCard
            icon={<Calendar className="" />}
            title="Google Calendar"
            description="Events appear in a dedicated calendar with song details and links."
          />
          <FeatureCard
            icon={<Zap className="" />}
            title="Always in Sync"
            description="Background sync runs every minute. Your calendar stays up to date."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="">
        <div className="">
          <h2 className="">How it works</h2>
          <div className="">
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
    <div className="">
      <div className="">{icon}</div>
      <h3 className="">{title}</h3>
      <p className="text-zinc-400">{description}</p>
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
      <div className="">{number}</div>
      <h3 className="">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  );
}

const Route = createFileRoute("/")({
  component: LandingPage,
});

export { Route };

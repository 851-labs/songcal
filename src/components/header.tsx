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
    <header className="">
      <div className="">
        <Link to="/" className="">
          <div className="">
            <Music className="" />
          </div>
          <span className="">songcal</span>
        </Link>

        <nav className="">
          {isPending ? (
            <div className="" />
          ) : session?.user ? (
            <div className="">
              <Link to="/dashboard" className="">
                Dashboard
              </Link>
              <div className="">
                {session.user.image && <img src={session.user.image} alt="" className="" />}
                <button onClick={handleSignOut} className="">
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleSignIn} className="">
              Get started
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export { Header };

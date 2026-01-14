import type { QueryClient } from "@tanstack/react-query";

import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { configure } from "onedollarstats";
import { useEffect } from "react";

import appCss from "../styles.css?url";

const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "songcal - Sync Apple Music to Google Calendar" },
      {
        name: "description",
        content:
          "Automatically sync your Apple Music listening history to Google Calendar. See what you listened to, when you listened to it.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      // Load MusicKit JS from Apple CDN
      { src: "https://js-cdn.music.apple.com/musickit/v3/musickit.js", async: true },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configure();
  }, []);

  return (
    <html lang="en" className="dark font-sans">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground font-sans min-h-screen antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}

export { Route };

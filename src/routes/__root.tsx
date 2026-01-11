import type { QueryClient } from "@tanstack/react-query";

import { HeadContent, Scripts, createRootRouteWithContext, Outlet } from "@tanstack/react-router";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

const Route = createRootRouteWithContext<RouterContext>()({
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
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" className="dark font-sans">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground font-sans min-h-screen antialiased">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

export { Route };

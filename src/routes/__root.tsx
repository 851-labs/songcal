import { HeadContent, Scripts, createRootRoute, Outlet } from "@tanstack/react-router"
import { Header } from "../components/header"
import appCss from "../styles.css?url"

const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "songcal - Sync Apple Music to Google Calendar" },
      {
        name: "description",
        content: "Automatically sync your Apple Music listening history to Google Calendar. See what you listened to, when you listened to it.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      // Load MusicKit JS from Apple CDN
      { src: "https://js-cdn.music.apple.com/musickit/v3/musickit.js", async: true },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-midnight-950 text-white min-h-screen antialiased">
        <Header />
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}

export { Route }


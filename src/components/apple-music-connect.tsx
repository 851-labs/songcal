import { useState } from "react"
import { Music, Loader2 } from "lucide-react"

function AppleMusicConnect() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      // Fetch developer token from server
      const response = await fetch("/api/apple-music/token")
      if (!response.ok) {
        throw new Error("Failed to get developer token")
      }
      const { developerToken } = (await response.json()) as { developerToken: string }

      // Configure MusicKit
      const music = await MusicKit.configure({
        developerToken,
        app: {
          name: "songcal",
          build: "1.0.0",
        },
      })

      // Authorize user
      const userToken = await music.authorize()

      // Send token to server
      const saveResponse = await fetch("/api/apple-music/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken }),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save token")
      }

      // Refresh the page to show connected state
      window.location.reload()
    } catch (err) {
      console.error("Apple Music connect error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 rounded-lg font-medium text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Music className="w-4 h-4" />
            Connect Apple Music
          </>
        )}
      </button>
      {error && <p className="text-sm text-rose-400 mt-2">{error}</p>}
    </div>
  )
}

export { AppleMusicConnect }

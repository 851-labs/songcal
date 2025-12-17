# songcal

Sync your Apple Music listening history to Google Calendar.

## Prerequisites

- [Bun](https://bun.sh) runtime
- Apple Developer account ($99/year)
- Google Cloud project with Calendar API enabled

## Setup

### 1. Apple MusicKit Credentials

1. Go to [Apple Developer > Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Create a new key with **MusicKit** enabled
3. Download the `.p8` file and note your **Key ID**
4. Find your **Team ID** in your [account membership](https://developer.apple.com/account#MembershipDetailsCard)

### 2. Google Calendar Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project (or use existing)
3. Enable the **Google Calendar API**
4. Create **OAuth 2.0 credentials** (Desktop app type)
5. Note your **Client ID** and **Client Secret**

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=~/path/to/AuthKey_XXXXXX.p8

GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### 4. Install Dependencies

```bash
bun install
```

## Usage

### One-time sync

```bash
bun run sync
```

On first run, you'll be prompted to:
1. Authorize with Google Calendar (browser popup)
2. Provide your Apple Music user token (from browser cookies)

### Automated sync (cron)

Run every 5 minutes to catch all your listening:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path)
*/5 * * * * cd ~/repos/pondorasti/songcal && bun run sync >> ~/.songcal/sync.log 2>&1
```

## How It Works

1. Fetches your last ~10 played tracks from Apple Music
2. Checks Google Calendar for existing events (avoids duplicates)
3. Creates events for new tracks with song title, artist, album, and duration

## Data Storage

Tokens are stored in `~/.songcal/`:
- `apple-user-token.json` - Apple Music user token
- `google-token.json` - Google OAuth tokens

## Limitations

- Apple Music API returns only the **last 10 tracks** with **no timestamps**
- Events are timestamped when synced, not when actually played
- Poll frequently (every 3-5 min) to minimize missed tracks

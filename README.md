# songcal

Sync your Apple Music listening history to Google Calendar.

## Prerequisites

- [Bun](https://bun.sh) runtime
- PostgreSQL database
- Apple Developer account
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
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/songcal"

# Apple Music
APPLE_TEAM_ID="XXXXXXXXXX"
APPLE_KEY_ID="XXXXXXXXXX"
APPLE_PRIVATE_KEY="./AuthKey_XXXXXX.p8"

# Google Calendar
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"

# Optional
SYNC_INTERVAL_MS="60000"  # Default: 1 minute
GOOGLE_CALENDAR_NAME="Apple Music"  # Default calendar name
```

### 4. Install & Setup Database

```bash
bun install
bun run db:push
```

## Usage

### Run the service

```bash
bun run start
```

On first run:
1. **Cold start**: Initial tracks are recorded as baseline (no calendar events created)
2. **Google auth**: Browser opens for Calendar authorization
3. **Apple auth**: Paste your `media-user-token` from browser cookies

The service then polls Apple Music every minute. New tracks are synced to Google Calendar with accurate timestamps.

### Database commands

```bash
bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
```

## How It Works

1. **Cold start detection**: First run stores baseline tracks without creating calendar events
2. **Polling**: Fetches recently played tracks every minute
3. **Deduplication**: Compares with previous poll to find truly new plays
4. **Sync**: Creates calendar events for new tracks with current timestamp
5. **Storage**: All tracks stored in Postgres for history

## Architecture

```
src/
├── clients/
│   ├── apple-music.ts      # Apple Music API client
│   └── google-calendar.ts  # Google Calendar API client
├── db/
│   ├── index.ts            # Database connection
│   └── schema.ts           # Drizzle schema
├── config.ts               # Environment config
├── sync.ts                 # Sync logic
└── index.ts                # Entry point
```

## Data Storage

**Database tables:**
- `tracks` - Listening history with metadata
- `sync_state` - Service state (last seen tracks, initialization flag)

**Local tokens** (`~/.songcal/`):
- `apple-user-token.json` - Apple Music user token
- `google-token.json` - Google OAuth tokens

## Limitations

- Apple Music API returns only the **last 10 tracks** with **no timestamps**
- Timestamps reflect when tracks were detected, not exact play time
- Accuracy depends on poll frequency (default: 1 minute)

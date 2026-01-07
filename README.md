# songcal

Sync your Apple Music listening history to Google Calendar—automatically.

## Overview

songcal is a web application that connects your Apple Music and Google Calendar accounts. Every song you play is automatically added to a dedicated calendar as an event, giving you a visual history of your music listening.

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- **Auth**: [better-auth](https://www.better-auth.com) with Google OAuth
- **Background Jobs**: Cloudflare Cron Triggers + Queues
- **Styling**: [Tailwind CSS](https://tailwindcss.com)

## Features

- Sign in with Google (also grants Calendar access)
- Connect Apple Music via MusicKit JS
- Automatic sync every 1 minute
- Calendar events with song details and Apple Music links
- Multi-user support

## Prerequisites

- [Bun](https://bun.sh) runtime
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account
- Apple Developer account with MusicKit enabled
- Google Cloud project with Calendar API enabled

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/851-labs/songcal.git
cd songcal
bun install
```

### 2. Apple MusicKit Credentials

1. Go to [Apple Developer > Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Create a new key with **MusicKit** enabled
3. Download the `.p8` file
4. Note your **Key ID** and **Team ID**

### 3. Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create or select a project
3. Enable the **Google Calendar API**
4. Create **OAuth 2.0 credentials** (Web application type)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
6. Note your **Client ID** and **Client Secret**

### 4. Create Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create songcal

# Create Queue
wrangler queues create songcal-sync
```

Update `wrangler.jsonc` with your D1 database ID from the create command output.

### 5. Configure Local Environment

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```bash
BETTER_AUTH_SECRET="generate-a-random-32-char-secret"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
APPLE_TEAM_ID="XXXXXXXXXX"
APPLE_KEY_ID="XXXXXXXXXX"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...your key content...
-----END PRIVATE KEY-----"
```

### 6. Run Database Migrations

```bash
# Generate migrations from schema
bun run db:migrations:generate

# Apply migrations locally
bun run db:migrations:apply
```

### 7. Start Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### 1. Set Production Secrets

```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put APPLE_TEAM_ID
wrangler secret put APPLE_KEY_ID
wrangler secret put APPLE_PRIVATE_KEY
```

### 2. Update Production URL

Edit `wrangler.jsonc` and update `BETTER_AUTH_URL` to your production domain.

### 3. Apply Production Migrations

```bash
bun run db:migrations:apply:prod
```

### 4. Deploy

```bash
bun run deploy
```

## Project Structure

```
songcal/
├── src/
│   ├── components/          # React components
│   │   ├── header.tsx
│   │   └── apple-music-connect.tsx
│   ├── lib/
│   │   ├── auth/            # better-auth config
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── db/              # D1 database
│   │   │   ├── index.ts
│   │   │   └── schema/
│   │   ├── clients/         # API clients
│   │   │   ├── apple-music.ts
│   │   │   └── google-calendar.ts
│   │   └── sync.ts          # Sync logic
│   ├── routes/              # TanStack Router pages
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   └── api/
│   │       ├── auth/$.ts
│   │       ├── cron.ts
│   │       └── apple-music/
│   ├── server.ts            # Worker entry point
│   └── styles.css           # Tailwind styles
├── drizzle/
│   └── migrations/          # D1 migrations
├── public/
├── wrangler.jsonc           # Cloudflare config
├── vite.config.ts
├── drizzle.config.ts
└── package.json
```

## How It Works

1. **User signs in** with Google → better-auth handles OAuth, stores tokens
2. **User connects Apple Music** → MusicKit JS authorization, token stored
3. **Cron runs every minute** → enqueues sync job per user
4. **Queue processes jobs** → fetches Apple Music history, creates Calendar events
5. **Cold start protection** → first sync records baseline, no events created

## Database Tables

| Table                | Description                      |
| -------------------- | -------------------------------- |
| `users`              | User accounts (from better-auth) |
| `sessions`           | Active sessions                  |
| `accounts`           | OAuth tokens (Google)            |
| `apple_music_tokens` | MusicKit user tokens             |
| `tracks`             | Synced listening history         |
| `sync_state`         | Per-user sync state              |

## Environment Variables

| Variable               | Description                                   |
| ---------------------- | --------------------------------------------- |
| `BETTER_AUTH_SECRET`   | Secret for session encryption                 |
| `BETTER_AUTH_URL`      | App URL (e.g., `https://songcal.example.com`) |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                        |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                    |
| `APPLE_TEAM_ID`        | Apple Developer Team ID                       |
| `APPLE_KEY_ID`         | Apple MusicKit Key ID                         |
| `APPLE_PRIVATE_KEY`    | Apple MusicKit private key (PEM)              |

## Commands

| Command                            | Description                     |
| ---------------------------------- | ------------------------------- |
| `bun run dev`                      | Start development server        |
| `bun run build`                    | Build for production            |
| `bun run deploy`                   | Build and deploy to Cloudflare  |
| `bun run types:check`              | TypeScript check                |
| `bun run db:migrations:generate`   | Generate migrations from schema |
| `bun run db:migrations:apply`      | Apply migrations (local)        |
| `bun run db:migrations:apply:prod` | Apply migrations (production)   |

## Limitations

- Apple Music API returns only the **last 10 tracks** with **no timestamps**
- Timestamps reflect when tracks were detected, not exact play time
- Sync frequency: every 1 minute

## License

MIT

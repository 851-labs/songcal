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

## Commands

| Command                      | Description                      |
| ---------------------------- | -------------------------------- |
| `bun dev`                    | Start development server         |
| `bun run build`              | Build for production             |
| `bun run deploy`             | Build and deploy to Cloudflare   |
| `bun types:check`            | TypeScript check                 |
| `bun types:generate`         | Generate Cloudflare Worker types |
| `bun db:migrations:generate` | Generate migrations from schema  |
| `bun db:migrations:list`     | List migrations (local)          |
| `bun db:migrations:apply`    | Apply migrations (local)         |

## Limitations

- Apple Music API returns only the **last 10 tracks** with **no timestamps**
- Timestamps reflect when tracks were detected, not exact play time
- Sync frequency: every 1 minute

## License

MIT
